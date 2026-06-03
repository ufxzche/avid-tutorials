<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $fillable = [
        'email', 'password_hash', 'name', 'role', 'avatar_url', 'bio', 'xp', 'level', 'is_blocked',
    ];

    protected $hidden = ['password_hash'];

    protected $casts = [
        'is_blocked' => 'boolean',
        'xp' => 'integer',
        'level' => 'integer',
    ];

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->name,
            'role' => $this->role,
            'avatar_url' => $this->avatar_url,
            'bio' => $this->bio,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
