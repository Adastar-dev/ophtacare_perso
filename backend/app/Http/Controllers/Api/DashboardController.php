<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Patient;
use App\Models\RendezVous;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /** Résumé de l'accueil, optionnellement limité à un lieu (?lieu_id=). */
    public function index(Request $request)
    {
        $lieuId = $request->filled('lieu_id') ? (int) $request->lieu_id : null;

        $rdvDuJour = RendezVous::with(['patient:id,nom,prenom,code_patient', 'lieu:id,nom,couleur', 'consultation:id,rendez_vous_id'])
            ->whereDate('date_heure_rdv', today())
            ->when($lieuId, fn ($q) => $q->where('lieu_id', $lieuId))
            ->orderBy('date_heure_rdv')
            ->get();

        $consultations = Consultation::query()->when($lieuId, fn ($q) => $q->where('lieu_id', $lieuId));

        $patients = $lieuId ? Patient::duLieu($lieuId) : Patient::query();

        return response()->json([
            'rdv_du_jour' => $rdvDuJour,
            'stats' => [
                'patients' => $patients->count(),
                'consultations_mois' => (clone $consultations)
                    ->where('date_consultation', '>=', now()->startOfMonth())->count(),
                'rdv_a_venir' => RendezVous::where('statut', 'prevu')
                    ->where('date_heure_rdv', '>', now())
                    ->when($lieuId, fn ($q) => $q->where('lieu_id', $lieuId))
                    ->count(),
            ],
            'consultations_recentes' => (clone $consultations)
                ->with(['patient:id,nom,prenom,code_patient', 'lieu:id,nom,couleur'])
                ->orderByDesc('date_consultation')
                ->limit(6)
                ->get(['id', 'patient_id', 'lieu_id', 'date_consultation', 'diagnostic']),
        ]);
    }
}
