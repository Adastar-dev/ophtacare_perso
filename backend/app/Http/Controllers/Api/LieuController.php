<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lieu;
use App\Models\Patient;
use Illuminate\Http\Request;

class LieuController extends Controller
{
    private const TYPES = 'clinique,hopital,cabinet,autre';

    public function index(Request $request)
    {
        $query = Lieu::query()
            ->withCount(['consultations', 'rendezVous as rdv_a_venir_count' => fn ($q) => $q
                ->where('date_heure_rdv', '>=', now()->startOfDay())
                ->where('statut', 'prevu')])
            ->orderByDesc('actif')
            ->orderBy('nom');

        if (! $request->boolean('avec_archives')) {
            $query->where('actif', true);
        }

        $lieux = $query->get()->each(function (Lieu $lieu) {
            $lieu->patients_count = Patient::duLieu($lieu->id)->count();
        });

        return response()->json($lieux);
    }

    public function store(Request $request)
    {
        $lieu = Lieu::create($this->valider($request));

        return response()->json(['message' => 'Lieu ajouté.', 'lieu' => $lieu], 201);
    }

    public function show(Lieu $lieu)
    {
        return response()->json($lieu);
    }

    public function update(Request $request, Lieu $lieu)
    {
        $lieu->update($this->valider($request, partiel: true));

        return response()->json(['message' => 'Lieu mis à jour.', 'lieu' => $lieu->fresh()]);
    }

    /**
     * Supprime un lieu vide. S'il contient déjà des consultations ou des
     * rendez-vous, il est archivé pour ne pas perdre l'historique.
     */
    public function destroy(Lieu $lieu)
    {
        if ($lieu->consultations()->exists() || $lieu->rendezVous()->exists()) {
            $lieu->update(['actif' => false]);

            return response()->json([
                'message' => 'Ce lieu contient un historique : il a été archivé (masqué) au lieu d\'être supprimé.',
                'archive' => true,
            ]);
        }

        $lieu->delete();

        return response()->json(['message' => 'Lieu supprimé.', 'archive' => false]);
    }

    private function valider(Request $request, bool $partiel = false): array
    {
        $req = $partiel ? 'sometimes|required' : 'required';

        return $request->validate([
            'nom' => "$req|string|max:255",
            'type' => 'sometimes|in:' . self::TYPES,
            'adresse' => 'nullable|string|max:255',
            'telephone' => 'nullable|string|max:50',
            'couleur' => ['sometimes', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'notes' => 'nullable|string',
            'actif' => 'sometimes|boolean',
        ]);
    }
}
