<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    private const RELATIONS = [
        'consultation.patient:id,code_patient,nom,prenom,date_naissance,genre',
        'consultation.lieu',
    ];

    /** Filtres : ?lieu_id=, ?patient_id=, ?consultation_id= */
    public function index(Request $request)
    {
        $query = Prescription::with(self::RELATIONS)->latest();

        if ($request->filled('consultation_id')) {
            $query->where('consultation_id', $request->consultation_id);
        }
        if ($request->filled('lieu_id')) {
            $query->whereHas('consultation', fn ($c) => $c->where('lieu_id', $request->lieu_id));
        }
        if ($request->filled('patient_id')) {
            $query->whereHas('consultation', fn ($c) => $c->where('patient_id', $request->patient_id));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['consultation_id' => 'required|exists:consultations,id|unique:prescriptions,consultation_id'] + $this->regles(), [
            'consultation_id.unique' => 'Cette consultation a déjà une ordonnance : modifiez-la plutôt.',
        ]);

        $prescription = Prescription::create([
            'consultation_id' => $validated['consultation_id'],
            'contenu_ordonnance' => $this->contenu($validated),
        ]);

        return response()->json([
            'message' => 'Ordonnance enregistrée.',
            'prescription' => $prescription->load(self::RELATIONS),
        ], 201);
    }

    public function show(Prescription $prescription)
    {
        return response()->json($prescription->load(self::RELATIONS));
    }

    public function update(Request $request, Prescription $prescription)
    {
        $validated = $request->validate($this->regles());

        $prescription->update([
            'contenu_ordonnance' => array_merge($prescription->contenu_ordonnance ?? [], $this->contenu($validated)),
        ]);

        return response()->json([
            'message' => 'Ordonnance mise à jour.',
            'prescription' => $prescription->fresh()->load(self::RELATIONS),
        ]);
    }

    public function destroy(Prescription $prescription)
    {
        $prescription->delete();

        return response()->json(['message' => 'Ordonnance supprimée.']);
    }

    private function regles(): array
    {
        return [
            'type_verre' => 'nullable|in:unifocal,progressif,bifocal,lentilles',
            'type_teinte' => 'nullable|in:blanc,photochromique,solaire',
            'oeil_droit_add' => 'nullable|string|max:20',
            'oeil_gauche_add' => 'nullable|string|max:20',
            'ecart_pupillaire' => 'nullable|string|max:20',
            'traitement' => 'nullable|string|max:5000',
            'remarques' => 'nullable|string|max:5000',
        ];
    }

    private function contenu(array $validated): array
    {
        return collect(Prescription::CHAMPS)
            ->filter(fn ($champ) => array_key_exists($champ, $validated))
            ->mapWithKeys(fn ($champ) => [$champ => $validated[$champ]])
            ->all();
    }
}
