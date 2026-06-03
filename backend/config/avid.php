<?php

return [
    'frontend_root' => dirname(base_path()),
    'uploads_path' => dirname(base_path()) . DIRECTORY_SEPARATOR . 'uploads',
    'jwt_secret' => env('JWT_SECRET') ?: env('APP_KEY'),
    'jwt_ttl_days' => (int) env('JWT_TTL_DAYS', 7),
    'demo_video' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
];
