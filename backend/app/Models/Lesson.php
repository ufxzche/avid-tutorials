<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'course_id', 'module_id', 'title', 'description', 'video_url',
        'duration_seconds', 'sort_order', 'is_preview',
    ];

    protected $casts = ['is_preview' => 'boolean'];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    public function materials(): HasMany
    {
        return $this->hasMany(LessonMaterial::class)->orderBy('sort_order');
    }
}
