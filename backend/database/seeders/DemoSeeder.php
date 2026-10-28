<?php

namespace Database\Seeders;

use App\Models\Consultation;
use App\Models\Lieu;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\RendezVous;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Données fictives pour tester l'application en local.
 *   php artisan migrate:fresh --seed
 * Connexion : demo@ophtacare.local / demo1234
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Awa Ndiaye',
            'email' => 'demo@ophtacare.local',
            'password' => 'demo1234',
            'telephone' => '+221 77 000 00 00',
            'numero_ordre' => 'ONMS-0000',
        ]);

        $lieux = collect([
            ['nom' => 'Clinique de la Madeleine', 'type' => 'clinique', 'adresse' => 'Avenue Pasteur, Dakar', 'telephone' => '+221 33 800 00 01', 'couleur' => '#2563eb', 'notes' => 'Lundi et mercredi matin'],
            ['nom' => 'Hôpital Principal', 'type' => 'hopital', 'adresse' => 'Avenue Nelson Mandela, Dakar', 'telephone' => '+221 33 800 00 02', 'couleur' => '#059669', 'notes' => 'Mardi et jeudi'],
            ['nom' => 'Cabinet Point E', 'type' => 'cabinet', 'adresse' => 'Point E, Dakar', 'couleur' => '#d97706', 'notes' => 'Vendredi et samedi matin'],
        ])->map(fn ($l) => Lieu::create($l));

        $personnes = [
            ['Diop', 'Mamadou', '1958-03-12', 'M'], ['Fall', 'Fatou', '1984-07-25', 'F'],
            ['Sarr', 'Ibrahima', '1972-11-02', 'M'], ['Ba', 'Aminata', '2012-05-18', 'F'],
            ['Gueye', 'Cheikh', '1966-09-30', 'M'], ['Sy', 'Mariama', '1990-01-14', 'F'],
            ['Faye', 'Ousmane', '1949-12-08', 'M'], ['Cissé', 'Khady', '1979-04-22', 'F'],
            ['Mbaye', 'Abdoulaye', '2001-08-03', 'M'], ['Kane', 'Ndeye', '1995-06-11', 'F'],
            ['Thiam', 'Moustapha', '1963-02-27', 'M'], ['Sow', 'Coumba', '1987-10-05', 'F'],
        ];

        $diagnostics = [
            'Myopie bilatérale', 'Presbytie', 'Astigmatisme OD', 'Glaucome chronique à angle ouvert — suivi',
            'Cataracte débutante OG', 'Conjonctivite allergique', 'Hypermétropie légère', 'Sécheresse oculaire',
        ];

        foreach ($personnes as $i => [$nom, $prenom, $naissance, $genre]) {
            $lieu = $lieux[$i % 3];
            $patient = Patient::create([
                'code_patient' => Patient::prochainCode(),
                'nom' => $nom,
                'prenom' => $prenom,
                'date_naissance' => $naissance,
                'genre' => $genre,
                'telephone' => sprintf('+221 77 %03d %02d %02d', 100 + $i, $i, 40 + $i),
                'antecedents_medicaux' => $i % 4 === 0 ? 'HTA, diabète de type 2' : null,
                'allergies' => $i % 5 === 0 ? 'Pénicilline' : null,
                'lieu_id' => $lieu->id,
            ]);

            // 1 à 3 consultations ; certains patients ont été vus dans un autre lieu
            for ($k = 0; $k < 1 + $i % 3; $k++) {
                $autre = $k === 1 && $i % 2 === 0 ? $lieux[($i + 1) % 3] : $lieu;
                $c = Consultation::create([
                    'patient_id' => $patient->id,
                    'lieu_id' => $autre->id,
                    'date_consultation' => now()->subDays(20 + $k * 90 + $i)->setTime(9 + $k, 30),
                    'motif' => $k === 0 ? 'Baisse de vision' : 'Contrôle',
                    'vl_od_sans_correction' => (6 + $i % 4) . '/10',
                    'vl_og_sans_correction' => (5 + $i % 5) . '/10',
                    'vl_od_avec_correction' => '10/10',
                    'vl_og_avec_correction' => '10/10',
                    'ref_od_sphere' => sprintf('%+.2f', -1.25 + $i * 0.25),
                    'ref_od_cylindre' => '-0.50',
                    'ref_od_axe' => '90',
                    'ref_og_sphere' => sprintf('%+.2f', -1.00 + $i * 0.25),
                    'ref_og_cylindre' => '-0.25',
                    'ref_og_axe' => '85',
                    'tonus_od' => (string) (14 + $i % 6),
                    'tonus_og' => (string) (15 + $i % 5),
                    'lampe_fente' => 'Segment antérieur calme, cornée claire.',
                    'fond_oeil' => 'Papille bien colorée, C/D 0,3.',
                    'diagnostic' => $diagnostics[($i + $k) % count($diagnostics)],
                    'conduite_a_tenir' => 'Contrôle dans 6 mois.',
                ]);

                if (($i + $k) % 2 === 0) {
                    Prescription::create([
                        'consultation_id' => $c->id,
                        'contenu_ordonnance' => [
                            'type_verre' => $i > 6 ? 'progressif' : 'unifocal',
                            'type_teinte' => 'blanc',
                            'oeil_droit_add' => $i > 6 ? '+2.00' : null,
                            'oeil_gauche_add' => $i > 6 ? '+2.00' : null,
                            'traitement' => $i % 3 === 0 ? "Larmes artificielles : 1 goutte 4 fois/jour pendant 1 mois" : null,
                        ],
                    ]);
                }
            }

            // Rendez-vous à venir (dont aujourd'hui)
            RendezVous::create([
                'patient_id' => $patient->id,
                'lieu_id' => $lieu->id,
                'date_heure_rdv' => now()->addDays($i % 5)->setTime(8 + $i % 6, $i % 2 ? 30 : 0),
                'motif' => 'Contrôle',
            ]);
        }
    }
}
