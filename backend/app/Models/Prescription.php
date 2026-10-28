<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Ordonnance : correction optique et/ou traitement (collyres, médicaments).
 * Le contenu est stocké en JSON dans `contenu_ordonnance` et exposé à plat
 * dans les réponses JSON (type_verre, traitement, …).
 */
class Prescription extends Model
{
    public const CHAMPS = [
        'type_verre',        // unifocal | progressif | bifocal | lentilles | null
        'type_teinte',       // blanc | photochromique | solaire | null
        'oeil_droit_add',
        'oeil_gauche_add',
        'ecart_pupillaire',
        'traitement',        // texte libre, une ligne par médicament
        'remarques',
    ];

    protected $fillable = ['consultation_id', 'contenu_ordonnance'];

    protected $casts = [
        'contenu_ordonnance' => 'array',
    ];

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function toArray(): array
    {
        $data = parent::toArray();
        $contenu = $this->contenu_ordonnance ?? [];
        unset($data['contenu_ordonnance']);

        foreach (self::CHAMPS as $champ) {
            $data[$champ] = $contenu[$champ] ?? null;
        }

        return $data;
    }
}
