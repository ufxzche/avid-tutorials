<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\BlogPost;
use App\Models\LessonComment;
use App\Models\User;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function dashboard()
    {
        $byRole = User::selectRaw('role, COUNT(*) as c')->groupBy('role')->get();

        return response()->json([
            'users' => User::count(),
            'courses' => Course::count(),
            'enrollments' => Enrollment::count(),
            'lessons' => Lesson::count(),
            'comments' => LessonComment::count(),
            'blog_posts' => BlogPost::count(),
            'byRole' => $byRole,
        ]);
    }

    public function users()
    {
        $users = User::orderByDesc('created_at')
            ->limit(100)
            ->get(['id', 'email', 'name', 'role', 'is_blocked', 'created_at']);

        return response()->json(['users' => $users]);
    }

    public function blockUser(int $id, \Illuminate\Http\Request $request)
    {
        User::where('id', $id)->update(['is_blocked' => (bool) $request->input('blocked')]);
        $msg = $request->input('blocked') ? 'Bloklandi' : 'Blokdan chiqarildi';

        return response()->json(['message' => $msg]);
    }

    public function deleteCourse(int $id)
    {
        Course::where('id', $id)->delete();

        return response()->json(['message' => 'Kurs o\'chirildi']);
    }

    public function contactMessages()
    {
        $messages = ContactMessage::orderByDesc('created_at')->limit(50)->get();

        return response()->json(['messages' => $messages]);
    }

    public function courses()
    {
        $courses = Course::query()
            ->join('users', 'users.id', '=', 'courses.instructor_id')
            ->orderByDesc('courses.updated_at')
            ->limit(200)
            ->get([
                'courses.id', 'courses.slug', 'courses.title', 'courses.status',
                'courses.enrollment_count', 'courses.lesson_count', 'courses.updated_at',
                'users.name as instructor_name',
            ]);

        return response()->json(['courses' => $courses]);
    }

    public function updateCourseStatus(int $id, \Illuminate\Http\Request $request)
    {
        $data = $request->validate([
            'status' => 'required|in:draft,published,archived',
        ]);

        $course = Course::find($id);
        if (!$course) {
            return response()->json(['error' => 'Kurs topilmadi'], 404);
        }

        $course->status = $data['status'];
        if ($data['status'] === 'published' && !$course->published_at) {
            $course->published_at = now();
        }
        $course->save();

        return response()->json(['message' => 'Holat yangilandi', 'status' => $course->status]);
    }

    public function comments()
    {
        $comments = LessonComment::query()
            ->join('users', 'users.id', '=', 'lesson_comments.user_id')
            ->join('lessons', 'lessons.id', '=', 'lesson_comments.lesson_id')
            ->join('courses', 'courses.id', '=', 'lessons.course_id')
            ->orderByDesc('lesson_comments.created_at')
            ->limit(100)
            ->get([
                'lesson_comments.id', 'lesson_comments.body', 'lesson_comments.created_at',
                'users.name as user_name', 'users.email as user_email',
                'lessons.title as lesson_title', 'lessons.id as lesson_id',
                'courses.title as course_title', 'courses.slug as course_slug',
            ]);

        return response()->json(['comments' => $comments]);
    }

    public function deleteComment(int $id)
    {
        LessonComment::where('id', $id)->delete();

        return response()->json(['message' => 'Izoh o\'chirildi']);
    }

    public function blogPosts()
    {
        $posts = BlogPost::orderByDesc('published_at')
            ->get(['id', 'slug', 'title', 'excerpt', 'image_url', 'published_at']);

        return response()->json(['posts' => $posts]);
    }

    public function blogPost(int $id)
    {
        $post = BlogPost::find($id);
        if (!$post) {
            return response()->json(['error' => 'Maqola topilmadi'], 404);
        }

        return response()->json(['post' => $post]);
    }

    public function storeBlogPost(\Illuminate\Http\Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|min:3|max:200',
            'slug' => 'nullable|string|max:200|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            'excerpt' => 'required|string|min:10|max:500',
            'content' => 'required|string|min:20|max:50000',
            'image_url' => 'nullable|string|max:500',
            'published_at' => 'nullable|date',
        ]);

        $slug = $data['slug'] ?? $this->uniqueBlogSlug($data['title']);
        if (BlogPost::where('slug', $slug)->exists()) {
            return response()->json(['error' => 'Bunday slug mavjud'], 422);
        }

        $post = BlogPost::create([
            'slug' => $slug,
            'title' => trim($data['title']),
            'excerpt' => trim($data['excerpt']),
            'content' => trim($data['content']),
            'image_url' => $data['image_url'] ?? './img/logo.png',
            'published_at' => isset($data['published_at']) ? $data['published_at'] : now(),
        ]);

        return response()->json(['message' => 'Maqola yaratildi', 'post' => $post], 201);
    }

    public function updateBlogPost(int $id, \Illuminate\Http\Request $request)
    {
        $post = BlogPost::find($id);
        if (!$post) {
            return response()->json(['error' => 'Maqola topilmadi'], 404);
        }

        $data = $request->validate([
            'title' => 'sometimes|string|min:3|max:200',
            'slug' => 'sometimes|string|max:200|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            'excerpt' => 'sometimes|string|min:10|max:500',
            'content' => 'sometimes|string|min:20|max:50000',
            'image_url' => 'nullable|string|max:500',
            'published_at' => 'nullable|date',
        ]);

        if (isset($data['slug']) && $data['slug'] !== $post->slug
            && BlogPost::where('slug', $data['slug'])->where('id', '!=', $id)->exists()) {
            return response()->json(['error' => 'Bunday slug mavjud'], 422);
        }

        foreach (['title', 'slug', 'excerpt', 'content', 'image_url', 'published_at'] as $f) {
            if (array_key_exists($f, $data)) {
                $post->{$f} = is_string($data[$f]) ? trim($data[$f]) : $data[$f];
            }
        }
        $post->save();

        return response()->json(['message' => 'Maqola yangilandi', 'post' => $post]);
    }

    public function deleteBlogPost(int $id)
    {
        $post = BlogPost::find($id);
        if (!$post) {
            return response()->json(['error' => 'Maqola topilmadi'], 404);
        }
        $post->delete();

        return response()->json(['message' => 'Maqola o\'chirildi']);
    }

    private function uniqueBlogSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'maqola';
        $slug = $base;
        $n = 1;
        while (BlogPost::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $n++;
        }

        return $slug;
    }
}
