<?php

namespace App\Http\Middleware;

use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class JwtOptional
{
    public function __construct(private JwtService $jwt) {}

    public function handle(Request $request, Closure $next)
    {
        $user = $this->jwt->fromRequest($request);
        if ($user) {
            Auth::setUser($user);
        }

        return $next($request);
    }
}
