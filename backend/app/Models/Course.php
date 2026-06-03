<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'slug', 'title', 'description', 'thumbnail_url', 'icon_url', 'category_id',
        'instructor_id', 'programming_language', 'level', 'language', 'is_free', 'price',
        'status', 'rating_avg', 'rating_count', 'duration_minutes', 'lesson_count',
        'enrollment_count', 'published_at',
    ];

    protected $casts = [
        'is_free' => 'boolean',
        'price' => 'float',
        'rating_avg' => 'float',
        'published_at' => 'datetime',
    ];

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class)->orderBy('sort_order');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('sort_order');
    }
}
