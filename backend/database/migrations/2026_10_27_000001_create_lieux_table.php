<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lieux d'exercice : cliniques, hôpitaux, cabinets où la praticienne consulte.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lieux', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('type')->default('clinique'); // clinique | hopital | cabinet | autre
            $table->string('adresse')->nullable();
            $table->string('telephone')->nullable();
            $table->string('couleur', 7)->default('#2563eb'); // repère visuel dans l'agenda
            $table->text('notes')->nullable(); // ex. jours de présence
            $table->boolean('actif')->default(true); // archivé plutôt que supprimé
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lieux');
    }
};
