<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RequireRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Avtorizatsiya talab qilinadi'], 401);
        }

        if (!in_array($user->role, $roles, true)) {
            return response()->json(['error' => 'Ruxsat yo\'q'], 403);
        }

        return $next($request);
    }
}
