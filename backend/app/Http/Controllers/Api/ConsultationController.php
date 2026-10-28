<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\RendezVous;
use Illuminate\Http\Request;

class ConsultationController extends Controller
{
    /**
     * Filtres : ?patient_id=, ?lieu_id=, ?q= (nom du patient), ?limit=
     */
    public function index(Request $request)
    {
        $query = Consultation::with([
            'patient:id,code_patient,nom,prenom,date_naissance',
            'lieu:id,nom,couleur',
            'prescription',
        ])->orderByDesc('date_consultation');

        foreach (['patient_id', 'lieu_id'] as $champ) {
            if ($request->filled($champ)) {
                $query->where($champ, $request->$champ);
            }
        }

        if ($request->filled('q')) {
            $query->whereHas('patient', fn ($p) => $p->recherche($request->q));
        }

        $query->limit(min((int) ($request->limit ?? 200), 500));

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->valider($request);
        $data['date_consultation'] ??= now();

        // Si la consultation vient d'un RDV, on reprend son patient / lieu et on le marque honoré
        if (! empty($data['rendez_vous_id'])) {
            $rdv = RendezVous::findOrFail($data['rendez_vous_id']);
            $data['patient_id'] = $rdv->patient_id;
            $data['lieu_id'] ??= $rdv->lieu_id;
            $rdv->update(['statut' => 'honore']);
        }

        if (empty($data['patient_id']) || empty($data['lieu_id'])) {
            return response()->json([
                'message' => 'Le patient et le lieu de consultation sont obligatoires.',
            ], 422);
        }

        // Consultation ouverte depuis la fiche (sans passer par l'agenda) : si le patient
        // avait un RDV prévu ce jour-là, on l'y rattache et on le marque honoré.
        if (empty($data['rendez_vous_id'])) {
            $jour = \Illuminate\Support\Carbon::parse($data['date_consultation'])->toDateString();
            $rdvDuJour = RendezVous::where('patient_id', $data['patient_id'])
                ->where('statut', 'prevu')
                ->whereDate('date_heure_rdv', $jour)
                ->whereDoesntHave('consultation')
                ->orderByRaw('CASE WHEN lieu_id = ? THEN 0 ELSE 1 END', [$data['lieu_id']])
                ->orderBy('date_heure_rdv')
                ->first();
            if ($rdvDuJour) {
                $data['rendez_vous_id'] = $rdvDuJour->id;
                $rdvDuJour->update(['statut' => 'honore']);
            }
        }

        $consultation = Consultation::create($data);

        return response()->json([
            'message' => 'Consultation enregistrée.',
            'consultation' => $consultation->load(['patient', 'lieu']),
        ], 201);
    }

    public function show(Consultation $consultation)
    {
        return response()->json($consultation->load(['patient', 'lieu', 'prescription', 'rendezVous']));
    }

    public function update(Request $request, Consultation $consultation)
    {
        $data = $this->valider($request, partiel: true);
        unset($data['rendez_vous_id']);

        $consultation->update($data);

        return response()->json([
            'message' => 'Consultation mise à jour.',
            'consultation' => $consultation->fresh()->load(['patient', 'lieu', 'prescription']),
        ]);
    }

    public function destroy(Consultation $consultation)
    {
        $consultation->delete();

        return response()->json(['message' => 'Consultation supprimée.']);
    }

    private function valider(Request $request, bool $partiel = false): array
    {
        $regles = [
            'rendez_vous_id' => 'nullable|exists:rendez_vous,id',
            'patient_id' => ($partiel ? 'sometimes|required' : 'required_without:rendez_vous_id') . '|nullable|exists:patients,id',
            'lieu_id' => ($partiel ? 'sometimes|required' : 'required_without:rendez_vous_id') . '|nullable|exists:lieux,id',
            'date_consultation' => 'nullable|date',
        ];

        foreach (Consultation::CHAMPS_CLINIQUES as $champ) {
            $regles[$champ] = in_array($champ, ['lampe_fente', 'fond_oeil', 'diagnostic', 'observations_cliniques', 'conduite_a_tenir'])
                ? 'nullable|string|max:10000'
                : 'nullable|string|max:500';
        }

        return $request->validate($regles);
    }
}
