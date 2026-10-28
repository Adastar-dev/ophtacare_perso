<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            // Lieu où la consultation a eu lieu (un patient peut être vu dans plusieurs lieux)
            $table->foreignId('lieu_id')->constrained('lieux')->restrictOnDelete();
            $table->foreignId('rendez_vous_id')->nullable()->constrained('rendez_vous')->nullOnDelete();
            // Date réelle de l'examen : permet aussi de saisir d'anciennes fiches papier
            $table->dateTime('date_consultation');
            $table->string('motif', 500)->nullable();

            // Acuité visuelle de loin (VL) et de près (VP), OD / OG
            $table->string('vl_od_sans_correction', 50)->nullable();
            $table->string('vl_od_avec_correction', 50)->nullable();
            $table->string('vl_og_sans_correction', 50)->nullable();
            $table->string('vl_og_avec_correction', 50)->nullable();
            $table->string('vp_od', 50)->nullable();
            $table->string('vp_og', 50)->nullable();

            // Réfraction (texte pour conserver la notation saisie : +1.25, -0.50…)
            $table->string('ref_od_sphere', 20)->nullable();
            $table->string('ref_od_cylindre', 20)->nullable();
            $table->string('ref_od_axe', 20)->nullable();
            $table->string('ref_og_sphere', 20)->nullable();
            $table->string('ref_og_cylindre', 20)->nullable();
            $table->string('ref_og_axe', 20)->nullable();

            // Tonus oculaire (mmHg)
            $table->string('tonus_od', 20)->nullable();
            $table->string('tonus_og', 20)->nullable();

            // Champs cliniques — chiffrés (AES-256) par le modèle
            $table->text('lampe_fente')->nullable();
            $table->text('fond_oeil')->nullable();
            $table->text('diagnostic')->nullable();
            $table->text('observations_cliniques')->nullable();
            $table->text('conduite_a_tenir')->nullable();

            $table->timestamps();

            $table->index('date_consultation');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
