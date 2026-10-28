<?php

// Le frontend appelle l'API avec un jeton Bearer : pas de cookies cross-origin.
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter(array_map('trim', explode(',', env('FRONTEND_URL', 'http://localhost:3000')))),
    'allowed_origins_patterns' => env('APP_ENV') === 'local'
        ? ['#^http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$#']
        : [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => false,
];
