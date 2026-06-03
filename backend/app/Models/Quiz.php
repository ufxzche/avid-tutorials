<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    public $timestamps = false;

    protected $fillable = ['lesson_id', 'title'];

    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class);
    }
}
