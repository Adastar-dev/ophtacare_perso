"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Erreur } from "@/components/page-states"
import { Loader2 } from "lucide-react"
import { createPrescription, updatePrescription } from "@/lib/services"
import { ApiError } from "@/lib/api"
import { typeTeinteLabels, typeVerreLabels } from "@/lib/format"
import type { Consultation, Prescription, PrescriptionContenu } from "@/lib/types"

export const PRESCRIPTION_VIDE: PrescriptionContenu = {
  type_verre: null, type_teinte: null, oeil_droit_add: null, oeil_gauche_add: null,
  ecart_pupillaire: null, traitement: null, remarques: null,
}

/** Champs de l'ordonnance, réutilisés dans le formulaire de consultation. */
export function PrescriptionFields({ value, onChange }: { value: PrescriptionContenu; onChange: (v: PrescriptionContenu) => void }) {
  const set = <K extends keyof PrescriptionContenu>(k: K, v: PrescriptionContenu[K]) => onChange({ ...value, [k]: v })
  const inputCls = "text-base sm:text-sm"

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm font-semibold">Correction optique</p>
        <p className="text-xs text-muted-foreground -mt-2">Sphère, cylindre et axe sont repris de la réfraction de la consultation.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type de verres</Label>
            <Select value={value.type_verre ?? "aucun"} onValueChange={(v) => set("type_verre", v === "aucun" ? null : (v as PrescriptionContenu["type_verre"]))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aucun">Pas de lunettes</SelectItem>
                {Object.entries(typeVerreLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Teinte</Label>
            <Select value={value.type_teinte ?? "aucune"} onValueChange={(v) => set("type_teinte", v === "aucune" ? null : (v as PrescriptionContenu["type_teinte"]))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aucune">Non précisée</SelectItem>
                {Object.entries(typeTeinteLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="add-od">Addition OD</Label>
            <Input id="add-od" placeholder="+2.00" value={value.oeil_droit_add ?? ""} onChange={(e) => set("oeil_droit_add", e.target.value || null)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-og">Addition OG</Label>
            <Input id="add-og" placeholder="+2.00" value={value.oeil_gauche_add ?? ""} onChange={(e) => set("oeil_gauche_add", e.target.value || null)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ep">Écart pup. (mm)</Label>
            <Input id="ep" inputMode="decimal" placeholder="62" value={value.ecart_pupillaire ?? ""} onChange={(e) => set("ecart_pupillaire", e.target.value || null)} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="traitement" className="text-sm font-semibold">Traitement</Label>
        <Textarea
          id="traitement"
          rows={4}
          value={value.traitement ?? ""}
          onChange={(e) => set("traitement", e.target.value || null)}
          placeholder={"Une ligne par médicament, ex. :\nTimolol 0,5 % : 1 goutte matin et soir dans les 2 yeux\nLarmes artificielles : 1 goutte 4 fois par jour pendant 1 mois"}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remarques">Remarques</Label>
        <Textarea id="remarques" rows={2} value={value.remarques ?? ""} onChange={(e) => set("remarques", e.target.value || null)} />
      </div>
    </div>
  )
}

export function prescriptionEstVide(p: PrescriptionContenu) {
  return !Object.values(p).some((v) => v !== null && String(v).trim() !== "")
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  consultation: Pick<Consultation, "id">
  prescription?: Prescription | null
  onSaved: (p: Prescription) => void
}

export function PrescriptionDialog({ open, onOpenChange, consultation, prescription, onSaved }: Props) {
  const [value, setValue] = useState<PrescriptionContenu>(PRESCRIPTION_VIDE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setError("")
    setValue(prescription ? { ...PRESCRIPTION_VIDE, ...Object.fromEntries(Object.keys(PRESCRIPTION_VIDE).map((k) => [k, (prescription as any)[k] ?? null])) } : PRESCRIPTION_VIDE)
  }, [open, prescription])

  const enregistrer = async () => {
    if (prescriptionEstVide(value)) { setError("L'ordonnance est vide."); return }
    setSaving(true); setError("")
    try {
      const res = prescription
        ? await updatePrescription(prescription.id, value)
        : await createPrescription({ consultation_id: consultation.id, ...value })
      toast.success(prescription ? "Ordonnance modifiée" : "Ordonnance créée")
      onSaved(res.prescription)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o) }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{prescription ? "Modifier l'ordonnance" : "Rédiger l'ordonnance"}</DialogTitle>
          <DialogDescription>Correction optique, traitement, ou les deux.</DialogDescription>
        </DialogHeader>
        <PrescriptionFields value={value} onChange={setValue} />
        {error && <Erreur message={error} />}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annuler</Button>
          <Button onClick={enregistrer} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
