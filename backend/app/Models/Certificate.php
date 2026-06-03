<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'course_id', 'code', 'issued_at'];

    protected $casts = ['issued_at' => 'datetime'];
}
