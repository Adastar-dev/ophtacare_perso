<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    /**
     * Liste / recherche de patients.
     *  ?q=        nom, prénom, téléphone ou code patient
     *  ?lieu_id=  patients vus (ou habituellement suivis) dans ce lieu
     *  ?limit=    nombre maximum de résultats
     */
    public function index(Request $request)
    {
        $query = Patient::with('lieu:id,nom,couleur')
            ->withMax('consultations as derniere_consultation', 'date_consultation');

        if ($request->filled('q')) {
            $query->recherche($request->q);
        }

        if ($request->filled('lieu_id')) {
            $query->duLieu((int) $request->lieu_id);
        }

        $query->orderBy('nom')->orderBy('prenom');

        $query->limit(min((int) ($request->limit ?? 500), 500));

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->valider($request);
        $data['code_patient'] = Patient::prochainCode();

        $patient = Patient::create($data);

        return response()->json([
            'message' => 'Fiche patient créée.',
            'patient' => $patient->load('lieu'),
        ], 201);
    }

    /** Fiche complète : identité, consultations, rendez-vous, ordonnances. */
    public function show(Patient $patient)
    {
        $patient->load([
            'lieu',
            'consultations' => fn ($q) => $q->orderByDesc('date_consultation'),
            'consultations.lieu:id,nom,couleur',
            'consultations.prescription',
            'rendezVous' => fn ($q) => $q->orderByDesc('date_heure_rdv'),
            'rendezVous.lieu:id,nom,couleur',
        ]);

        return response()->json($patient);
    }

    public function update(Request $request, Patient $patient)
    {
        $patient->update($this->valider($request, partiel: true));

        return response()->json([
            'message' => 'Fiche patient mise à jour.',
            'patient' => $patient->fresh()->load('lieu'),
        ]);
    }

    /** Supprime le patient et tout son historique (consultations, RDV, ordonnances). */
    public function destroy(Patient $patient)
    {
        $patient->delete();

        return response()->json(['message' => 'Patient supprimé.']);
    }

    private function valider(Request $request, bool $partiel = false): array
    {
        $req = $partiel ? 'sometimes|required' : 'required';

        return $request->validate([
            'nom' => "$req|string|max:255",
            'prenom' => "$req|string|max:255",
            'date_naissance' => 'nullable|date|before_or_equal:today',
            'genre' => 'nullable|in:M,F',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'adresse' => 'nullable|string|max:255',
            'profession' => 'nullable|string|max:255',
            'antecedents_medicaux' => 'nullable|string',
            'antecedents_ophtalmo' => 'nullable|string',
            'allergies' => 'nullable|string',
            'traitements' => 'nullable|string',
            'notes' => 'nullable|string',
            'assureur' => 'nullable|string|max:255',
            'numero_assurance' => 'nullable|string|max:255',
            'lieu_id' => 'nullable|exists:lieux,id',
        ]);
    }
}
