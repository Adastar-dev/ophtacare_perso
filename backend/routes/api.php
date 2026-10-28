<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LieuController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\RendezVousController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API OphtaCare — usage personnel (un seul compte)
|--------------------------------------------------------------------------
| Aucune inscription publique : le compte se crée en ligne de commande
| avec `php artisan ophtacare:compte`.
*/

// 5 tentatives de connexion par minute et par IP
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::put('/profil', [AuthController::class, 'updateProfil']);
    Route::put('/profil/mot-de-passe', [AuthController::class, 'updatePassword']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('lieux', LieuController::class)->parameters(['lieux' => 'lieu']);
    Route::apiResource('patients', PatientController::class);
    Route::apiResource('rendez-vous', RendezVousController::class)->parameters(['rendez-vous' => 'rendezVous']);
    Route::apiResource('consultations', ConsultationController::class);
    Route::apiResource('prescriptions', PrescriptionController::class);
});
