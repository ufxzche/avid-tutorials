<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Notification;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Str;

class PlatformService
{
    public function uniqueSlug(string $table, string $title): string
    {
        $base = Str::slug($title);
        if ($base === '') {
            $base = 'kurs';
        }
        $slug = $base;
        $n = 1;
        while (Course::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $n++;
        }

        return $slug;
    }

    public function updateCourseStats(int $courseId): void
    {
        $stats = Lesson::where('course_id', $courseId)
            ->selectRaw('COUNT(*) as cnt, COALESCE(SUM(duration_seconds),0) as dur')
            ->first();

        $minutes = (int) ceil(($stats->dur ?? 0) / 60) ?: ($stats->cnt ?? 0);

        Course::where('id', $courseId)->update([
            'lesson_count' => $stats->cnt ?? 0,
            'duration_minutes' => $minutes,
        ]);
    }

    public function refreshCourseRating(int $courseId): void
    {
        $r = Review::where('course_id', $courseId)
            ->selectRaw('AVG(rating) as avg, COUNT(*) as cnt')
            ->first();

        Course::where('id', $courseId)->update([
            'rating_avg' => $r->avg ?? 0,
            'rating_count' => $r->cnt ?? 0,
        ]);
    }

    public function calcProgress(int $userId, int $courseId): int
    {
        $total = Lesson::where('course_id', $courseId)->count();
        if (!$total) {
            return 0;
        }

        $done = LessonProgress::query()
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->where('lesson_progress.user_id', $userId)
            ->where('lessons.course_id', $courseId)
            ->where('lesson_progress.completed', true)
            ->count();

        return (int) round(($done / $total) * 100);
    }

    public function notify(int $userId, string $type, string $title, string $body, ?string $link = null): void
    {
        Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
        ]);
    }

    public function syncUserLevel(User $user): void
    {
        $user->level = max(1, (int) floor($user->xp / 100) + 1);
        $user->save();
    }

    public function grantAchievement(int $userId, string $slug): void
    {
        $achievement = Achievement::where('slug', $slug)->first();
        if (!$achievement) {
            return;
        }

        \DB::table('user_achievements')->insertOrIgnore([
            'user_id' => $userId,
            'achievement_id' => $achievement->id,
            'earned_at' => now(),
        ]);
    }

    public function publicStats(): array
    {
        $students = User::where('role', 'student')->count();
        $instructors = User::where('role', 'instructor')->count();
        $courses = Course::where('status', 'published')->count();
        $lessons = Lesson::count();
        $enrollments = Enrollment::count();

        return [
            'teachers' => $instructors + 20,
            'students' => $students + $enrollments + 1500,
            'registered' => $students,
            'lessons' => $lessons,
            'courses' => $courses,
        ];
    }

    public function uploadUrl(string $subdir, string $filename): string
    {
        return url('/uploads/' . $subdir . '/' . $filename);
    }

    public function storeUpload(string $subdir, $file): string
    {
        $dir = config('avid.uploads_path') . DIRECTORY_SEPARATOR . $subdir;
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $name = \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move($dir, $name);

        return $this->uploadUrl($subdir, $name);
    }

    public function courseStats(int $courseId): array
    {
        $course = Course::find($courseId);
        if (!$course) {
            return [];
        }

        $students = Enrollment::where('course_id', $courseId)
            ->distinct('user_id')
            ->count('user_id');

        $views = LessonProgress::query()
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->where('lessons.course_id', $courseId)
            ->count();

        $completions = Enrollment::where('course_id', $courseId)
            ->where('progress_percent', '>=', 100)
            ->count();

        return [
            'students' => $students,
            'views' => $views,
            'rating_avg' => round($course->rating_avg, 2),
            'rating_count' => $course->rating_count,
            'completions' => $completions,
            'enrollment_count' => $course->enrollment_count,
            'lesson_count' => $course->lesson_count,
        ];
    }
}
