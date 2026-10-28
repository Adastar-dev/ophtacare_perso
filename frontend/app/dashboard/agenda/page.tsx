"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LieuSelect } from "@/components/lieu-select"
import { LieuDot } from "@/components/lieu-badge"
import { Chargement, Erreur, PageHeader, Vide } from "@/components/page-states"
import { RdvDialog } from "@/components/rdv-dialog"
import {
  Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, MoreVertical, Pencil, Plus, Stethoscope, Trash2, UserX, XCircle,
} from "lucide-react"
import { deleteRendezVous, getRendezVous, updateRendezVous } from "@/lib/services"
import { useLieux } from "@/lib/lieu-context"
import { ApiError } from "@/lib/api"
import { dateKey, fmtHeure, nomComplet, statutRdvClass, statutRdvLabels } from "@/lib/format"
import type { RendezVous, StatutRdv } from "@/lib/types"
import { cn } from "@/lib/utils"

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

function debutMois(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function memeJour(a: Date, b: Date) { return dateKey(a) === dateKey(b) }

export default function AgendaPage() {
  const { lieuActifId } = useLieux()
  const [lieuId, setLieuId] = useState<number | null>(lieuActifId)
  const [mois, setMois] = useState(() => debutMois(new Date()))
  const [jour, setJour] = useState(() => new Date())
  const [rdvs, setRdvs] = useState<RendezVous[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [dialog, setDialog] = useState<{ open: boolean; rdv?: RendezVous | null; date?: Date }>({ open: false })
  const [aSupprimer, setASupprimer] = useState<RendezVous | null>(null)

  useEffect(() => { setLieuId(lieuActifId) }, [lieuActifId])

  // Grille du mois : du lundi précédant le 1er au dimanche suivant le dernier jour
  const cases = useMemo(() => {
    const premier = debutMois(mois)
    const decalage = (premier.getDay() + 6) % 7
    const debut = new Date(premier); debut.setDate(premier.getDate() - decalage)
    const dernier = new Date(mois.getFullYear(), mois.getMonth() + 1, 0)
    const fin = new Date(dernier); fin.setDate(dernier.getDate() + (6 - ((dernier.getDay() + 6) % 7)))
    const out: Date[] = []
    for (const d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) out.push(new Date(d))
    return out
  }, [mois])

  const load = useCallback(() => {
    setLoading(true)
    return getRendezVous({ date_from: dateKey(cases[0]), date_to: dateKey(cases[cases.length - 1]), lieu_id: lieuId })
      .then((r) => { setRdvs(r); setError("") })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger l'agenda."))
      .finally(() => setLoading(false))
  }, [cases, lieuId])

  useEffect(() => { load() }, [load])

  const parJour = useMemo(() => {
    const m: Record<string, RendezVous[]> = {}
    rdvs.forEach((r) => { (m[r.date_heure_rdv.slice(0, 10)] ||= []).push(r) })
    return m
  }, [rdvs])

  const duJour = parJour[dateKey(jour)] ?? []
  const aujourdhui = new Date()

  const changerJour = (delta: number) => {
    const d = new Date(jour); d.setDate(d.getDate() + delta)
    setJour(d)
    if (d.getMonth() !== mois.getMonth() || d.getFullYear() !== mois.getFullYear()) setMois(debutMois(d))
  }

  const changerStatut = async (r: RendezVous, statut: StatutRdv) => {
    try {
      await updateRendezVous(r.id, { statut })
      setRdvs((list) => list.map((x) => (x.id === r.id ? { ...x, statut } : x)))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erreur")
    }
  }

  const supprimer = async () => {
    if (!aSupprimer) return
    try {
      await deleteRendezVous(aSupprimer.id)
      setRdvs((list) => list.filter((x) => x.id !== aSupprimer.id))
      toast.success("Rendez-vous supprimé")
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erreur")
    } finally {
      setASupprimer(null)
    }
  }

  const nouveauPourLeJour = () => {
    const d = new Date(jour)
    const now = new Date()
    if (memeJour(d, now)) { d.setHours(now.getHours() + 1, 0, 0, 0) } else d.setHours(9, 0, 0, 0)
    setDialog({ open: true, date: d })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agenda"
        actions={
          <>
            <LieuSelect value={lieuId} onChange={setLieuId} allowAll className="w-52" />
            <Button onClick={nouveauPourLeJour}><Plus className="mr-2 h-4 w-4" />Rendez-vous</Button>
          </>
        }
      />

      {error && <Erreur message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-6 items-start">
        {/* Mois (sous la liste du jour sur iPhone) */}
        <Card className="order-2 lg:order-none">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base capitalize">{mois.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => { setMois(debutMois(new Date())); setJour(new Date()) }}>Aujourd&apos;hui</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))} aria-label="Mois précédent"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))} aria-label="Mois suivant"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="grid grid-cols-7 mb-1">
              {JOURS.map((j) => <div key={j} className="text-center text-xs font-medium text-muted-foreground py-1.5">{j}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cases.map((d) => {
                const k = dateKey(d)
                const liste = (parJour[k] ?? []).filter((r) => r.statut !== "annule")
                const horsMois = d.getMonth() !== mois.getMonth()
                const selection = memeJour(d, jour)
                const couleurs = [...new Set(liste.map((r) => r.lieu?.couleur))].slice(0, 3)
                return (
                  <button
                    key={k}
                    onClick={() => setJour(new Date(d))}
                    className={cn(
                      "min-h-[3.25rem] sm:min-h-[4.5rem] rounded-lg p-1 sm:p-1.5 flex flex-col items-center sm:items-start text-sm transition-colors border",
                      selection ? "border-primary bg-primary/5" : "border-transparent hover:bg-secondary",
                      horsMois && "opacity-40",
                    )}
                  >
                    <span className={cn(
                      "h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-full text-xs sm:text-sm",
                      memeJour(d, aujourdhui) && "bg-primary text-primary-foreground font-bold",
                    )}>
                      {d.getDate()}
                    </span>
                    {liste.length > 0 && (
                      <span className="mt-auto flex items-center gap-0.5">
                        {couleurs.map((c) => <LieuDot key={c} couleur={c} className="h-1.5 w-1.5 sm:h-2 sm:w-2" />)}
                        <span className="hidden sm:inline text-[11px] text-muted-foreground ml-1">{liste.length}</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Jour */}
        <Card className="order-1 lg:order-none">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changerJour(-1)} aria-label="Jour précédent"><ChevronLeft className="h-4 w-4" /></Button>
            <div className="text-center min-w-0">
              <CardTitle className="text-base capitalize">{jour.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</CardTitle>
              <p className="text-xs text-muted-foreground">{duJour.filter((r) => r.statut !== "annule").length} rendez-vous</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changerJour(1)} aria-label="Jour suivant"><ChevronRight className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && rdvs.length === 0 ? <Chargement /> : duJour.length === 0 ? (
              <Vide icon={<Calendar className="h-8 w-8" />}>
                Aucun rendez-vous ce jour.
                <div className="mt-3"><Button size="sm" variant="outline" onClick={nouveauPourLeJour}><Plus className="mr-1.5 h-3.5 w-3.5" />Ajouter</Button></div>
              </Vide>
            ) : duJour.map((r) => (
              <div
                key={r.id}
                className={cn("rounded-lg border p-3 space-y-2", r.statut === "annule" && "opacity-60")}
                style={{ borderLeft: `4px solid ${r.lieu?.couleur ?? "#94a3b8"}` }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-semibold tabular-nums">{fmtHeure(r.date_heure_rdv)}</span>
                      <span className={cn("text-[11px] px-1.5 py-0.5 rounded-full", statutRdvClass(r.statut))}>{statutRdvLabels[r.statut]}</span>
                    </div>
                    <Link href={`/dashboard/patients/fiche?id=${r.patient_id}`} className="block font-medium mt-1 hover:underline truncate">{nomComplet(r.patient)}</Link>
                    <p className="text-xs text-muted-foreground truncate">{r.lieu?.nom}{r.motif ? ` · ${r.motif}` : ""}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Actions"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => changerStatut(r, "honore")}><CheckCircle2 className="mr-2 h-4 w-4" />Marquer vu</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => changerStatut(r, "absent")}><UserX className="mr-2 h-4 w-4" />Absent</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => changerStatut(r, "annule")}><XCircle className="mr-2 h-4 w-4" />Annulé</DropdownMenuItem>
                      {r.statut !== "prevu" && <DropdownMenuItem onClick={() => changerStatut(r, "prevu")}><Clock className="mr-2 h-4 w-4" />Remettre à prévu</DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDialog({ open: true, rdv: r })}><Pencil className="mr-2 h-4 w-4" />Modifier / déplacer</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setASupprimer(r)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {r.consultation ? (
                  <Button variant="outline" className="w-full h-11" asChild>
                    <Link href={`/dashboard/consultations/detail?id=${r.consultation.id}`}><Stethoscope className="mr-1.5 h-4 w-4" />Voir la consultation</Link>
                  </Button>
                ) : r.statut === "prevu" ? (
                  <Button className="w-full h-11" asChild>
                    <Link href={`/dashboard/consultations/nouvelle?rdv_id=${r.id}`}><Stethoscope className="mr-1.5 h-4 w-4" />Commencer la consultation</Link>
                  </Button>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <RdvDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        rdv={dialog.rdv}
        date={dialog.date}
        lieuId={lieuId}
        onSaved={(r) => {
          const d = new Date(r.date_heure_rdv)
          setJour(d)
          setMois(debutMois(d))
          load()
        }}
      />

      {aSupprimer && (
        <DialogConfirm
          titre="Supprimer ce rendez-vous ?"
          texte={`${nomComplet(aSupprimer.patient)} — ${fmtHeure(aSupprimer.date_heure_rdv)}. Pour garder une trace, utilisez plutôt « Annulé ».`}
          onConfirm={supprimer}
          onCancel={() => setASupprimer(null)}
        />
      )}
    </div>
  )
}

function DialogConfirm({ titre, texte, onConfirm, onCancel }: { titre: string; texte: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <AlertDialog open onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titre}</AlertDialogTitle>
          <AlertDialogDescription>{texte}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
