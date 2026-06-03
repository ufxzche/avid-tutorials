<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonComment extends Model
{
    protected $fillable = ['lesson_id', 'user_id', 'parent_id', 'body', 'likes'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
