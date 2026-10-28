"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LieuSelect } from "@/components/lieu-select"
import { PatientPicker } from "@/components/patient-picker"
import { Erreur } from "@/components/page-states"
import { Loader2, UserSearch } from "lucide-react"
import { createRendezVous, updateRendezVous } from "@/lib/services"
import { useLieux } from "@/lib/lieu-context"
import { ApiError } from "@/lib/api"
import { nomComplet, toDateTimeLocal } from "@/lib/format"
import type { PatientMini, RendezVous } from "@/lib/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (rdv: RendezVous) => void
  /** Rendez-vous à modifier */
  rdv?: RendezVous | null
  /** Valeurs initiales pour un nouveau rendez-vous */
  patient?: PatientMini | null
  date?: Date
  lieuId?: number | null
}

const DUREES = [10, 15, 20, 30, 45, 60]

export function RdvDialog({ open, onOpenChange, onSaved, rdv, patient: patientInit, date, lieuId }: Props) {
  const { lieuActifId, lieux } = useLieux()
  const [patient, setPatient] = useState<PatientMini | null>(null)
  const [lieu, setLieu] = useState<number | null>(null)
  const [quand, setQuand] = useState("")
  const [duree, setDuree] = useState(20)
  const [motif, setMotif] = useState("")
  const [notes, setNotes] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setError("")
    if (rdv) {
      setPatient(rdv.patient ?? null)
      setLieu(rdv.lieu_id)
      setQuand(rdv.date_heure_rdv.slice(0, 16))
      setDuree(rdv.duree_minutes)
      setMotif(rdv.motif ?? "")
      setNotes(rdv.notes ?? "")
    } else {
      setPatient(patientInit ?? null)
      const fallbackLieu = lieuId ?? lieuActifId ?? patientInit?.lieu_id ?? (lieux.length === 1 ? lieux[0].id : null)
      setLieu(fallbackLieu)
      const d = date ? new Date(date) : new Date()
      if (!date) { d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1) }
      setQuand(toDateTimeLocal(d))
      setDuree(20)
      setMotif("")
      setNotes("")
    }
  }, [open, rdv, patientInit, date, lieuId, lieuActifId, lieux])

  const enregistrer = async () => {
    if (!patient) { setError("Choisissez un patient."); return }
    if (!lieu) { setError("Choisissez le lieu du rendez-vous."); return }
    if (!quand) { setError("Indiquez la date et l'heure."); return }
    setSaving(true); setError("")
    try {
      const payload = {
        patient_id: patient.id, lieu_id: lieu, date_heure_rdv: `${quand}:00`,
        duree_minutes: duree, motif: motif.trim() || null, notes: notes.trim() || null,
      }
      const res = rdv ? await updateRendezVous(rdv.id, payload) : await createRendezVous(payload)
      toast.success(rdv ? "Rendez-vous modifié" : "Rendez-vous ajouté")
      onSaved(res.rendez_vous)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  return (
      <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{rdv ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</DialogTitle>
            <DialogDescription>Le rendez-vous apparaîtra dans l&apos;agenda avec la couleur du lieu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <Button type="button" variant="outline" className="w-full justify-start font-normal" onClick={() => setPickerOpen(true)} disabled={!!rdv}>
                <UserSearch className="mr-2 h-4 w-4 text-muted-foreground" />
                {patient ? <span className="truncate">{nomComplet(patient)} <span className="text-muted-foreground">· {patient.code_patient}</span></span> : <span className="text-muted-foreground">Rechercher un patient…</span>}
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label>Lieu *</Label>
              <LieuSelect value={lieu} onChange={setLieu} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="rdv-quand">Date et heure *</Label>
                <Input id="rdv-quand" type="datetime-local" value={quand} onChange={(e) => setQuand(e.target.value)} className="text-base sm:text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Durée</Label>
                <Select value={String(duree)} onValueChange={(v) => setDuree(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DUREES.map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rdv-motif">Motif</Label>
              <Input id="rdv-motif" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. contrôle, fond d'œil…" className="text-base sm:text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rdv-notes">Notes</Label>
              <Textarea id="rdv-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <Erreur message={error} />}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annuler</Button>
            <Button onClick={enregistrer} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
            </Button>
          </DialogFooter>
          {/* Rendu dans le contenu pour que Radix gère correctement la fenêtre imbriquée */}
          <PatientPicker open={pickerOpen} onOpenChange={setPickerOpen} onPick={setPatient} />
        </DialogContent>
      </Dialog>
  )
}
