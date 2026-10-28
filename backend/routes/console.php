<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;

/*
| Crée (ou met à jour) le compte unique de la praticienne.
|   php artisan ophtacare:compte
*/
Artisan::command('ophtacare:compte', function () {
    $existant = User::first();

    if ($existant) {
        $this->warn("Un compte existe déjà : {$existant->email}");
        if (! $this->confirm('Voulez-vous le modifier (nom, email, mot de passe) ?')) {
            return 0;
        }
    }

    $name = $this->ask('Nom complet (sans "Dr")', $existant?->name);
    $email = $this->ask('Email de connexion', $existant?->email);
    $password = $this->secret('Mot de passe (8 caractères minimum)');

    if (! $name || ! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen((string) $password) < 8) {
        $this->error('Nom, email valide et mot de passe de 8 caractères minimum requis.');
        return 1;
    }

    if ($password !== $this->secret('Confirmez le mot de passe')) {
        $this->error('Les mots de passe ne correspondent pas.');
        return 1;
    }

    $user = $existant ?? new User();
    $user->fill(['name' => $name, 'email' => $email, 'password' => $password])->save();
    $user->tokens()->delete();

    $this->info("Compte prêt : {$user->email}");
    return 0;
})->purpose('Créer ou modifier le compte de la praticienne');
