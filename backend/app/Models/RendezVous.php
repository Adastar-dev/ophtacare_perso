<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RendezVous extends Model
{
    protected $table = 'rendez_vous';

    protected $fillable = [
        'patient_id', 'lieu_id', 'date_heure_rdv', 'duree_minutes', 'statut', 'motif', 'notes',
    ];

    protected $casts = [
        'date_heure_rdv' => 'datetime:Y-m-d\TH:i:s',
        'duree_minutes' => 'integer',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function lieu(): BelongsTo
    {
        return $this->belongsTo(Lieu::class);
    }

    public function consultation(): HasOne
    {
        return $this->hasOne(Consultation::class);
    }
}
