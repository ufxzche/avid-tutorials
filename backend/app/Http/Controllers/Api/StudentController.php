<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Favorite;
use App\Models\Lesson;
use App\Models\LessonComment;
use App\Models\LessonMaterial;
use App\Models\LessonProgress;
use App\Models\Notification;
use App\Models\Review;
use App\Services\PlatformService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentController extends Controller
{
    public function enroll(int $courseId)
    {
        $course = Course::find($courseId);
        if (!$course) {
            return response()->json(['error' => 'Kurs topilmadi'], 404);
        }

        if (Enrollment::where('user_id', Auth::id())->where('course_id', $course->id)->exists()) {
            return response()->json(['error' => 'Allaqachon yozilgansiz'], 409);
        }

        Enrollment::create(['user_id' => Auth::id(), 'course_id' => $course->id]);
        $course->increment('enrollment_count');

        return response()->json(['message' => 'Muvaffaqiyatli yozildingiz'], 201);
    }

    public function enrollments()
    {
        $rows = Enrollment::query()
            ->join('courses', 'courses.id', '=', 'enrollments.course_id')
            ->where('enrollments.user_id', Auth::id())
            ->orderByDesc('enrollments.created_at')
            ->get([
                'enrollments.progress_percent', 'enrollments.created_at',
                'courses.slug', 'courses.title', 'courses.thumbnail_url', 'courses.icon_url',
                'courses.programming_language', 'courses.lesson_count', 'courses.id as course_id',
            ]);

        return response()->json(['enrollments' => $rows]);
    }

    public function toggleFavorite(int $courseId, string $action)
    {
        if ($action === 'add') {
            Favorite::firstOrCreate(['user_id' => Auth::id(), 'course_id' => $courseId]);

            return response()->json(['message' => 'Sevimlilarga qo\'shildi']);
        }

        Favorite::where('user_id', Auth::id())->where('course_id', $courseId)->delete();

        return response()->json(['message' => 'O\'chirildi']);
    }

    public function postReview(int $courseId, Request $request, PlatformService $platform)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10|max:1000',
        ]);

        if (!Enrollment::where('user_id', Auth::id())->where('course_id', $courseId)->exists()) {
            return response()->json(['error' => 'Avval kursga yoziling'], 403);
        }

        Review::updateOrCreate(
            ['user_id' => Auth::id(), 'course_id' => $courseId],
            ['rating' => $data['rating'], 'comment' => trim($data['comment'])]
        );

        $platform->refreshCourseRating($courseId);

        return response()->json(['message' => 'Sharh saqlandi']);
    }

    public function lesson(int $lessonId)
    {
        $lesson = Lesson::query()
            ->join('courses', 'courses.id', '=', 'lessons.course_id')
            ->where('lessons.id', $lessonId)
            ->select([
                'lessons.*',
                'courses.slug as course_slug',
                'courses.title as course_title',
                'courses.id as course_id',
                'courses.instructor_id',
            ])
            ->first();

        if (!$lesson) {
            return response()->json(['error' => 'Dars topilmadi'], 404);
        }

        $user = Auth::user();
        $canWatch = $lesson->is_preview
            || Enrollment::where('user_id', $user->id)->where('course_id', $lesson->course_id)->exists();

        if (!$canWatch && $user->role === 'student') {
            return response()->json(['error' => 'Kursga yoziling'], 403);
        }

        $progress = LessonProgress::where('user_id', $user->id)->where('lesson_id', $lesson->id)->first();
        $comments = LessonComment::query()
            ->join('users', 'users.id', '=', 'lesson_comments.user_id')
            ->where('lesson_comments.lesson_id', $lesson->id)
            ->orderByDesc('lesson_comments.created_at')
            ->get([
                'lesson_comments.id', 'lesson_comments.body', 'lesson_comments.likes',
                'lesson_comments.created_at', 'lesson_comments.parent_id',
                'users.name', 'users.avatar_url',
            ]);

        $materials = [];
        if ($canWatch || $user->role !== 'student') {
            $materials = LessonMaterial::where('lesson_id', $lesson->id)
                ->orderBy('sort_order')
                ->get(['id', 'title', 'file_url', 'file_type', 'file_size']);
        }

        return response()->json([
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'video_url' => ($canWatch || $user->role !== 'student') ? $lesson->video_url : null,
                'duration_seconds' => $lesson->duration_seconds,
                'course_slug' => $lesson->course_slug,
                'course_title' => $lesson->course_title,
                'materials' => $materials,
            ],
            'progress' => $progress ? [
                'watched_seconds' => $progress->watched_seconds,
                'completed' => $progress->completed,
            ] : ['watched_seconds' => 0, 'completed' => 0],
            'comments' => $comments,
        ]);
    }

    public function saveProgress(int $lessonId, Request $request, PlatformService $platform)
    {
        $data = $request->validate([
            'watched_seconds' => 'required|integer|min:0',
            'completed' => 'sometimes|boolean',
        ]);

        $lesson = Lesson::find($lessonId);
        if (!$lesson) {
            return response()->json(['error' => 'Dars topilmadi'], 404);
        }

        $completed = ($data['completed'] ?? false)
            || $data['watched_seconds'] >= max($lesson->duration_seconds - 30, $lesson->duration_seconds * 0.9);

        $progress = LessonProgress::firstOrNew([
            'user_id' => Auth::id(),
            'lesson_id' => $lesson->id,
        ]);
        $progress->watched_seconds = max($progress->watched_seconds ?? 0, $data['watched_seconds']);
        $progress->completed = $progress->completed || $completed;
        $progress->updated_at = now();
        $progress->save();

        $pct = $platform->calcProgress(Auth::id(), $lesson->course_id);
        Enrollment::where('user_id', Auth::id())->where('course_id', $lesson->course_id)
            ->update(['progress_percent' => $pct]);

        if ($completed && $pct >= 100) {
            Enrollment::where('user_id', Auth::id())->where('course_id', $lesson->course_id)
                ->update(['completed_at' => now()]);
        }

        return response()->json(['progress_percent' => $pct, 'completed' => (bool) $completed]);
    }

    public function postComment(int $lessonId, Request $request)
    {
        $data = $request->validate(['body' => 'required|string|min:2|max:500', 'parent_id' => 'nullable|integer']);

        $lesson = Lesson::find($lessonId);
        if (!$lesson) {
            return response()->json(['error' => 'Dars topilmadi'], 404);
        }

        $comment = LessonComment::create([
            'lesson_id' => $lessonId,
            'user_id' => Auth::id(),
            'parent_id' => $data['parent_id'] ?? null,
            'body' => trim($data['body']),
        ]);

        return response()->json(['id' => $comment->id], 201);
    }

    public function notifications()
    {
        $items = Notification::where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['id', 'type', 'title', 'body', 'link', 'is_read', 'created_at']);

        return response()->json(['notifications' => $items]);
    }

    public function markNotificationRead(int $id)
    {
        Notification::where('id', $id)->where('user_id', Auth::id())->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }

    public function certificates()
    {
        $items = Certificate::query()
            ->join('courses', 'courses.id', '=', 'certificates.course_id')
            ->where('certificates.user_id', Auth::id())
            ->get(['certificates.code', 'certificates.issued_at', 'courses.title', 'courses.slug']);

        return response()->json(['certificates' => $items]);
    }

    public function dashboard()
    {
        $user = Auth::user();
        $enrollments = Enrollment::where('user_id', $user->id)->count();
        $completed = Enrollment::where('user_id', $user->id)->where('progress_percent', '>=', 100)->count();

        return response()->json([
            'enrollments' => $enrollments,
            'completed' => $completed,
        ]);
    }
}
