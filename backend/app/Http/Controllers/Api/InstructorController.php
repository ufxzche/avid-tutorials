<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonMaterial;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Services\PlatformService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InstructorController extends Controller
{
    public function dashboard(Request $request, PlatformService $platform)
    {
        $instructorId = $this->instructorScopeId($request);

        $courses = Course::where('instructor_id', $instructorId)->count();
        $students = DB::table('enrollments')
            ->join('courses', 'courses.id', '=', 'enrollments.course_id')
            ->where('courses.instructor_id', $instructorId)
            ->distinct('enrollments.user_id')
            ->count('enrollments.user_id');

        $views = DB::table('lesson_progress')
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->join('courses', 'courses.id', '=', 'lessons.course_id')
            ->where('courses.instructor_id', $instructorId)
            ->count();

        $completions = DB::table('enrollments')
            ->join('courses', 'courses.id', '=', 'enrollments.course_id')
            ->where('courses.instructor_id', $instructorId)
            ->where('enrollments.progress_percent', '>=', 100)
            ->count();

        $avgRating = Course::where('instructor_id', $instructorId)->avg('rating_avg');

        $popular = Course::where('instructor_id', $instructorId)
            ->orderByDesc('enrollment_count')
            ->limit(5)
            ->get(['id', 'title', 'enrollment_count', 'rating_avg', 'slug']);

        return response()->json([
            'courses' => $courses,
            'students' => $students,
            'views' => $views,
            'completions' => $completions,
            'rating_avg' => round($avgRating ?? 0, 2),
            'watch_hours' => (int) round(
                DB::table('lesson_progress')
                    ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
                    ->join('courses', 'courses.id', '=', 'lessons.course_id')
                    ->where('courses.instructor_id', $instructorId)
                    ->sum('lesson_progress.watched_seconds') / 3600
            ),
            'popular' => $popular,
        ]);
    }

    public function courses(Request $request)
    {
        $instructorId = $this->instructorScopeId($request);

        $courses = Course::where('instructor_id', $instructorId)
            ->orderByDesc('created_at')
            ->get([
                'id', 'slug', 'title', 'status', 'enrollment_count', 'rating_avg',
                'rating_count', 'lesson_count', 'is_free', 'price', 'programming_language',
            ]);

        return response()->json(['courses' => $courses]);
    }

    public function showCourse(int $id, Request $request, PlatformService $platform)
    {
        $course = $this->authorizeCourse($id);
        if ($course instanceof JsonResponse) {
            return $course;
        }

        $modules = Module::where('course_id', $course->id)
            ->orderBy('sort_order')
            ->get();

        $lessons = Lesson::with('materials')
            ->where('course_id', $course->id)
            ->orderBy('sort_order')
            ->get();

        $lessonIds = $lessons->pluck('id');
        $quizLessonIds = Quiz::whereIn('lesson_id', $lessonIds)->pluck('lesson_id')->flip();

        $modulesPayload = $modules->map(function ($m) use ($lessons, $quizLessonIds) {
            return [
                'id' => $m->id,
                'title' => $m->title,
                'sort_order' => $m->sort_order,
                'lessons' => $lessons->where('module_id', $m->id)->map(fn ($l) => $this->lessonPayload($l, $quizLessonIds))->values(),
            ];
        });

        return response()->json([
            'course' => $course,
            'modules' => $modulesPayload,
            'stats' => $platform->courseStats($course->id),
        ]);
    }

    public function courseStats(int $id, PlatformService $platform)
    {
        $course = $this->authorizeCourse($id);
        if ($course instanceof JsonResponse) {
            return $course;
        }

        return response()->json(['stats' => $platform->courseStats($course->id)]);
    }

    public function createCourse(Request $request, PlatformService $platform)
    {
        $data = $request->validate([
            'title' => 'required|string|min:3|max:120',
            'description' => 'required|string|min:20|max:5000',
            'programming_language' => 'required|string|max:64',
            'level' => 'required|in:beginner,intermediate,advanced',
            'is_free' => 'sometimes|boolean',
            'price' => 'nullable|numeric|min:0|max:99999',
        ]);

        $slug = $platform->uniqueSlug('courses', $data['title']);
        $cat = Category::where('slug', $data['programming_language'])->first();

        $course = Course::create([
            'slug' => $slug,
            'title' => trim($data['title']),
            'description' => trim($data['description']),
            'programming_language' => $data['programming_language'],
            'level' => $data['level'],
            'is_free' => true,
            'price' => 0,
            'instructor_id' => Auth::id(),
            'category_id' => $cat?->id,
            'status' => 'draft',
        ]);

        $module = Module::create([
            'course_id' => $course->id,
            'title' => 'Kirish',
            'sort_order' => 1,
        ]);

        return response()->json(['id' => $course->id, 'slug' => $slug, 'module_id' => $module->id], 201);
    }

    public function updateCourse(int $id, Request $request)
    {
        $course = $this->authorizeCourse($id);
        if ($course instanceof JsonResponse) {
            return $course;
        }

        $data = $request->validate([
            'title' => 'sometimes|string|min:3|max:120',
            'description' => 'sometimes|string|min:20|max:5000',
            'level' => 'sometimes|in:beginner,intermediate,advanced',
            'is_free' => 'sometimes|boolean',
            'price' => 'nullable|numeric|min:0|max:99999',
            'status' => 'sometimes|in:draft,published,archived',
            'programming_language' => 'sometimes|string|max:64',
        ]);

        foreach (['title', 'description', 'level', 'status', 'programming_language'] as $f) {
            if (array_key_exists($f, $data)) {
                $course->{$f} = $data[$f];
            }
        }
        if (array_key_exists('is_free', $data)) {
            $course->is_free = filter_var($data['is_free'], FILTER_VALIDATE_BOOLEAN);
            if ($course->is_free) {
                $course->price = 0;
            }
        }
        if (array_key_exists('price', $data) && !$course->is_free) {
            $course->price = $data['price'];
        }
        if (($data['status'] ?? null) === 'published' && !$course->published_at) {
            $course->published_at = now();
        }
        if (isset($data['programming_language'])) {
            $cat = Category::where('slug', $data['programming_language'])->first();
            $course->category_id = $cat?->id;
            $course->programming_language = $data['programming_language'];
        }
        $course->save();

        return response()->json(['message' => 'Kurs yangilandi', 'course' => $course->fresh()]);
    }

    public function deleteCourse(int $id)
    {
        $course = $this->authorizeCourse($id);
        if ($course instanceof JsonResponse) {
            return $course;
        }
        $course->delete();

        return response()->json(['message' => 'Kurs o\'chirildi']);
    }

    public function addModule(int $id, Request $request)
    {
        $course = $this->authorizeCourse($id);
        if ($course instanceof JsonResponse) {
            return $course;
        }

        $data = $request->validate(['title' => 'required|string|min:2|max:120']);
        $max = Module::where('course_id', $id)->max('sort_order') ?? 0;
        $module = Module::create([
            'course_id' => $id,
            'title' => trim($data['title']),
            'sort_order' => $max + 1,
        ]);

        return response()->json(['module' => $module], 201);
    }

    public function updateModule(int $id, Request $request)
    {
        $module = $this->authorizeModule($id);
        if ($module instanceof JsonResponse) {
            return $module;
        }

        $data = $request->validate([
            'title' => 'sometimes|string|min:2|max:120',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $module->fill($data);
        $module->save();

        return response()->json(['message' => 'Modul yangilandi', 'module' => $module]);
    }

    public function deleteModule(int $id, PlatformService $platform)
    {
        $module = $this->authorizeModule($id);
        if ($module instanceof JsonResponse) {
            return $module;
        }

        $courseId = $module->course_id;
        Lesson::where('module_id', $module->id)->update(['module_id' => null]);
        $module->delete();
        $platform->updateCourseStats($courseId);

        return response()->json(['message' => 'Modul o\'chirildi']);
    }

    public function addLesson(int $id, Request $request, PlatformService $platform)
    {
        $course = $this->authorizeCourse($id);
        if ($course instanceof JsonResponse) {
            return $course;
        }

        $data = $request->validate([
            'title' => 'required|string|min:2|max:200',
            'module_id' => 'required|integer',
            'description' => 'nullable|string|max:3000',
            'is_preview' => 'sometimes|boolean',
        ]);

        if (!Module::where('id', $data['module_id'])->where('course_id', $id)->exists()) {
            return response()->json(['error' => 'Modul ushbu kursga tegishli emas'], 422);
        }

        $max = Lesson::where('course_id', $id)->max('sort_order') ?? 0;
        $lesson = Lesson::create([
            'course_id' => $id,
            'module_id' => $data['module_id'],
            'title' => trim($data['title']),
            'description' => trim($data['description'] ?? ''),
            'sort_order' => $max + 1,
            'is_preview' => filter_var($data['is_preview'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ]);
        $platform->updateCourseStats($id);

        return response()->json(['lesson' => $this->lessonPayload($lesson->load('materials'), collect())], 201);
    }

    public function updateLesson(int $id, Request $request, PlatformService $platform)
    {
        $lesson = $this->authorizeLesson($id);
        if ($lesson instanceof JsonResponse) {
            return $lesson;
        }

        $data = $request->validate([
            'title' => 'sometimes|string|min:2|max:200',
            'description' => 'nullable|string|max:3000',
            'module_id' => 'sometimes|integer',
            'is_preview' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
            'duration_seconds' => 'sometimes|integer|min:0',
        ]);

        if (isset($data['module_id'])) {
            if (!Module::where('id', $data['module_id'])->where('course_id', $lesson->course_id)->exists()) {
                return response()->json(['error' => 'Modul noto\'g\'ri'], 422);
            }
        }

        foreach (['title', 'description', 'module_id', 'sort_order', 'duration_seconds'] as $f) {
            if (array_key_exists($f, $data)) {
                $lesson->{$f} = $data[$f];
            }
        }
        if (array_key_exists('is_preview', $data)) {
            $lesson->is_preview = filter_var($data['is_preview'], FILTER_VALIDATE_BOOLEAN);
        }
        $lesson->save();
        $platform->updateCourseStats($lesson->course_id);

        return response()->json([
            'message' => 'Dars yangilandi',
            'lesson' => $this->lessonPayload($lesson->load('materials'), Quiz::where('lesson_id', $lesson->id)->pluck('lesson_id')->flip()),
        ]);
    }

    public function deleteLesson(int $id, PlatformService $platform)
    {
        $lesson = $this->authorizeLesson($id);
        if ($lesson instanceof JsonResponse) {
            return $lesson;
        }

        $courseId = $lesson->course_id;
        $lesson->delete();
        $platform->updateCourseStats($courseId);

        return response()->json(['message' => 'Dars o\'chirildi']);
    }

    public function uploadVideo(int $id, Request $request, PlatformService $platform)
    {
        $lesson = $this->authorizeLesson($id);
        if ($lesson instanceof JsonResponse) {
            return $lesson;
        }

        $request->validate([
            'video' => 'required|file|mimes:mp4,webm,ogg|max:204800',
            'duration_seconds' => 'nullable|integer|min:0|max:86400',
        ]);

        $url = $platform->storeUpload('videos', $request->file('video'));
        $lesson->video_url = $url;
        $lesson->duration_seconds = (int) $request->input('duration_seconds', $lesson->duration_seconds);
        $lesson->save();
        $platform->updateCourseStats($lesson->course_id);

        return response()->json(['video_url' => $url, 'duration_seconds' => $lesson->duration_seconds]);
    }

    public function uploadMaterial(int $id, Request $request, PlatformService $platform)
    {
        $lesson = $this->authorizeLesson($id);
        if ($lesson instanceof JsonResponse) {
            return $lesson;
        }

        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,zip|max:51200',
            'title' => 'nullable|string|max:200',
        ]);

        $file = $request->file('file');
        $url = $platform->storeUpload('materials', $file);
        $max = LessonMaterial::where('lesson_id', $lesson->id)->max('sort_order') ?? 0;

        $material = LessonMaterial::create([
            'lesson_id' => $lesson->id,
            'title' => $request->input('title') ?: $file->getClientOriginalName(),
            'file_url' => $url,
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'sort_order' => $max + 1,
        ]);

        return response()->json(['material' => $material], 201);
    }

    public function deleteMaterial(int $id)
    {
        $material = LessonMaterial::find($id);
        if (!$material) {
            return response()->json(['error' => 'Topilmadi'], 404);
        }

        $lesson = $this->authorizeLesson($material->lesson_id);
        if ($lesson instanceof JsonResponse) {
            return $lesson;
        }

        $material->delete();

        return response()->json(['message' => 'Material o\'chirildi']);
    }

    public function saveQuiz(int $id, Request $request)
    {
        $lesson = $this->authorizeLesson($id);
        if ($lesson instanceof JsonResponse) {
            return $lesson;
        }

        $data = $request->validate([
            'title' => 'required|string|min:2|max:200',
            'questions' => 'required|array|min:1|max:20',
            'questions.*.question' => 'required|string|min:3|max:500',
            'questions.*.options' => 'required|array|min:2|max:6',
            'questions.*.options.*' => 'required|string|max:200',
            'questions.*.correct_index' => 'required|integer|min:0',
        ]);

        $quiz = Quiz::updateOrCreate(
            ['lesson_id' => $lesson->id],
            ['title' => trim($data['title'])]
        );

        QuizQuestion::where('quiz_id', $quiz->id)->delete();
        foreach ($data['questions'] as $q) {
            $correct = (int) $q['correct_index'];
            if ($correct >= count($q['options'])) {
                return response()->json(['error' => 'To\'g\'ri javob indeksi noto\'g\'ri'], 422);
            }
            QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'question' => trim($q['question']),
                'options_json' => array_values($q['options']),
                'correct_index' => $correct,
            ]);
        }

        return response()->json(['message' => 'Test saqlandi', 'quiz_id' => $quiz->id]);
    }

    public function getQuiz(int $id)
    {
        $lesson = $this->authorizeLesson($id);
        if ($lesson instanceof JsonResponse) {
            return $lesson;
        }

        $quiz = Quiz::with('questions')->where('lesson_id', $lesson->id)->first();
        if (!$quiz) {
            return response()->json(['quiz' => null]);
        }

        return response()->json([
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'questions' => $quiz->questions->map(fn ($q) => [
                    'id' => $q->id,
                    'question' => $q->question,
                    'options' => $q->options_json,
                    'correct_index' => $q->correct_index,
                ]),
            ],
        ]);
    }

    private function lessonPayload(Lesson $l, $quizLessonIds): array
    {
        return [
            'id' => $l->id,
            'module_id' => $l->module_id,
            'title' => $l->title,
            'description' => $l->description,
            'video_url' => $l->video_url,
            'duration_seconds' => $l->duration_seconds,
            'sort_order' => $l->sort_order,
            'is_preview' => $l->is_preview,
            'has_video' => (bool) $l->video_url,
            'has_quiz' => $quizLessonIds->has($l->id),
            'materials' => $l->materials->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'file_url' => $m->file_url,
                'file_type' => $m->file_type,
                'file_size' => $m->file_size,
            ]),
        ];
    }

    private function instructorScopeId(Request $request): int
    {
        if (Auth::user()->role === 'admin' && $request->query('instructor_id')) {
            return (int) $request->query('instructor_id');
        }

        return Auth::id();
    }

    private function authorizeCourse(int $id): Course|JsonResponse
    {
        $course = Course::find($id);
        if (!$course) {
            return response()->json(['error' => 'Kurs topilmadi'], 404);
        }
        if ($course->instructor_id !== Auth::id() && Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Ruxsat yo\'q'], 403);
        }

        return $course;
    }

    private function authorizeModule(int $id): Module|JsonResponse
    {
        $module = Module::find($id);
        if (!$module) {
            return response()->json(['error' => 'Modul topilmadi'], 404);
        }

        $course = $this->authorizeCourse($module->course_id);
        if ($course instanceof JsonResponse) {
            return $course;
        }

        return $module;
    }

    private function authorizeLesson(int $id): Lesson|JsonResponse
    {
        $lesson = Lesson::find($id);
        if (!$lesson) {
            return response()->json(['error' => 'Dars topilmadi'], 404);
        }

        $course = $this->authorizeCourse($lesson->course_id);
        if ($course instanceof JsonResponse) {
            return $course;
        }

        return $lesson;
    }
}
