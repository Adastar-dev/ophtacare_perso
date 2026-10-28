// Appels typés vers l'API Laravel.
import { api } from "@/lib/api"
import type {
  Consultation, DashboardData, Lieu, Patient, Prescription, PrescriptionContenu, RendezVous, User,
} from "@/lib/types"

type Params = Record<string, string | number | boolean | null | undefined>

function qs(params?: Params): string {
  if (!params) return ""
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  if (entries.length === 0) return ""
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

type Msg<K extends string, T> = { message: string } & { [P in K]: T }

// ── Profil ──
export const updateProfil = (data: Partial<User>) => api.put<Msg<"user", User>>("/profil", data)
export const updatePassword = (data: { current_password: string; password: string; password_confirmation: string }) =>
  api.put<{ message: string }>("/profil/mot-de-passe", data)

// ── Accueil ──
export const getDashboard = (lieuId?: number | null) => api.get<DashboardData>(`/dashboard${qs({ lieu_id: lieuId })}`)

// ── Lieux ──
export const getLieux = (avecArchives = false) => api.get<Lieu[]>(`/lieux${qs({ avec_archives: avecArchives ? 1 : undefined })}`)
export const createLieu = (data: Partial<Lieu>) => api.post<Msg<"lieu", Lieu>>("/lieux", data)
export const updateLieu = (id: number, data: Partial<Lieu>) => api.put<Msg<"lieu", Lieu>>(`/lieux/${id}`, data)
export const deleteLieu = (id: number) => api.delete<{ message: string; archive: boolean }>(`/lieux/${id}`)

// ── Patients ──
export const getPatients = (params?: { q?: string; lieu_id?: number | null; limit?: number }) =>
  api.get<Patient[]>(`/patients${qs(params)}`)
export const getPatient = (id: number | string) => api.get<Patient>(`/patients/${id}`)
export const createPatient = (data: Partial<Patient>) => api.post<Msg<"patient", Patient>>("/patients", data)
export const updatePatient = (id: number, data: Partial<Patient>) => api.put<Msg<"patient", Patient>>(`/patients/${id}`, data)
export const deletePatient = (id: number) => api.delete<{ message: string }>(`/patients/${id}`)

// ── Rendez-vous ──
export const getRendezVous = (params?: Params) => api.get<RendezVous[]>(`/rendez-vous${qs(params)}`)
export const getRendezVousDetail = (id: number | string) => api.get<RendezVous>(`/rendez-vous/${id}`)
export const createRendezVous = (data: Partial<RendezVous>) => api.post<Msg<"rendez_vous", RendezVous>>("/rendez-vous", data)
export const updateRendezVous = (id: number, data: Partial<RendezVous>) =>
  api.put<Msg<"rendez_vous", RendezVous>>(`/rendez-vous/${id}`, data)
export const deleteRendezVous = (id: number) => api.delete<{ message: string }>(`/rendez-vous/${id}`)

// ── Consultations ──
export const getConsultations = (params?: { patient_id?: number | string; lieu_id?: number | null; q?: string; limit?: number }) =>
  api.get<Consultation[]>(`/consultations${qs(params)}`)
export const getConsultation = (id: number | string) => api.get<Consultation>(`/consultations/${id}`)
export const createConsultation = (data: Partial<Consultation>) =>
  api.post<Msg<"consultation", Consultation>>("/consultations", data)
export const updateConsultation = (id: number, data: Partial<Consultation>) =>
  api.put<Msg<"consultation", Consultation>>(`/consultations/${id}`, data)
export const deleteConsultation = (id: number) => api.delete<{ message: string }>(`/consultations/${id}`)

// ── Ordonnances ──
export const getPrescriptions = (params?: { lieu_id?: number | null; patient_id?: number }) =>
  api.get<Prescription[]>(`/prescriptions${qs(params)}`)
export const getPrescription = (id: number | string) => api.get<Prescription>(`/prescriptions/${id}`)
export const createPrescription = (data: Partial<PrescriptionContenu> & { consultation_id: number }) =>
  api.post<Msg<"prescription", Prescription>>("/prescriptions", data)
export const updatePrescription = (id: number, data: Partial<PrescriptionContenu>) =>
  api.put<Msg<"prescription", Prescription>>(`/prescriptions/${id}`, data)
export const deletePrescription = (id: number) => api.delete<{ message: string }>(`/prescriptions/${id}`)
