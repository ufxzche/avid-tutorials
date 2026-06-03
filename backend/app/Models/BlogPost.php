<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    public $timestamps = false;

    protected $table = 'blog_posts';

    protected $fillable = ['slug', 'title', 'excerpt', 'content', 'image_url', 'published_at'];

    protected $casts = ['published_at' => 'datetime'];
}
