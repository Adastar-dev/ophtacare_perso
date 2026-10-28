"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LieuSelect } from "@/components/lieu-select"
import { Erreur } from "@/components/page-states"
import { Loader2, Save } from "lucide-react"
import { ApiError } from "@/lib/api"
import type { Patient } from "@/lib/types"

type FormState = Record<keyof Omit<Patient, "id" | "code_patient" | "lieu" | "consultations" | "rendez_vous" | "derniere_consultation" | "created_at" | "lieu_id" | "genre">, string> & {
  genre: "" | "M" | "F"
  lieu_id: number | null
}

function initial(p?: Partial<Patient> | null, lieuParDefaut?: number | null): FormState {
  return {
    nom: p?.nom ?? "",
    prenom: p?.prenom ?? "",
    date_naissance: p?.date_naissance ?? "",
    genre: (p?.genre ?? "") as FormState["genre"],
    telephone: p?.telephone ?? "",
    email: p?.email ?? "",
    adresse: p?.adresse ?? "",
    profession: p?.profession ?? "",
    antecedents_medicaux: p?.antecedents_medicaux ?? "",
    antecedents_ophtalmo: p?.antecedents_ophtalmo ?? "",
    allergies: p?.allergies ?? "",
    traitements: p?.traitements ?? "",
    notes: p?.notes ?? "",
    assureur: p?.assureur ?? "",
    numero_assurance: p?.numero_assurance ?? "",
    lieu_id: p ? p.lieu_id ?? null : lieuParDefaut ?? null,
  }
}

interface Props {
  patient?: Partial<Patient> | null
  lieuParDefaut?: number | null
  submitLabel: string
  onSubmit: (data: Partial<Patient>) => Promise<void>
  onCancel: () => void
}

export function PatientForm({ patient, lieuParDefaut, submitLabel, onSubmit, onCancel }: Props) {
  const [f, setF] = useState<FormState>(() => initial(patient, lieuParDefaut))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((prev) => ({ ...prev, [k]: v }))
  const field = (k: keyof FormState) => ({
    value: (f[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as never),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError("")
    try {
      // Champs vides -> null
      const data = Object.fromEntries(
        Object.entries(f).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]),
      ) as Partial<Patient>
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement.")
      setSaving(false)
    }
  }

  const inputCls = "text-base sm:text-sm"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" {...field("prenom")} className={inputCls} required autoFocus={!patient} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" {...field("nom")} className={inputCls} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dn">Date de naissance</Label>
                <Input id="dn" type="date" {...field("date_naissance")} className={inputCls} max={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="space-y-1.5">
                <Label>Sexe</Label>
                <Select value={f.genre || "nc"} onValueChange={(v) => set("genre", v === "nc" ? "" : (v as "M" | "F"))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nc">Non précisé</SelectItem>
                    <SelectItem value="F">Femme</SelectItem>
                    <SelectItem value="M">Homme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tel">Téléphone</Label>
                <Input id="tel" type="tel" inputMode="tel" placeholder="77 123 45 67" {...field("telephone")} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoCapitalize="none" {...field("email")} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="adresse">Adresse</Label>
                <Input id="adresse" {...field("adresse")} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profession">Profession</Label>
                <Input id="profession" {...field("profession")} className={inputCls} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suivi</CardTitle>
            <CardDescription>Le lieu habituel sert de filtre par défaut. Chaque consultation garde son propre lieu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Lieu habituel</Label>
              <LieuSelect value={f.lieu_id} onChange={(id) => set("lieu_id", id)} allowNone />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="assureur">Assurance / IPM</Label>
                <Input id="assureur" placeholder="Ex. IPM, NSIA…" {...field("assureur")} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="num-ass">N° d&apos;assuré</Label>
                <Input id="num-ass" {...field("numero_assurance")} className={inputCls} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} {...field("notes")} placeholder="Informations utiles (accompagnant, préférences…)" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Antécédents</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="atcd-ophtalmo">Antécédents ophtalmologiques</Label>
              <Textarea id="atcd-ophtalmo" rows={3} {...field("antecedents_ophtalmo")} placeholder="Chirurgie, glaucome familial, port de lunettes…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="atcd-med">Antécédents médicaux</Label>
              <Textarea id="atcd-med" rows={3} {...field("antecedents_medicaux")} placeholder="HTA, diabète…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="allergies" className="text-destructive">Allergies</Label>
              <Textarea id="allergies" rows={2} {...field("allergies")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="traitements">Traitements en cours</Label>
              <Textarea id="traitements" rows={2} {...field("traitements")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && <Erreur message={error} />}

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <Button variant="outline" type="button" onClick={onCancel} disabled={saving}>Annuler</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
