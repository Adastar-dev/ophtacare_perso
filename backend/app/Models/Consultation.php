<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Consultation extends Model
{
    public const CHAMPS_CLINIQUES = [
        'motif',
        'vl_od_sans_correction', 'vl_od_avec_correction',
        'vl_og_sans_correction', 'vl_og_avec_correction',
        'vp_od', 'vp_og',
        'ref_od_sphere', 'ref_od_cylindre', 'ref_od_axe',
        'ref_og_sphere', 'ref_og_cylindre', 'ref_og_axe',
        'tonus_od', 'tonus_og',
        'lampe_fente', 'fond_oeil',
        'diagnostic', 'observations_cliniques', 'conduite_a_tenir',
    ];

    protected $fillable = [
        'patient_id', 'lieu_id', 'rendez_vous_id', 'date_consultation',
        ...self::CHAMPS_CLINIQUES,
    ];

    // Chiffrement automatique en base (AES-256, clé APP_KEY)
    protected $casts = [
        'date_consultation' => 'datetime:Y-m-d\TH:i:s',
        'lampe_fente' => 'encrypted',
        'fond_oeil' => 'encrypted',
        'diagnostic' => 'encrypted',
        'observations_cliniques' => 'encrypted',
        'conduite_a_tenir' => 'encrypted',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function lieu(): BelongsTo
    {
        return $this->belongsTo(Lieu::class);
    }

    public function rendezVous(): BelongsTo
    {
        return $this->belongsTo(RendezVous::class);
    }

    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class);
    }
}
