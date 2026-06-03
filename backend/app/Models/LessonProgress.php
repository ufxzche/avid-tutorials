<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonProgress extends Model
{
    public $timestamps = false;

    protected $table = 'lesson_progress';

    protected $fillable = ['user_id', 'lesson_id', 'watched_seconds', 'completed', 'updated_at'];

    protected $casts = ['completed' => 'boolean'];
}
