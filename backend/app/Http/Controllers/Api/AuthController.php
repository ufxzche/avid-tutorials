<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasswordReset;
use App\Models\User;
use App\Services\JwtService;
use App\Services\PlatformService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function __construct(private JwtService $jwt) {}

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:80',
            'email' => 'required|email|max:255',
            'password' => ['required', 'string', 'min:8', 'regex:/[A-Za-z]/', 'regex:/[0-9]/'],
            'role' => ['nullable', Rule::in(['student', 'instructor'])],
        ]);

        if (User::whereRaw('LOWER(email) = ?', [strtolower($data['email'])])->exists()) {
            return response()->json(['error' => 'Email band'], 409);
        }

        $role = ($data['role'] ?? '') === 'instructor' ? 'instructor' : 'student';
        $user = User::create([
            'email' => strtolower($data['email']),
            'password_hash' => Hash::make($data['password']),
            'name' => trim($data['name']),
            'role' => $role,
        ]);

        $token = $this->jwt->sign($user);

        return response()->json(['user' => $user->toPublicArray()], 201)
            ->cookie($this->jwt->authCookie($token));
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::whereRaw('LOWER(email) = ?', [strtolower($data['email'])])->first();
        if (!$user || $user->is_blocked || !Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['error' => 'Email yoki parol noto\'g\'ri'], 401);
        }

        $token = $this->jwt->sign($user);

        return response()->json(['user' => $user->toPublicArray()])
            ->cookie($this->jwt->authCookie($token));
    }

    public function logout()
    {
        return response()->json(['ok' => true])->cookie($this->jwt->clearCookie());
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()->toPublicArray()]);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|min:2|max:80',
            'bio' => 'sometimes|string|max:500',
        ]);

        $user = $request->user();
        if (isset($data['name'])) {
            $user->name = trim($data['name']);
        }
        if (array_key_exists('bio', $data)) {
            $user->bio = trim($data['bio'] ?? '');
        }
        $user->save();

        return response()->json(['user' => $user->fresh()->toPublicArray()]);
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'currentPassword' => 'required|string',
            'newPassword' => ['required', 'string', 'min:8', 'regex:/[A-Za-z]/', 'regex:/[0-9]/'],
        ]);

        $user = $request->user();
        if (!Hash::check($data['currentPassword'], $user->password_hash)) {
            return response()->json(['error' => 'Joriy parol noto\'g\'ri'], 400);
        }

        $user->password_hash = Hash::make($data['newPassword']);
        $user->save();

        return response()->json(['message' => 'Parol yangilandi']);
    }

    public function uploadAvatar(Request $request, PlatformService $platform)
    {
        $request->validate(['avatar' => 'required|image|mimes:jpeg,png,webp,gif|max:3072']);
        $file = $request->file('avatar');
        $dir = config('avid.uploads_path') . '/avatars';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $name = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move($dir, $name);
        $url = $platform->uploadUrl('avatars', $name);
        $user = $request->user();
        $user->avatar_url = $url;
        $user->save();

        return response()->json(['avatar_url' => $url, 'user' => $user->toPublicArray()]);
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate(['email' => 'required|email']);
        $user = User::whereRaw('LOWER(email) = ?', [strtolower($data['email'])])->first();

        if ($user) {
            $token = Str::uuid()->toString();
            PasswordReset::create([
                'user_id' => $user->id,
                'token' => $token,
                'expires_at' => now()->addHour(),
            ]);
            $resetUrl = url('/reset-password.html?token=' . $token);
            if (!app()->environment('production')) {
                return response()->json(['message' => 'Tiklash havolasi', 'resetUrl' => $resetUrl]);
            }
        }

        return response()->json(['message' => 'Agar email mavjud bo\'lsa, havola yuborildi']);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'password' => ['required', 'string', 'min:8', 'regex:/[A-Za-z]/', 'regex:/[0-9]/'],
        ]);

        $row = PasswordReset::where('token', $data['token'])
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$row) {
            return response()->json(['error' => 'Token noto\'g\'ri'], 400);
        }

        User::where('id', $row->user_id)->update(['password_hash' => Hash::make($data['password'])]);
        $row->used = true;
        $row->save();

        return response()->json(['message' => 'Parol yangilandi']);
    }
}
