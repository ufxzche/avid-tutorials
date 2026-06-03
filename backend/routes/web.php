<?php

use Illuminate\Support\Facades\Route;

$frontendRoot = config('avid.frontend_root');
$uploadsPath = config('avid.uploads_path');

Route::get('/uploads/{subdir}/{filename}', function (string $subdir, string $filename) use ($uploadsPath) {
    $path = $uploadsPath . DIRECTORY_SEPARATOR . $subdir . DIRECTORY_SEPARATOR . $filename;
    if (!is_file($path)) {
        abort(404);
    }

    return response()->file($path);
})->where('filename', '.*');

Route::get('/{path?}', function (?string $path = null) use ($frontendRoot) {
    $path = $path ?: 'index.html';
    if (str_contains($path, '..')) {
        abort(403);
    }

    $file = $frontendRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $path);
    if (is_dir($file)) {
        $file = rtrim($file, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'index.html';
    }

    if (!is_file($file)) {
        abort(404);
    }

    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    $types = [
        'html' => 'text/html; charset=utf-8',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff2' => 'font/woff2',
        'pdf' => 'application/pdf',
        'zip' => 'application/zip',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    return response()->file($file, [
        'Content-Type' => $types[$ext] ?? 'application/octet-stream',
    ]);
})->where('path', '.*');
