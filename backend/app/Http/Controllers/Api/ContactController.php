<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:80',
            'email' => 'required|email',
            'message' => 'required|string|min:10|max:2000',
        ]);

        ContactMessage::create([
            'name' => trim($data['name']),
            'email' => strtolower($data['email']),
            'message' => trim($data['message']),
            'user_id' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Xabaringiz qabul qilindi. Tez orada javob beramiz!',
        ], 201);
    }
}
