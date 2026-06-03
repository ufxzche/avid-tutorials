<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    public $timestamps = false;

    protected $fillable = ['quiz_id', 'question', 'options_json', 'correct_index'];

    protected $casts = ['options_json' => 'array'];
}
