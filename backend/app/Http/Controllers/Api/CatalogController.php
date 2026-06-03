<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Favorite;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Review;
use App\Services\PlatformService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CatalogController extends Controller
{
    public function stats(PlatformService $platform)
    {
        return response()->json($platform->publicStats());
    }

    public function categories()
    {
        $categories = \App\Models\Category::orderBy('name')->get(['slug', 'name']);

        return response()->json(['categories' => $categories]);
    }

    public function index(Request $request)
    {
        $q = strtolower(trim($request->query('q', '')));
        $lang = $request->query('lang');
        $level = $request->query('level');
        $free = $request->query('free');
        $sort = $request->query('sort', 'popular');
        $instructor = strtolower(trim($request->query('instructor', '')));
        $duration = $request->query('duration');

        $query = Course::query()
            ->join('users', 'users.id', '=', 'courses.instructor_id')
            ->leftJoin('categories', 'categories.id', '=', 'courses.category_id')
            ->where('courses.status', 'published')
            ->select([
                'courses.id', 'courses.slug', 'courses.title', 'courses.description',
                'courses.thumbnail_url', 'courses.icon_url', 'courses.programming_language',
                'courses.level', 'courses.is_free', 'courses.price', 'courses.rating_avg',
                'courses.rating_count', 'courses.duration_minutes', 'courses.lesson_count',
                'courses.enrollment_count', 'courses.published_at',
                'users.name as instructor_name', 'users.id as instructor_id',
                'users.bio as instructor_bio', 'users.avatar_url as instructor_avatar',
                'categories.name as category_name',
            ]);

        if ($lang) {
            $query->where('courses.programming_language', $lang);
        }
        if ($level) {
            $query->where('courses.level', $level);
        }
        if ($free === '1') {
            $query->where('courses.is_free', true);
        }
        if ($free === '0') {
            $query->where('courses.is_free', false);
        }
        if ($q) {
            $like = '%' . $q . '%';
            $query->where(function ($w) use ($like) {
                $w->whereRaw('LOWER(courses.title) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(courses.description) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(users.name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(courses.programming_language) LIKE ?', [$like]);
            });
        }
        if ($instructor) {
            $query->whereRaw('LOWER(users.name) LIKE ?', ['%' . $instructor . '%']);
        }

        match ($sort) {
            'new' => $query->orderByDesc('courses.published_at'),
            'rating' => $query->orderByDesc('courses.rating_avg')->orderByDesc('courses.rating_count'),
            'free' => $query->orderByDesc('courses.is_free')->orderByDesc('courses.enrollment_count'),
            default => $query->orderByDesc('courses.enrollment_count'),
        };

        $courses = $query->get();

        if ($duration === 'short') {
            $courses = $courses->filter(fn ($c) => $c->duration_minutes < 180)->values();
        } elseif ($duration === 'medium') {
            $courses = $courses->filter(fn ($c) => $c->duration_minutes >= 180 && $c->duration_minutes < 600)->values();
        } elseif ($duration === 'long') {
            $courses = $courses->filter(fn ($c) => $c->duration_minutes >= 600)->values();
        }

        if (Auth::check()) {
            $favs = Favorite::where('user_id', Auth::id())->pluck('course_id')->flip();
            $courses = $courses->map(fn ($c) => array_merge($c->toArray(), [
                'is_favorite' => $favs->has($c->id),
            ]));
        }

        return response()->json(['courses' => $courses]);
    }

    public function show(string $slug)
    {
        $course = Course::query()
            ->join('users', 'users.id', '=', 'courses.instructor_id')
            ->leftJoin('categories', 'categories.id', '=', 'courses.category_id')
            ->where('courses.slug', $slug)
            ->where('courses.status', 'published')
            ->select([
                'courses.*',
                'users.name as instructor_name',
                'users.bio as instructor_bio',
                'users.avatar_url as instructor_avatar',
                'categories.name as category_name',
            ])
            ->first();

        if (!$course) {
            return response()->json(['error' => 'Kurs topilmadi'], 404);
        }

        $modules = Module::where('course_id', $course->id)->orderBy('sort_order')->get(['id', 'title', 'sort_order']);
        $lessons = Lesson::where('course_id', $course->id)->orderBy('sort_order')->get();
        $reviews = Review::query()
            ->join('users', 'users.id', '=', 'reviews.user_id')
            ->where('reviews.course_id', $course->id)
            ->orderByDesc('reviews.created_at')
            ->limit(20)
            ->get([
                'reviews.rating', 'reviews.comment', 'reviews.created_at',
                'users.name as user_name', 'users.avatar_url',
            ]);

        $enrolled = false;
        $progress_percent = 0;
        $is_favorite = false;

        if (Auth::check()) {
            $en = Enrollment::where('user_id', Auth::id())->where('course_id', $course->id)->first();
            $enrolled = (bool) $en;
            $progress_percent = $en->progress_percent ?? 0;
            $is_favorite = Favorite::where('user_id', Auth::id())->where('course_id', $course->id)->exists();
        }

        $modulesWithLessons = $modules->map(function ($m) use ($lessons) {
            return [
                'id' => $m->id,
                'title' => $m->title,
                'sort_order' => $m->sort_order,
                'lessons' => $lessons->where('module_id', $m->id)->map(fn ($l) => [
                    'id' => $l->id,
                    'title' => $l->title,
                    'description' => $l->description,
                    'duration_seconds' => $l->duration_seconds,
                    'sort_order' => $l->sort_order,
                    'is_preview' => $l->is_preview,
                    'has_video' => (bool) $l->video_url,
                ])->values(),
            ];
        });

        $courseData = $course->toArray();
        $courseData['enrolled'] = $enrolled;
        $courseData['progress_percent'] = $progress_percent;
        $courseData['is_favorite'] = $is_favorite;

        return response()->json([
            'course' => $courseData,
            'modules' => $modulesWithLessons,
            'reviews' => $reviews,
        ]);
    }
}
