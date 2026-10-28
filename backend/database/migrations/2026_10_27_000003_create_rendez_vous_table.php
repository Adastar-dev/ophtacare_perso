<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rendez_vous', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('lieu_id')->constrained('lieux')->restrictOnDelete();
            $table->dateTime('date_heure_rdv');
            $table->unsignedSmallInteger('duree_minutes')->default(20);
            $table->enum('statut', ['prevu', 'honore', 'annule', 'absent'])->default('prevu');
            $table->string('motif', 500)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('date_heure_rdv');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rendez_vous');
    }
};
