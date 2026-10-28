"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Chargement, Erreur, PageHeader, Vide } from "@/components/page-states"
import { Building2, Check, Loader2, MapPin, Pencil, Phone, Plus, RotateCcw, Trash2, Users } from "lucide-react"
import { createLieu, deleteLieu, getLieux, updateLieu } from "@/lib/services"
import { useLieux } from "@/lib/lieu-context"
import { ApiError } from "@/lib/api"
import { COULEURS_LIEU, typeLieuLabels } from "@/lib/format"
import type { Lieu, TypeLieu } from "@/lib/types"
import { cn } from "@/lib/utils"

const VIDE: Partial<Lieu> = { nom: "", type: "clinique", adresse: "", telephone: "", couleur: COULEURS_LIEU[0], notes: "" }

export default function LieuxPage() {
  const { refreshLieux, lieuActifId, setLieuActifId } = useLieux()
  const [lieux, setLieux] = useState<Lieu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [edit, setEdit] = useState<Partial<Lieu> | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [aSupprimer, setASupprimer] = useState<Lieu | null>(null)

  const load = () =>
    getLieux(true)
      .then(setLieux)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger les lieux."))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const actifs = lieux.filter((l) => l.actif)
  const archives = lieux.filter((l) => !l.actif)

  const ouvrirNouveau = () => {
    setFormError("")
    setEdit({ ...VIDE, couleur: COULEURS_LIEU[actifs.length % COULEURS_LIEU.length] })
  }

  const enregistrer = async () => {
    if (!edit?.nom?.trim()) { setFormError("Le nom est obligatoire."); return }
    setSaving(true); setFormError("")
    try {
      const payload = {
        nom: edit.nom.trim(), type: edit.type, adresse: edit.adresse || null,
        telephone: edit.telephone || null, couleur: edit.couleur, notes: edit.notes || null,
      }
      if (edit.id) await updateLieu(edit.id, payload)
      else {
        const res = await createLieu(payload)
        if (actifs.length === 0) setLieuActifId(res.lieu.id)
      }
      toast.success(edit.id ? "Lieu mis à jour" : "Lieu ajouté")
      setEdit(null)
      await Promise.all([load(), refreshLieux()])
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const supprimer = async () => {
    if (!aSupprimer) return
    try {
      const res = await deleteLieu(aSupprimer.id)
      toast.success(res.archive ? "Lieu archivé (son historique est conservé)" : "Lieu supprimé")
      if (lieuActifId === aSupprimer.id) setLieuActifId(null)
      await Promise.all([load(), refreshLieux()])
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erreur")
    } finally {
      setASupprimer(null)
    }
  }

  const restaurer = async (lieu: Lieu) => {
    await updateLieu(lieu.id, { actif: true })
    toast.success("Lieu réactivé")
    await Promise.all([load(), refreshLieux()])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes lieux de consultation"
        description="Les cliniques, hôpitaux et cabinets où vous consultez. Chaque consultation et chaque rendez-vous est rattaché à un lieu."
        actions={<Button onClick={ouvrirNouveau}><Plus className="mr-2 h-4 w-4" />Ajouter un lieu</Button>}
      />

      {error && <Erreur message={error} />}

      {loading ? <Chargement /> : actifs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Vide icon={<Building2 className="h-10 w-10" />}>
              <p className="font-medium text-foreground">Commencez par ajouter vos lieux de consultation</p>
              <p className="mt-1">Par exemple : la clinique du lundi, l&apos;hôpital du mardi…</p>
              <Button className="mt-4" onClick={ouvrirNouveau}><Plus className="mr-2 h-4 w-4" />Ajouter mon premier lieu</Button>
            </Vide>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {actifs.map((l) => (
            <Card key={l.id} className="overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: l.couleur }} />
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{l.nom}</h3>
                    <Badge variant="secondary" className="mt-1 text-xs">{typeLieuLabels[l.type]}</Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setFormError(""); setEdit(l) }} aria-label="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setASupprimer(l)} aria-label="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {l.adresse && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{l.adresse}</p>}
                  {l.telephone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{l.telephone}</p>}
                  {l.notes && <p className="text-xs italic">{l.notes}</p>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center border-t pt-3">
                  <div><p className="text-lg font-bold">{l.patients_count ?? 0}</p><p className="text-[11px] text-muted-foreground">patients</p></div>
                  <div><p className="text-lg font-bold">{l.consultations_count ?? 0}</p><p className="text-[11px] text-muted-foreground">consultations</p></div>
                  <div><p className="text-lg font-bold">{l.rdv_a_venir_count ?? 0}</p><p className="text-[11px] text-muted-foreground">RDV à venir</p></div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={lieuActifId === l.id ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setLieuActifId(lieuActifId === l.id ? null : l.id)}
                  >
                    {lieuActifId === l.id ? <><Check className="mr-1.5 h-3.5 w-3.5" />Lieu actif</> : "J'y consulte"}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/patients?lieu=${l.id}`}><Users className="mr-1.5 h-3.5 w-3.5" />Patients</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {archives.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Lieux archivés</h2>
          {archives.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30 text-sm">
              <span className="truncate">{l.nom} <span className="text-muted-foreground">· {l.consultations_count} consultations conservées</span></span>
              <Button variant="ghost" size="sm" onClick={() => restaurer(l)}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Réactiver</Button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire */}
      <Dialog open={!!edit} onOpenChange={(o) => { if (!o && !saving) setEdit(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Modifier le lieu" : "Nouveau lieu"}</DialogTitle>
            <DialogDescription>Ces informations apparaissent en en-tête des ordonnances.</DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="lieu-nom">Nom *</Label>
                <Input id="lieu-nom" value={edit.nom ?? ""} onChange={(e) => setEdit({ ...edit, nom: e.target.value })} placeholder="Ex. Clinique de la Madeleine" className="text-base sm:text-sm" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={edit.type} onValueChange={(v) => setEdit({ ...edit, type: v as TypeLieu })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLieuLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lieu-adresse">Adresse</Label>
                <Input id="lieu-adresse" value={edit.adresse ?? ""} onChange={(e) => setEdit({ ...edit, adresse: e.target.value })} className="text-base sm:text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lieu-tel">Téléphone</Label>
                <Input id="lieu-tel" type="tel" value={edit.telephone ?? ""} onChange={(e) => setEdit({ ...edit, telephone: e.target.value })} className="text-base sm:text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Couleur dans l&apos;agenda</Label>
                <div className="flex flex-wrap gap-2">
                  {COULEURS_LIEU.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEdit({ ...edit, couleur: c })}
                      className={cn("h-8 w-8 rounded-full border-2 transition-transform", edit.couleur === c ? "border-foreground scale-110" : "border-transparent")}
                      style={{ backgroundColor: c }}
                      aria-label={`Couleur ${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lieu-notes">Notes</Label>
                <Textarea id="lieu-notes" rows={2} value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} placeholder="Ex. lundi et mercredi matin" />
              </div>
              {formError && <Erreur message={formError} />}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEdit(null)} disabled={saving}>Annuler</Button>
            <Button onClick={enregistrer} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer « {aSupprimer?.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              {aSupprimer && (aSupprimer.consultations_count || aSupprimer.rdv_a_venir_count)
                ? "Ce lieu a déjà des consultations ou des rendez-vous : il sera archivé (masqué) et tout son historique restera dans les fiches patients."
                : "Ce lieu n'a encore aucune consultation : il sera supprimé définitivement."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={supprimer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
