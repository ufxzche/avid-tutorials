<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;

class JwtService
{
    public function sign(User $user): string
    {
        $ttl = config('avid.jwt_ttl_days', 7);

        return JWT::encode([
            'sub' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'exp' => now()->addDays($ttl)->timestamp,
        ], config('avid.jwt_secret'), 'HS256');
    }

    public function verify(?string $token): ?User
    {
        if (!$token) {
            return null;
        }

        try {
            $payload = JWT::decode($token, new Key(config('avid.jwt_secret'), 'HS256'));
            $user = User::find($payload->sub ?? null);

            if (!$user || $user->is_blocked) {
                return null;
            }

            return $user;
        } catch (\Throwable) {
            return null;
        }
    }

    public function fromRequest(Request $request): ?User
    {
        return $this->verify($request->cookie('token'));
    }

    public function authCookie(string $token): Cookie
    {
        $secure = app()->environment('production');

        return cookie(
            'token',
            $token,
            config('avid.jwt_ttl_days', 7) * 24 * 60,
            '/',
            null,
            $secure,
            true,
            false,
            'strict'
        );
    }

    public function clearCookie(): Cookie
    {
        return cookie()->forget('token');
    }
}
