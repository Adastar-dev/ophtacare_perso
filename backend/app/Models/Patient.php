<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Facades\DB;

class Patient extends Model
{
    protected $fillable = [
        'code_patient', 'nom', 'prenom', 'date_naissance', 'genre',
        'telephone', 'email', 'adresse', 'profession',
        'antecedents_medicaux', 'antecedents_ophtalmo', 'allergies', 'traitements', 'notes',
        'assureur', 'numero_assurance',
        'lieu_id',
    ];

    protected $casts = [
        'date_naissance' => 'date:Y-m-d',
    ];

    /** Lieu habituel. */
    public function lieu(): BelongsTo
    {
        return $this->belongsTo(Lieu::class);
    }

    public function rendezVous(): HasMany
    {
        return $this->hasMany(RendezVous::class);
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    public function prescriptions(): HasManyThrough
    {
        return $this->hasManyThrough(Prescription::class, Consultation::class);
    }

    /**
     * Patients rattachés à un lieu : lieu habituel OU au moins une consultation
     * ou un rendez-vous dans ce lieu.
     */
    public function scopeDuLieu(Builder $query, int $lieuId): Builder
    {
        return $query->where(function (Builder $q) use ($lieuId) {
            $q->where('lieu_id', $lieuId)
              ->orWhereHas('consultations', fn ($c) => $c->where('lieu_id', $lieuId))
              ->orWhereHas('rendezVous', fn ($r) => $r->where('lieu_id', $lieuId));
        });
    }

    /**
     * Recherche par nom, prénom (dans les deux sens), téléphone ou code patient.
     */
    public function scopeRecherche(Builder $query, string $terme): Builder
    {
        $mots = preg_split('/\s+/', trim($terme), -1, PREG_SPLIT_NO_EMPTY);

        foreach ($mots as $mot) {
            $like = '%' . mb_strtolower($mot) . '%';
            $tel = '%' . preg_replace('/\D/', '', $mot) . '%';

            $query->where(function (Builder $q) use ($like, $tel, $mot) {
                $q->whereRaw('LOWER(nom) LIKE ?', [$like])
                  ->orWhereRaw('LOWER(prenom) LIKE ?', [$like])
                  ->orWhereRaw('LOWER(code_patient) LIKE ?', [$like]);
                if (preg_match('/\d/', $mot)) {
                    $q->orWhereRaw("REPLACE(REPLACE(COALESCE(telephone, ''), ' ', ''), '-', '') LIKE ?", [$tel]);
                }
            });
        }

        return $query;
    }

    /** Génère le prochain code patient : PAT-ANNEE-0001. */
    public static function prochainCode(): string
    {
        $annee = date('Y');
        $dernier = static::where('code_patient', 'like', "PAT-{$annee}-%")
            ->orderByDesc('code_patient')
            ->value('code_patient');

        $numero = $dernier ? ((int) substr($dernier, -4)) + 1 : 1;

        return sprintf('PAT-%s-%04d', $annee, $numero);
    }
}
