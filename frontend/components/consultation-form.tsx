"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LieuSelect } from "@/components/lieu-select"
import { LieuBadge } from "@/components/lieu-badge"
import { PatientPicker } from "@/components/patient-picker"
import { Erreur } from "@/components/page-states"
import { PRESCRIPTION_VIDE, PrescriptionFields, prescriptionEstVide } from "@/components/prescription/prescription-dialog"
import { AlertCircle, ChevronLeft, ChevronRight, Copy, Loader2, Save, UserSearch } from "lucide-react"
import { getConsultations, getPatient } from "@/lib/services"
import { ApiError } from "@/lib/api"
import { ageLabel, fmtDate, initiales, nomComplet, toDateTimeLocal } from "@/lib/format"
import type { Consultation, Patient, PrescriptionContenu } from "@/lib/types"
import { cn } from "@/lib/utils"

const ETAPES = ["Identification", "Acuité", "Réfraction", "Examen", "Conclusion"] as const

function StepperNav({ step, total, onPrev, onNext, saving }: {
  step: number; total: number; onPrev: () => void; onNext: () => void; saving: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 lg:hidden">
      <Button type="button" variant="outline" onClick={onPrev} disabled={step === 0 || saving} className="h-11 px-4">
        <ChevronLeft className="mr-1 h-4 w-4" />Précédent
      </Button>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-5 bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-muted"}`} />
        ))}
      </div>
      {step < total - 1 ? (
        <Button type="button" onClick={onNext} disabled={saving} className="h-11 px-4">
          Suivant<ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      ) : (
        <Button type="submit" disabled={saving} className="h-11 px-4">
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Enregistrer
        </Button>
      )}
    </div>
  )
}

const CHAMPS = [
  "motif",
  "vl_od_sans_correction", "vl_od_avec_correction", "vl_og_sans_correction", "vl_og_avec_correction",
  "vp_od", "vp_og",
  "ref_od_sphere", "ref_od_cylindre", "ref_od_axe", "ref_og_sphere", "ref_og_cylindre", "ref_og_axe",
  "tonus_od", "tonus_og",
  "lampe_fente", "fond_oeil", "diagnostic", "observations_cliniques", "conduite_a_tenir",
] as const

type Champ = (typeof CHAMPS)[number]
type Valeurs = Record<Champ, string>

const vide = (): Valeurs => Object.fromEntries(CHAMPS.map((c) => [c, ""])) as Valeurs

export type ConsultationPayload = Omit<Partial<Consultation>, "prescription"> & {
  prescription?: PrescriptionContenu | null
}

interface Props {
  consultation?: Consultation | null
  patientId?: number | null
  rendezVousId?: number | null
  lieuParDefaut?: number | null
  motifParDefaut?: string | null
  submitLabel: string
  onSubmit: (data: ConsultationPayload) => Promise<void>
  onCancel: () => void
}

/** Une ligne OD / OG du formulaire. */
function LigneOeil({ label, od, og, placeholder, unite }: {
  label: string
  od: { value: string; onChange: (v: string) => void }
  og: { value: string; onChange: (v: string) => void }
  placeholder?: [string, string]
  unite?: string
}) {
  const cls = "text-base sm:text-sm text-center"
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_1fr_1fr] sm:grid-cols-[10rem_1fr_1fr] items-center gap-2">
      <span className="text-sm text-muted-foreground leading-tight">{label}{unite && <span className="text-xs"> ({unite})</span>}</span>
      <Input value={od.value} onChange={(e) => od.onChange(e.target.value)} placeholder={placeholder?.[0]} className={cls} aria-label={`${label} OD`} inputMode="decimal" />
      <Input value={og.value} onChange={(e) => og.onChange(e.target.value)} placeholder={placeholder?.[1]} className={cls} aria-label={`${label} OG`} inputMode="decimal" />
    </div>
  )
}

function EnteteOeil() {
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_1fr_1fr] sm:grid-cols-[10rem_1fr_1fr] gap-2 text-xs font-semibold text-center">
      <span />
      <span className="rounded-md bg-primary/10 text-primary py-1">OD (droit)</span>
      <span className="rounded-md bg-accent/10 text-accent py-1">OG (gauche)</span>
    </div>
  )
}

export function ConsultationForm({
  consultation, patientId, rendezVousId, lieuParDefaut, motifParDefaut, submitLabel, onSubmit, onCancel,
}: Props) {
  const edition = !!consultation
  const [patient, setPatient] = useState<Patient | null>(null)
  const [historique, setHistorique] = useState<Consultation[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [step, setStep] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)

  const aller = (delta: number) => {
    setStep((s) => Math.max(0, Math.min(ETAPES.length - 1, s + delta)))
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const [lieuId, setLieuId] = useState<number | null>(consultation?.lieu_id ?? lieuParDefaut ?? null)
  const [date, setDate] = useState(consultation ? consultation.date_consultation.slice(0, 16) : toDateTimeLocal(new Date()))
  const [v, setV] = useState<Valeurs>(() => {
    const base = vide()
    if (consultation) CHAMPS.forEach((c) => { base[c] = (consultation[c] as string | null) ?? "" })
    else if (motifParDefaut) base.motif = motifParDefaut
    return base
  })
  const [avecOrdonnance, setAvecOrdonnance] = useState(false)
  const [ordonnance, setOrdonnance] = useState<PrescriptionContenu>(PRESCRIPTION_VIDE)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const pid = consultation?.patient_id ?? patientId ?? null

  // Charge le patient (et son historique) choisi
  useEffect(() => {
    if (!pid) return
    getPatient(pid).then((p) => {
      setPatient(p)
      setLieuId((l) => l ?? p.lieu_id ?? null)
    }).catch(() => {})
  }, [pid])

  useEffect(() => {
    if (!patient) { setHistorique([]); return }
    getConsultations({ patient_id: patient.id, limit: 5 })
      .then((h) => setHistorique(h.filter((c) => c.id !== consultation?.id)))
      .catch(() => {})
  }, [patient, consultation?.id])

  const choisirPatient = (p: Patient) => {
    setPatient(p)
    setLieuId((l) => l ?? p.lieu_id ?? null)
  }

  const bind = (c: Champ) => ({ value: v[c], onChange: (val: string) => setV((prev) => ({ ...prev, [c]: val })) })
  const bindArea = (c: Champ) => ({ value: v[c], onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setV((prev) => ({ ...prev, [c]: e.target.value })) })

  const derniere = historique[0] ?? null
  const reprendreRefraction = () => {
    if (!derniere) return
    setV((prev) => ({
      ...prev,
      ref_od_sphere: derniere.ref_od_sphere ?? "", ref_od_cylindre: derniere.ref_od_cylindre ?? "", ref_od_axe: derniere.ref_od_axe ?? "",
      ref_og_sphere: derniere.ref_og_sphere ?? "", ref_og_cylindre: derniere.ref_og_cylindre ?? "", ref_og_axe: derniere.ref_og_axe ?? "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patient) { setError("Choisissez le patient."); return }
    if (!lieuId) { setError("Indiquez le lieu de la consultation."); return }
    setSaving(true); setError("")
    try {
      const data: ConsultationPayload = {
        patient_id: patient.id,
        lieu_id: lieuId,
        date_consultation: `${date}:00`,
        ...(Object.fromEntries(CHAMPS.map((c) => [c, v[c].trim() || null])) as Partial<Consultation>),
      }
      if (!edition && rendezVousId) data.rendez_vous_id = rendezVousId
      if (!edition && avecOrdonnance && !prescriptionEstVide(ordonnance)) data.prescription = ordonnance
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement.")
      setSaving(false)
    }
  }

  // helper : masque une carte sur mobile si elle n'est pas l'étape active
  const mobileStep = (s: number) => s !== step ? "hidden lg:block" : ""

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1fr_20rem] gap-6 items-start">
      {/* Indicateur d'étape — mobile uniquement */}
      <div className="lg:hidden flex items-center justify-between text-sm font-medium">
        <span className="text-muted-foreground">Étape {step + 1} / {ETAPES.length}</span>
        <span>{ETAPES[step]}</span>
      </div>
      <div className="space-y-5 min-w-0">
        {/* Étape 0 : Patient, lieu, date */}
        <Card className={mobileStep(0)}>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              {patient ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary text-sm">{initiales(patient)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{nomComplet(patient)}</p>
                    <p className="text-xs text-muted-foreground">{patient.code_patient} · {ageLabel(patient.date_naissance)}</p>
                  </div>
                  {!edition && !patientId && !rendezVousId && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>Changer</Button>
                  )}
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full justify-start font-normal h-11" onClick={() => setPickerOpen(true)}>
                  <UserSearch className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Rechercher le patient…</span>
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Lieu de consultation *</Label>
                <LieuSelect value={lieuId} onChange={setLieuId} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date-c">Date</Label>
                <Input id="date-c" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="text-base sm:text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motif">Motif</Label>
              <Input id="motif" value={v.motif} onChange={(e) => bind("motif").onChange(e.target.value)} placeholder="Ex. baisse de vision de loin, contrôle glaucome…" className="text-base sm:text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Étape 1 : Acuité */}
        <Card className={mobileStep(1)}>
          <CardHeader className="pb-3"><CardTitle className="text-base">Acuité visuelle</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            <EnteteOeil />
            <LigneOeil label="VL sans correction" od={bind("vl_od_sans_correction")} og={bind("vl_og_sans_correction")} placeholder={["8/10", "7/10"]} />
            <LigneOeil label="VL avec correction" od={bind("vl_od_avec_correction")} og={bind("vl_og_avec_correction")} placeholder={["10/10", "10/10"]} />
            <LigneOeil label="Vision de près" od={bind("vp_od")} og={bind("vp_og")} placeholder={["P2", "P2"]} />
          </CardContent>
        </Card>

        {/* Étape 2 : Réfraction */}
        <Card className={mobileStep(2)}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Réfraction</CardTitle>
            {derniere && (derniere.ref_od_sphere || derniere.ref_og_sphere) && (
              <Button type="button" variant="ghost" size="sm" onClick={reprendreRefraction} className="text-xs">
                <Copy className="mr-1.5 h-3.5 w-3.5" />Reprendre celle du {fmtDate(derniere.date_consultation)}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2.5">
            <EnteteOeil />
            <LigneOeil label="Sphère" od={bind("ref_od_sphere")} og={bind("ref_og_sphere")} placeholder={["-1.25", "-1.00"]} />
            <LigneOeil label="Cylindre" od={bind("ref_od_cylindre")} og={bind("ref_og_cylindre")} placeholder={["-0.50", "-0.25"]} />
            <LigneOeil label="Axe" unite="°" od={bind("ref_od_axe")} og={bind("ref_og_axe")} placeholder={["90", "85"]} />
          </CardContent>
        </Card>

        {/* Étape 3 : Examen */}
        <Card className={mobileStep(3)}>
          <CardHeader className="pb-3"><CardTitle className="text-base">Examen</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              <EnteteOeil />
              <LigneOeil label="Tonus" unite="mmHg" od={bind("tonus_od")} og={bind("tonus_og")} placeholder={["15", "16"]} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lampe">Lampe à fente (segment antérieur)</Label>
              <Textarea id="lampe" rows={3} {...bindArea("lampe_fente")} placeholder="Cornée claire, chambre antérieure calme…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fo">Fond d&apos;œil</Label>
              <Textarea id="fo" rows={3} {...bindArea("fond_oeil")} placeholder="Papille bien limitée, C/D 0,3, macula normale…" />
            </div>
          </CardContent>
        </Card>

        {/* Étape 4 : Conclusion */}
        <Card className={mobileStep(4)}>
          <CardHeader className="pb-3"><CardTitle className="text-base">Conclusion</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="diag">Diagnostic</Label>
              <Textarea id="diag" rows={2} {...bindArea("diagnostic")} placeholder="Myopie bilatérale, astigmatisme OD…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="obs">Observations</Label>
              <Textarea id="obs" rows={3} {...bindArea("observations_cliniques")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat">Conduite à tenir / suivi</Label>
              <Textarea id="cat" rows={2} {...bindArea("conduite_a_tenir")} placeholder="Contrôle dans 6 mois…" />
            </div>
          </CardContent>
        </Card>

        {/* Ordonnance (étape 4, création uniquement) */}
        {!edition && (
          <Card className={cn(avecOrdonnance ? "border-primary/40" : "", mobileStep(4))}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Ordonnance</CardTitle>
                <CardDescription>Lunettes, lentilles et/ou traitement</CardDescription>
              </div>
              <Switch checked={avecOrdonnance} onCheckedChange={setAvecOrdonnance} aria-label="Ajouter une ordonnance" />
            </CardHeader>
            {avecOrdonnance && (
              <CardContent><PrescriptionFields value={ordonnance} onChange={setOrdonnance} /></CardContent>
            )}
          </Card>
        )}

        {error && <Erreur message={error} />}

        {/* Navigation stepper (mobile) */}
        <StepperNav step={step} total={ETAPES.length} onPrev={() => aller(-1)} onNext={() => aller(1)} saving={saving} />

        {/* Boutons desktop — toujours visibles sur lg+, cachés sur mobile */}
        <div className="hidden lg:flex flex-row justify-end gap-3 pb-4">
          <Button variant="outline" type="button" onClick={onCancel} disabled={saving}>Annuler</Button>
          <Button type="submit" disabled={saving} size="lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {submitLabel}
          </Button>
        </div>
      </div>

      {/* Rappel du dossier */}
      <aside className="space-y-4 xl:sticky xl:top-20 order-first xl:order-none">
        {patient?.allergies && (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
            <p className="font-semibold text-destructive flex items-center gap-1.5 mb-1"><AlertCircle className="h-4 w-4" />Allergies</p>
            <p>{patient.allergies}</p>
          </div>
        )}
        {(patient?.antecedents_ophtalmo || patient?.antecedents_medicaux || patient?.traitements) && (
          <Card>
            <CardContent className="pt-4 space-y-2 text-sm">
              {patient.antecedents_ophtalmo && <p><span className="font-medium">ATCD ophtalmo : </span><span className="text-muted-foreground">{patient.antecedents_ophtalmo}</span></p>}
              {patient.antecedents_medicaux && <p><span className="font-medium">ATCD médicaux : </span><span className="text-muted-foreground">{patient.antecedents_medicaux}</span></p>}
              {patient.traitements && <p><span className="font-medium">Traitements : </span><span className="text-muted-foreground">{patient.traitements}</span></p>}
            </CardContent>
          </Card>
        )}
        {historique.length > 0 && (
          <Card className="hidden xl:block">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Consultations précédentes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {historique.slice(0, 4).map((c) => (
                <Link key={c.id} href={`/dashboard/consultations/detail?id=${c.id}`} target="_blank" className="block text-xs border-l-2 pl-3 hover:bg-secondary/50 rounded-r" style={{ borderColor: c.lieu?.couleur }}>
                  <p className="font-medium">{fmtDate(c.date_consultation)} <LieuBadge lieu={c.lieu} short className="ml-1 py-0" /></p>
                  {(c.ref_od_sphere || c.ref_og_sphere) && (
                    <p className="text-muted-foreground mt-0.5">OD {c.ref_od_sphere ?? "—"} ({c.ref_od_cylindre ?? "—"} à {c.ref_od_axe ?? "—"}°) · OG {c.ref_og_sphere ?? "—"} ({c.ref_og_cylindre ?? "—"} à {c.ref_og_axe ?? "—"}°)</p>
                  )}
                  {(c.tonus_od || c.tonus_og) && <p className="text-muted-foreground">Tonus {c.tonus_od ?? "—"} / {c.tonus_og ?? "—"}</p>}
                  {c.diagnostic && <p className="text-muted-foreground truncate">{c.diagnostic}</p>}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </aside>

      <PatientPicker open={pickerOpen} onOpenChange={setPickerOpen} onPick={choisirPatient} />
    </form>
  )
}
