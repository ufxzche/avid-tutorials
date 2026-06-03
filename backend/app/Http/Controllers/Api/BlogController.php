<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;

class BlogController extends Controller
{
    public function index()
    {
        $posts = BlogPost::orderByDesc('published_at')
            ->get(['slug', 'title', 'excerpt', 'image_url', 'published_at']);

        return response()->json(['posts' => $posts]);
    }

    public function show(string $slug)
    {
        $post = BlogPost::where('slug', $slug)->first();
        if (!$post) {
            return response()->json(['error' => 'Maqola topilmadi'], 404);
        }

        return response()->json(['post' => $post]);
    }
}
