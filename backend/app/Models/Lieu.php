<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Lieu d'exercice (clinique, hôpital, cabinet…).
 */
class Lieu extends Model
{
    protected $table = 'lieux';

    protected $fillable = ['nom', 'type', 'adresse', 'telephone', 'couleur', 'notes', 'actif'];

    protected $casts = [
        'actif' => 'boolean',
    ];

    /** Patients dont c'est le lieu habituel. */
    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }

    public function rendezVous(): HasMany
    {
        return $this->hasMany(RendezVous::class);
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }
}
