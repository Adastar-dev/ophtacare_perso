<?php

namespace Tests\Feature;

use App\Models\Consultation;
use App\Models\Lieu;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OphtaCareApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::create(['name' => 'Awa Ndiaye', 'email' => 'dr@test.sn', 'password' => 'secret123']);
    }

    private function connecter(): void
    {
        Sanctum::actingAs($this->user);
    }

    private function lieu(string $nom = 'Clinique A'): Lieu
    {
        return Lieu::create(['nom' => $nom]);
    }

    private function patient(array $attrs = []): Patient
    {
        return Patient::create(array_merge([
            'code_patient' => Patient::prochainCode(),
            'nom' => 'Diop',
            'prenom' => 'Mamadou',
        ], $attrs));
    }

    public function test_les_routes_sont_protegees(): void
    {
        $this->getJson('/api/patients')->assertUnauthorized();
        $this->getJson('/api/lieux')->assertUnauthorized();
    }

    public function test_pas_d_inscription_publique(): void
    {
        $this->postJson('/api/register', ['email' => 'x@x.sn'])->assertNotFound();
    }

    public function test_connexion(): void
    {
        $this->postJson('/api/login', ['email' => 'dr@test.sn', 'password' => 'mauvais'])->assertUnauthorized();

        $token = $this->postJson('/api/login', ['email' => 'dr@test.sn', 'password' => 'secret123'])
            ->assertOk()
            ->assertJsonPath('user.email', 'dr@test.sn')
            ->json('access_token');

        $this->withToken($token)->getJson('/api/user')->assertOk()->assertJsonPath('name', 'Awa Ndiaye');
    }

    public function test_connexion_limitee_en_nombre_d_essais(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'dr@test.sn', 'password' => 'mauvais']);
        }
        $this->postJson('/api/login', ['email' => 'dr@test.sn', 'password' => 'secret123'])->assertStatus(429);
    }

    public function test_crud_lieu_et_archivage_si_historique(): void
    {
        $this->connecter();

        $id = $this->postJson('/api/lieux', ['nom' => 'Hôpital Principal', 'type' => 'hopital', 'couleur' => '#059669'])
            ->assertCreated()->json('lieu.id');

        $this->putJson("/api/lieux/$id", ['adresse' => 'Dakar'])->assertOk()->assertJsonPath('lieu.adresse', 'Dakar');
        $this->postJson('/api/lieux', ['nom' => 'X', 'couleur' => 'rouge'])->assertUnprocessable();

        // Lieu vide : suppression définitive
        $vide = $this->lieu('Vide');
        $this->deleteJson("/api/lieux/{$vide->id}")->assertOk()->assertJsonPath('archive', false);
        $this->assertDatabaseMissing('lieux', ['id' => $vide->id]);

        // Lieu avec une consultation : archivé, historique conservé
        $p = $this->patient();
        Consultation::create(['patient_id' => $p->id, 'lieu_id' => $id, 'date_consultation' => now()]);
        $this->deleteJson("/api/lieux/$id")->assertOk()->assertJsonPath('archive', true);
        $this->assertDatabaseHas('lieux', ['id' => $id, 'actif' => false]);

        $this->getJson('/api/lieux')->assertJsonCount(0);
        $this->getJson('/api/lieux?avec_archives=1')->assertJsonCount(1);
    }

    public function test_creation_patient_avec_code_automatique(): void
    {
        $this->connecter();
        $lieu = $this->lieu();

        $r1 = $this->postJson('/api/patients', ['nom' => 'Fall', 'prenom' => 'Fatou', 'lieu_id' => $lieu->id])->assertCreated();
        $r2 = $this->postJson('/api/patients', ['nom' => 'Sarr', 'prenom' => 'Ibrahima', 'telephone' => '77 123 45 67'])->assertCreated();

        $annee = date('Y');
        $this->assertSame("PAT-$annee-0001", $r1->json('patient.code_patient'));
        $this->assertSame("PAT-$annee-0002", $r2->json('patient.code_patient'));

        // Même numéro de téléphone autorisé (famille)
        $this->postJson('/api/patients', ['nom' => 'Sarr', 'prenom' => 'Awa', 'telephone' => '77 123 45 67'])->assertCreated();
        $this->postJson('/api/patients', ['nom' => 'Sans prénom'])->assertUnprocessable();
    }

    public function test_recherche_patient(): void
    {
        $this->connecter();
        $this->patient(['nom' => 'Diop', 'prenom' => 'Mamadou', 'telephone' => '+221 77 123 45 67']);
        $this->patient(['nom' => 'Fall', 'prenom' => 'Fatou', 'telephone' => '78 000 00 00']);

        $this->getJson('/api/patients?q=diop')->assertJsonCount(1)->assertJsonPath('0.nom', 'Diop');
        $this->getJson('/api/patients?q=fatou fall')->assertJsonCount(1);  // prénom + nom
        $this->getJson('/api/patients?q=771234567')->assertJsonCount(1);   // téléphone sans espaces
        $this->getJson('/api/patients?q=PAT-')->assertJsonCount(2);
        $this->getJson('/api/patients?q=inconnu')->assertJsonCount(0);
    }

    public function test_filtre_par_lieu_inclut_les_patients_vus_dans_ce_lieu(): void
    {
        $this->connecter();
        $a = $this->lieu('Clinique A');
        $b = $this->lieu('Hôpital B');

        $habituelA = $this->patient(['nom' => 'Habituel', 'lieu_id' => $a->id]);
        $vuEnB = $this->patient(['nom' => 'VuEnB', 'lieu_id' => $a->id]);
        $rdvEnB = $this->patient(['nom' => 'RdvEnB']);
        Consultation::create(['patient_id' => $vuEnB->id, 'lieu_id' => $b->id, 'date_consultation' => now()]);
        RendezVous::create(['patient_id' => $rdvEnB->id, 'lieu_id' => $b->id, 'date_heure_rdv' => now()->addDay()]);

        $noms = fn ($lieu) => collect($this->getJson("/api/patients?lieu_id={$lieu->id}")->json())->pluck('nom')->sort()->values()->all();

        $this->assertSame(['Habituel', 'VuEnB'], $noms($a));
        $this->assertSame(['RdvEnB', 'VuEnB'], $noms($b));
    }

    public function test_consultation_depuis_rdv_et_chiffrement(): void
    {
        $this->connecter();
        $lieu = $this->lieu();
        $p = $this->patient();
        $rdv = RendezVous::create(['patient_id' => $p->id, 'lieu_id' => $lieu->id, 'date_heure_rdv' => now()]);

        $id = $this->postJson('/api/consultations', [
            'rendez_vous_id' => $rdv->id,
            'ref_od_sphere' => '+1.25',
            'vl_od_avec_correction' => '10/10',
            'tonus_od' => '16',
            'fond_oeil' => 'Papille normale',
            'diagnostic' => 'Hypermétropie',
        ])->assertCreated()
            ->assertJsonPath('consultation.patient_id', $p->id)
            ->assertJsonPath('consultation.lieu_id', $lieu->id)
            ->json('consultation.id');

        $this->assertSame('honore', $rdv->fresh()->statut);

        // Notation conservée telle quelle, texte clinique chiffré en base
        $this->getJson("/api/consultations/$id")
            ->assertJsonPath('ref_od_sphere', '+1.25')
            ->assertJsonPath('diagnostic', 'Hypermétropie')
            ->assertJsonPath('fond_oeil', 'Papille normale');
        $brut = DB::table('consultations')->where('id', $id)->first();
        $this->assertNotSame('Hypermétropie', $brut->diagnostic);
        $this->assertStringNotContainsString('Papille', $brut->fond_oeil);

        // Modification
        $this->putJson("/api/consultations/$id", ['diagnostic' => 'Hypermétropie légère'])->assertOk()
            ->assertJsonPath('consultation.diagnostic', 'Hypermétropie légère');
    }

    public function test_consultation_depuis_la_fiche_rattache_le_rdv_du_jour(): void
    {
        $this->connecter();
        $lieu = $this->lieu();
        $p = $this->patient();
        $demain = RendezVous::create(['patient_id' => $p->id, 'lieu_id' => $lieu->id, 'date_heure_rdv' => now()->addDay()]);
        $aujourdhui = RendezVous::create(['patient_id' => $p->id, 'lieu_id' => $lieu->id, 'date_heure_rdv' => now()]);

        $this->postJson('/api/consultations', ['patient_id' => $p->id, 'lieu_id' => $lieu->id])
            ->assertCreated()
            ->assertJsonPath('consultation.rendez_vous_id', $aujourdhui->id);

        $this->assertSame('honore', $aujourdhui->fresh()->statut);
        $this->assertSame('prevu', $demain->fresh()->statut);
    }

    public function test_consultation_exige_patient_et_lieu(): void
    {
        $this->connecter();
        $p = $this->patient();
        $this->postJson('/api/consultations', ['patient_id' => $p->id])->assertUnprocessable();
        $this->postJson('/api/consultations', ['lieu_id' => $this->lieu()->id])->assertUnprocessable();
    }

    public function test_ordonnance_aplatie_et_unique_par_consultation(): void
    {
        $this->connecter();
        $lieu = $this->lieu();
        $c = Consultation::create(['patient_id' => $this->patient()->id, 'lieu_id' => $lieu->id, 'date_consultation' => now()]);

        $id = $this->postJson('/api/prescriptions', [
            'consultation_id' => $c->id,
            'type_verre' => 'progressif',
            'oeil_droit_add' => '+2.00',
            'traitement' => "Timolol 0,5 % : 1 goutte matin et soir",
        ])->assertCreated()
            ->assertJsonPath('prescription.type_verre', 'progressif')
            ->assertJsonPath('prescription.traitement', 'Timolol 0,5 % : 1 goutte matin et soir')
            ->assertJsonPath('prescription.consultation.lieu.nom', 'Clinique A')
            ->assertJsonMissingPath('prescription.contenu_ordonnance')
            ->json('prescription.id');

        $this->postJson('/api/prescriptions', ['consultation_id' => $c->id, 'type_verre' => 'unifocal'])->assertUnprocessable();

        $this->putJson("/api/prescriptions/$id", ['type_teinte' => 'solaire'])->assertOk()
            ->assertJsonPath('prescription.type_teinte', 'solaire')
            ->assertJsonPath('prescription.type_verre', 'progressif');

        $this->getJson("/api/prescriptions?lieu_id={$lieu->id}")->assertJsonCount(1);
        $this->getJson('/api/prescriptions?lieu_id=999')->assertJsonCount(0);
    }

    public function test_fiche_patient_complete(): void
    {
        $this->connecter();
        $a = $this->lieu('Clinique A');
        $b = $this->lieu('Hôpital B');
        $p = $this->patient(['lieu_id' => $a->id]);
        Consultation::create(['patient_id' => $p->id, 'lieu_id' => $a->id, 'date_consultation' => now()->subMonth()]);
        Consultation::create(['patient_id' => $p->id, 'lieu_id' => $b->id, 'date_consultation' => now()]);

        $this->getJson("/api/patients/{$p->id}")
            ->assertOk()
            ->assertJsonCount(2, 'consultations')
            ->assertJsonPath('consultations.0.lieu.nom', 'Hôpital B') // la plus récente d'abord
            ->assertJsonPath('lieu.nom', 'Clinique A');
    }

    public function test_agenda_et_accueil(): void
    {
        $this->connecter();
        $a = $this->lieu('Clinique A');
        $b = $this->lieu('Hôpital B');
        $p = $this->patient();

        $this->postJson('/api/rendez-vous', ['patient_id' => $p->id, 'lieu_id' => $a->id, 'date_heure_rdv' => now()->setTime(23, 0)->format('Y-m-d H:i:s')])->assertCreated();
        $id = $this->postJson('/api/rendez-vous', ['patient_id' => $p->id, 'lieu_id' => $b->id, 'date_heure_rdv' => now()->addDays(2)->format('Y-m-d H:i:s')])
            ->assertCreated()->json('rendez_vous.id');
        $this->postJson('/api/rendez-vous', ['patient_id' => $p->id, 'date_heure_rdv' => now()->format('Y-m-d H:i:s')])->assertUnprocessable();

        $this->getJson('/api/rendez-vous?date_from=' . now()->format('Y-m-d') . '&date_to=' . now()->addDays(3)->format('Y-m-d'))->assertJsonCount(2);
        $this->getJson("/api/rendez-vous?lieu_id={$b->id}")->assertJsonCount(1);

        $this->putJson("/api/rendez-vous/$id", ['statut' => 'absent'])->assertOk()->assertJsonPath('rendez_vous.statut', 'absent');
        $this->putJson("/api/rendez-vous/$id", ['statut' => 'inconnu'])->assertUnprocessable();

        $this->getJson('/api/dashboard')->assertOk()->assertJsonCount(1, 'rdv_du_jour')->assertJsonPath('stats.patients', 1);
        $this->getJson("/api/dashboard?lieu_id={$b->id}")->assertJsonCount(0, 'rdv_du_jour');

        $this->deleteJson("/api/rendez-vous/$id")->assertOk();
    }

    public function test_profil_et_mot_de_passe(): void
    {
        $this->connecter();
        $this->putJson('/api/profil', ['numero_ordre' => 'ONMS-123', 'specialite' => 'Ophtalmologiste'])->assertOk()
            ->assertJsonPath('user.numero_ordre', 'ONMS-123');

        $this->user->createToken('test'); // pour currentAccessToken()
        Sanctum::actingAs($this->user->fresh());

        $this->putJson('/api/profil/mot-de-passe', ['current_password' => 'faux', 'password' => 'nouveau123', 'password_confirmation' => 'nouveau123'])
            ->assertUnprocessable();
    }

    public function test_suppression_patient_supprime_son_historique(): void
    {
        $this->connecter();
        $lieu = $this->lieu();
        $p = $this->patient();
        Consultation::create(['patient_id' => $p->id, 'lieu_id' => $lieu->id, 'date_consultation' => now()]);

        $this->deleteJson("/api/patients/{$p->id}")->assertOk();
        $this->assertDatabaseCount('consultations', 0);
    }
}
