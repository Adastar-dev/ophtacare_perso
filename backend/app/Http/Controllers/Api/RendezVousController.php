<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RendezVous;
use Illuminate\Http\Request;

class RendezVousController extends Controller
{
    /**
     * Filtres : ?date=Y-m-d, ?date_from=, ?date_to=, ?lieu_id=, ?patient_id=, ?statut=
     */
    public function index(Request $request)
    {
        $query = RendezVous::with([
            'patient:id,code_patient,nom,prenom,telephone,date_naissance',
            'lieu:id,nom,couleur',
            'consultation:id,rendez_vous_id',
        ]);

        if ($request->filled('date')) {
            $query->whereDate('date_heure_rdv', $request->date);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('date_heure_rdv', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date_heure_rdv', '<=', $request->date_to);
        }
        foreach (['lieu_id', 'patient_id', 'statut'] as $champ) {
            if ($request->filled($champ)) {
                $query->where($champ, $request->$champ);
            }
        }

        return response()->json($query->orderBy('date_heure_rdv')->get());
    }

    public function store(Request $request)
    {
        $rdv = RendezVous::create($this->valider($request));

        return response()->json([
            'message' => 'Rendez-vous ajouté.',
            'rendez_vous' => $rdv->load(['patient', 'lieu']),
        ], 201);
    }

    public function show(RendezVous $rendezVous)
    {
        return response()->json($rendezVous->load(['patient', 'lieu', 'consultation']));
    }

    public function update(Request $request, RendezVous $rendezVous)
    {
        $rendezVous->update($this->valider($request, partiel: true));

        return response()->json([
            'message' => 'Rendez-vous mis à jour.',
            'rendez_vous' => $rendezVous->fresh()->load(['patient', 'lieu']),
        ]);
    }

    public function destroy(RendezVous $rendezVous)
    {
        $rendezVous->delete();

        return response()->json(['message' => 'Rendez-vous supprimé.']);
    }

    private function valider(Request $request, bool $partiel = false): array
    {
        $req = $partiel ? 'sometimes|required' : 'required';

        return $request->validate([
            'patient_id' => "$req|exists:patients,id",
            'lieu_id' => "$req|exists:lieux,id",
            'date_heure_rdv' => "$req|date",
            'duree_minutes' => 'sometimes|integer|min:5|max:480',
            'statut' => 'sometimes|in:prevu,honore,annule,absent',
            'motif' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
        ]);
    }
}
