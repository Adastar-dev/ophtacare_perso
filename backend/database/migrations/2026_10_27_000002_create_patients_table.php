<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('code_patient')->unique(); // PAT-2026-0001
            $table->string('nom');
            $table->string('prenom');
            $table->date('date_naissance')->nullable();
            $table->enum('genre', ['M', 'F'])->nullable();
            // Pas d'unicité : plusieurs membres d'une famille partagent souvent un numéro
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->string('adresse')->nullable();
            $table->string('profession')->nullable();

            $table->text('antecedents_medicaux')->nullable();
            $table->text('antecedents_ophtalmo')->nullable();
            $table->text('allergies')->nullable();
            $table->text('traitements')->nullable();
            $table->text('notes')->nullable();

            $table->string('assureur')->nullable();
            $table->string('numero_assurance')->nullable();

            // Lieu habituel du patient. Chaque consultation garde aussi son propre lieu.
            $table->foreignId('lieu_id')->nullable()->constrained('lieux')->nullOnDelete();

            $table->timestamps();

            $table->index(['nom', 'prenom']);
            $table->index('telephone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
