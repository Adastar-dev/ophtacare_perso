// Types alignés sur l'API Laravel OphtaCare (usage personnel, un seul compte).

export interface User {
  id: number
  name: string
  email: string
  titre: string | null
  specialite: string | null
  telephone: string | null
  numero_ordre: string | null
}

export type TypeLieu = 'clinique' | 'hopital' | 'cabinet' | 'autre'

export interface Lieu {
  id: number
  nom: string
  type: TypeLieu
  adresse: string | null
  telephone: string | null
  couleur: string
  notes: string | null
  actif: boolean
  patients_count?: number
  consultations_count?: number
  rdv_a_venir_count?: number
}

/** Version réduite d'un lieu, renvoyée dans les relations. */
export type LieuMini = Pick<Lieu, 'id' | 'nom' | 'couleur'> & Partial<Lieu>

export interface Patient {
  id: number
  code_patient: string
  nom: string
  prenom: string
  date_naissance: string | null
  genre: 'M' | 'F' | null
  telephone: string | null
  email: string | null
  adresse: string | null
  profession: string | null
  antecedents_medicaux: string | null
  antecedents_ophtalmo: string | null
  allergies: string | null
  traitements: string | null
  notes: string | null
  assureur: string | null
  numero_assurance: string | null
  lieu_id: number | null
  lieu?: LieuMini | null
  derniere_consultation?: string | null
  consultations?: Consultation[]
  rendez_vous?: RendezVous[]
  created_at?: string
}

export type PatientMini = Pick<Patient, 'id' | 'nom' | 'prenom' | 'code_patient'> & Partial<Patient>

export type StatutRdv = 'prevu' | 'honore' | 'annule' | 'absent'

export interface RendezVous {
  id: number
  patient_id: number
  lieu_id: number
  date_heure_rdv: string
  duree_minutes: number
  statut: StatutRdv
  motif: string | null
  notes: string | null
  patient?: PatientMini
  lieu?: LieuMini
  consultation?: { id: number } | null
}

export interface Consultation {
  id: number
  patient_id: number
  lieu_id: number
  rendez_vous_id: number | null
  date_consultation: string
  motif: string | null
  vl_od_sans_correction: string | null
  vl_od_avec_correction: string | null
  vl_og_sans_correction: string | null
  vl_og_avec_correction: string | null
  vp_od: string | null
  vp_og: string | null
  ref_od_sphere: string | null
  ref_od_cylindre: string | null
  ref_od_axe: string | null
  ref_og_sphere: string | null
  ref_og_cylindre: string | null
  ref_og_axe: string | null
  tonus_od: string | null
  tonus_og: string | null
  lampe_fente: string | null
  fond_oeil: string | null
  diagnostic: string | null
  observations_cliniques: string | null
  conduite_a_tenir: string | null
  patient?: PatientMini
  lieu?: LieuMini
  prescription?: Prescription | null
  created_at?: string
}

export type TypeVerre = 'unifocal' | 'progressif' | 'bifocal' | 'lentilles'
export type TypeTeinte = 'blanc' | 'photochromique' | 'solaire'

export interface PrescriptionContenu {
  type_verre: TypeVerre | null
  type_teinte: TypeTeinte | null
  oeil_droit_add: string | null
  oeil_gauche_add: string | null
  ecart_pupillaire: string | null
  traitement: string | null
  remarques: string | null
}

export interface Prescription extends PrescriptionContenu {
  id: number
  consultation_id: number
  created_at?: string
  consultation?: Consultation | null
}

export interface DashboardData {
  rdv_du_jour: RendezVous[]
  stats: { patients: number; consultations_mois: number; rdv_a_venir: number }
  consultations_recentes: Consultation[]
}
