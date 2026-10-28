<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * En production on ne crée rien automatiquement : le compte se crée avec
     * `php artisan ophtacare:compte`. En local, on charge des données de démo.
     */
    public function run(): void
    {
        if (app()->environment('local', 'testing')) {
            $this->call(DemoSeeder::class);
        }
    }
}
