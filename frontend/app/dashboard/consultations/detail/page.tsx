"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LieuBadge } from "@/components/lieu-badge"
import { Chargement, Erreur } from "@/components/page-states"
import { BlocTexte, TableauMesures } from "@/components/consultation-resume"
import { PrescriptionDialog } from "@/components/prescription/prescription-dialog"
import { PrescriptionPreview, printPrescription } from "@/components/prescription/prescription-canvas"
import { ArrowLeft, FilePlus, FileText, Pencil, Printer, Trash2 } from "lucide-react"
import { deleteConsultation, deletePrescription, getConsultation } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { ApiError } from "@/lib/api"
import { ageLabel, fmtDateLongue, fmtHeure, initiales, nomComplet } from "@/lib/format"
import type { Consultation, Prescription } from "@/lib/types"

function DetailContent() {
  const router = useRouter()
  const id = useSearchParams().get("id")
  const { user } = useAuth()
  const [c, setC] = useState<Consultation | null>(null)
  const [error, setError] = useState("")
  const [ordoOpen, setOrdoOpen] = useState(false)
  const [confirm, setConfirm] = useState<"consultation" | "ordonnance" | null>(null)

  const load = useCallback(() => {
    if (!id) return
    getConsultation(id).then(setC).catch((e) => setError(e instanceof ApiError ? e.message : "Consultation introuvable."))
  }, [id])

  useEffect(() => { load() }, [load])

  if (error) return <div><Erreur message={error} /></div>
  if (!c) return <div><Chargement /></div>

  // L'ordonnance a besoin du patient et du lieu de la consultation pour l'en-tête
  const ordonnance: Prescription | null = c.prescription ? { ...c.prescription, consultation: c } : null

  const supprimer = async () => {
    try {
      if (confirm === "consultation") {
        await deleteConsultation(c.id)
        toast.success("Consultation supprimée")
        router.replace(`/dashboard/patients/fiche?id=${c.patient_id}`)
      } else if (confirm === "ordonnance" && c.prescription) {
        await deletePrescription(c.prescription.id)
        toast.success("Ordonnance supprimée")
        load()
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erreur")
    } finally {
      setConfirm(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Retour"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold capitalize">{fmtDateLongue(c.date_consultation)}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{fmtHeure(c.date_consultation)}</span>
            <LieuBadge lieu={c.lieu} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/consultations/modifier?id=${c.id}`}><Pencil className="mr-2 h-4 w-4" />Modifier</Link>
          </Button>
          <Button variant="outline" className="text-destructive" onClick={() => setConfirm("consultation")} aria-label="Supprimer la consultation">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Mesures</CardTitle></CardHeader>
            <CardContent><TableauMesures c={c} /></CardContent>
          </Card>

          {(c.lampe_fente || c.fond_oeil) && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Examen</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <BlocTexte titre="Lampe à fente" texte={c.lampe_fente} />
                <BlocTexte titre="Fond d'œil" texte={c.fond_oeil} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Conclusion</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <BlocTexte titre="Motif" texte={c.motif} />
              <BlocTexte titre="Diagnostic" texte={c.diagnostic ?? "Non renseigné"} />
              <BlocTexte titre="Observations" texte={c.observations_cliniques} />
              <BlocTexte titre="Conduite à tenir" texte={c.conduite_a_tenir} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-5">
              <Link href={`/dashboard/patients/fiche?id=${c.patient_id}`} className="flex items-center gap-3 group">
                <Avatar className="h-11 w-11"><AvatarFallback className="bg-primary/10 text-primary">{initiales(c.patient)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <p className="font-semibold group-hover:underline truncate">{nomComplet(c.patient)}</p>
                  <p className="text-xs text-muted-foreground">{c.patient?.code_patient} · {ageLabel(c.patient?.date_naissance)}</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className={ordonnance ? "border-primary/30" : ""}>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Ordonnance</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ordonnance ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => printPrescription(ordonnance, user)} className="flex-1"><Printer className="mr-2 h-4 w-4" />Imprimer / PDF</Button>
                    <Button variant="outline" onClick={() => setOrdoOpen(true)} aria-label="Modifier l'ordonnance"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" className="text-destructive" onClick={() => setConfirm("ordonnance")} aria-label="Supprimer l'ordonnance"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="max-h-[480px] overflow-auto rounded-lg">
                    <div className="origin-top-left scale-[0.62] w-[161%]">
                      <PrescriptionPreview prescription={ordonnance} praticien={user} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Aucune ordonnance pour cette consultation.</p>
                  <Button className="w-full" onClick={() => setOrdoOpen(true)}><FilePlus className="mr-2 h-4 w-4" />Rédiger l&apos;ordonnance</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PrescriptionDialog open={ordoOpen} onOpenChange={setOrdoOpen} consultation={c} prescription={c.prescription} onSaved={() => load()} />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "consultation" ? "Supprimer cette consultation ?" : "Supprimer l'ordonnance ?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "consultation"
                ? "La consultation et son ordonnance seront définitivement supprimées."
                : "L'ordonnance sera définitivement supprimée. La consultation reste."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={supprimer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function ConsultationDetailPage() {
  return <Suspense fallback={<Chargement />}><DetailContent /></Suspense>
}
