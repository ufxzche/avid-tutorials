<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonMaterial extends Model
{
    public $timestamps = false;

    protected $fillable = ['lesson_id', 'title', 'file_url', 'file_type', 'file_size', 'sort_order'];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
