<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Application (frontend Next.js exporté en statique dans public/)
|--------------------------------------------------------------------------
| Les fichiers existants (/_next/…, icônes) sont servis directement par le
| serveur web. Les pages (/dashboard/patients/, …) sont des dossiers
| contenant un index.html : on les renvoie ici, sinon la page d'accueil.
*/
Route::get('/{path?}', function (?string $path = null) {
    $path = trim((string) $path, '/');

    if (str_contains($path, '..')) {
        abort(404);
    }

    $page = public_path(($path === '' ? '' : $path . '/') . 'index.html');
    $accueil = public_path('index.html');

    if (! is_file($accueil)) {
        return response(
            "Frontend non déployé. Lancez scripts/deploy-frontend.sh (voir README).",
            503,
            ['Content-Type' => 'text/plain; charset=UTF-8']
        );
    }

    return response()->file(is_file($page) ? $page : $accueil, [
        'Content-Type' => 'text/html; charset=UTF-8',
        'Cache-Control' => 'no-cache',
        'X-Frame-Options' => 'DENY',
        'X-Content-Type-Options' => 'nosniff',
        'Referrer-Policy' => 'same-origin',
    ]);
})->where('path', '^(?!api(/|$)).*');
