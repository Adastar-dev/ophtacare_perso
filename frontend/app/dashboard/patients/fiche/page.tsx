"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LieuBadge } from "@/components/lieu-badge"
import { Chargement, Erreur, Vide } from "@/components/page-states"
import { TableauMesures } from "@/components/consultation-resume"
import { RdvDialog } from "@/components/rdv-dialog"
import { printPrescription } from "@/components/prescription/prescription-canvas"
import {
  AlertCircle, ArrowLeft, Calendar, CalendarPlus, ChevronRight, FileText, Mail, MapPin, MoreHorizontal,
  Pencil, Phone, Printer, Shield, Stethoscope, Trash2,
} from "lucide-react"
import { deletePatient, getPatient } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { ApiError } from "@/lib/api"
import { ageLabel, fmtDate, fmtHeure, initiales, nomComplet, statutRdvClass, statutRdvLabels } from "@/lib/format"
import type { Consultation, Patient } from "@/lib/types"
import { cn } from "@/lib/utils"

function Info({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Icon className="h-3.5 w-3.5 shrink-0" />{children}</span>
}

function FicheContent() {
  const router = useRouter()
  const id = useSearchParams().get("id")
  const { user } = useAuth()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [error, setError] = useState("")
  const [rdvOpen, setRdvOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [filtreLieu, setFiltreLieu] = useState<number | null>(null)

  const load = useCallback(() => {
    if (!id) return
    getPatient(id).then(setPatient).catch((e) => setError(e instanceof ApiError ? e.message : "Patient introuvable."))
  }, [id])

  useEffect(() => { load() }, [load])

  const consultations = patient?.consultations ?? []
  const rdvs = patient?.rendez_vous ?? []

  // Lieux où le patient a été vu (pour filtrer l'historique)
  const lieuxVus = useMemo(() => {
    const m = new Map<number, NonNullable<Consultation["lieu"]>>()
    consultations.forEach((c) => c.lieu && m.set(c.lieu.id, c.lieu))
    return [...m.values()]
  }, [consultations])

  if (error) return <div><Erreur message={error} /></div>
  if (!patient) return <div><Chargement /></div>

  const historique = filtreLieu ? consultations.filter((c) => c.lieu_id === filtreLieu) : consultations
  const maintenant = Date.now()
  const rdvAVenir = rdvs.filter((r) => r.statut === "prevu" && new Date(r.date_heure_rdv).getTime() >= maintenant - 3600_000).reverse()
  const ordonnances = consultations.filter((c) => c.prescription).map((c) => ({ ...c.prescription!, consultation: { ...c, patient } }))

  const supprimer = async () => {
    try {
      await deletePatient(patient.id)
      toast.success("Patient supprimé")
      router.replace("/dashboard/patients")
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erreur")
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Retour"><ArrowLeft className="h-5 w-5" /></Button>
        <Avatar className="h-14 w-14 shrink-0 hidden sm:flex">
          <AvatarFallback className="bg-primary/10 text-primary text-lg">{initiales(patient)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{nomComplet(patient)}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <Badge variant="outline">{patient.code_patient}</Badge>
            <span className="text-sm text-muted-foreground">
              {ageLabel(patient.date_naissance)}
              {patient.date_naissance && ` (${fmtDate(patient.date_naissance, { day: "2-digit", month: "2-digit", year: "numeric" })})`}
              {patient.genre && ` · ${patient.genre === "F" ? "Femme" : "Homme"}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {patient.telephone && <Info icon={Phone}><a href={`tel:${patient.telephone.replace(/\s/g, "")}`} className="hover:underline">{patient.telephone}</a></Info>}
            {patient.email && <Info icon={Mail}>{patient.email}</Info>}
            {patient.adresse && <Info icon={MapPin}>{patient.adresse}</Info>}
            {patient.assureur && <Info icon={Shield}>{patient.assureur}{patient.numero_assurance ? ` · ${patient.numero_assurance}` : ""}</Info>}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Plus d'actions"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><Link href={`/dashboard/patients/modifier?id=${patient.id}`}><Pencil className="mr-2 h-4 w-4" />Modifier la fiche</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer le patient</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild><Link href={`/dashboard/consultations/nouvelle?patient_id=${patient.id}`}><Stethoscope className="mr-2 h-4 w-4" />Nouvelle consultation</Link></Button>
        <Button variant="outline" onClick={() => setRdvOpen(true)}><CalendarPlus className="mr-2 h-4 w-4" />Rendez-vous</Button>
      </div>

      {/* Alertes et antécédents */}
      {(patient.allergies || patient.antecedents_ophtalmo || patient.antecedents_medicaux || patient.traitements || patient.notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {patient.allergies && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm md:col-span-2">
              <span className="font-semibold text-destructive inline-flex items-center gap-1.5"><AlertCircle className="h-4 w-4" />Allergies : </span> {patient.allergies}
            </div>
          )}
          {patient.antecedents_ophtalmo && <div className="p-3 rounded-lg border bg-muted/30 text-sm"><p className="font-semibold mb-0.5">Antécédents ophtalmologiques</p><p className="text-muted-foreground whitespace-pre-wrap">{patient.antecedents_ophtalmo}</p></div>}
          {patient.antecedents_medicaux && <div className="p-3 rounded-lg border bg-muted/30 text-sm"><p className="font-semibold mb-0.5">Antécédents médicaux</p><p className="text-muted-foreground whitespace-pre-wrap">{patient.antecedents_medicaux}</p></div>}
          {patient.traitements && <div className="p-3 rounded-lg border bg-muted/30 text-sm"><p className="font-semibold mb-0.5">Traitements en cours</p><p className="text-muted-foreground whitespace-pre-wrap">{patient.traitements}</p></div>}
          {patient.notes && <div className="p-3 rounded-lg border bg-muted/30 text-sm"><p className="font-semibold mb-0.5">Notes</p><p className="text-muted-foreground whitespace-pre-wrap">{patient.notes}</p></div>}
        </div>
      )}

      {/* Lieux */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Lieu habituel :</span>
        <LieuBadge lieu={patient.lieu} />
        {lieuxVus.filter((l) => l.id !== patient.lieu_id).length > 0 && (
          <>
            <span className="text-muted-foreground ml-2">Vu aussi à :</span>
            {lieuxVus.filter((l) => l.id !== patient.lieu_id).map((l) => <LieuBadge key={l.id} lieu={l} />)}
          </>
        )}
      </div>

      {rdvAVenir.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rdvAVenir.slice(0, 3).map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderLeft: `3px solid ${r.lieu?.couleur}` }}>
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium capitalize">{fmtDate(r.date_heure_rdv, { weekday: "short", day: "numeric", month: "short" })} à {fmtHeure(r.date_heure_rdv)}</span>
              <span className="text-muted-foreground">· {r.lieu?.nom}</span>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="historique" className="space-y-4">
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="historique">Visites ({consultations.length})</TabsTrigger>
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
          <TabsTrigger value="ordonnances">Ordonnances</TabsTrigger>
          <TabsTrigger value="rdv">RDV</TabsTrigger>
        </TabsList>

        <TabsContent value="historique" className="space-y-3">
          {lieuxVus.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={filtreLieu === null ? "default" : "outline"} onClick={() => setFiltreLieu(null)}>Tous les lieux</Button>
              {lieuxVus.map((l) => (
                <Button key={l.id} size="sm" variant={filtreLieu === l.id ? "default" : "outline"} onClick={() => setFiltreLieu(l.id)}>{l.nom}</Button>
              ))}
            </div>
          )}
          {historique.length === 0 ? (
            <Card><CardContent className="pt-6"><Vide icon={<Stethoscope className="h-10 w-10" />}>
              Aucune consultation enregistrée.
              <div className="mt-3"><Button size="sm" asChild><Link href={`/dashboard/consultations/nouvelle?patient_id=${patient.id}`}>Première consultation</Link></Button></div>
            </Vide></CardContent></Card>
          ) : historique.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex">
                <div className="w-1 shrink-0" style={{ backgroundColor: c.lieu?.couleur }} />
                <div className="flex-1 min-w-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base capitalize">{fmtDate(c.date_consultation, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <LieuBadge lieu={c.lieu} />
                          {c.motif && <span className="text-xs text-muted-foreground">{c.motif}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/consultations/detail?id=${c.id}`}>Ouvrir<ChevronRight className="ml-1 h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TableauMesures c={c} compact />
                    <div className="space-y-2 text-sm">
                      {c.diagnostic && <p><span className="font-medium">Diagnostic : </span>{c.diagnostic}</p>}
                      {c.conduite_a_tenir && <p className="text-muted-foreground"><span className="font-medium text-foreground">Suivi : </span>{c.conduite_a_tenir}</p>}
                      {c.prescription && (
                        <Button size="sm" variant="outline" onClick={() => printPrescription({ ...c.prescription!, consultation: { ...c, patient } }, user)}>
                          <Printer className="mr-1.5 h-3.5 w-3.5" />Ordonnance
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="evolution">
          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              {consultations.length === 0 ? <Vide>Pas encore de mesures.</Vide> : (
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left font-medium py-2 pr-2">Date</th>
                      <th className="text-left font-medium py-2 pr-2">Lieu</th>
                      <th className="font-medium py-2 text-primary">AV OD</th>
                      <th className="font-medium py-2 text-accent">AV OG</th>
                      <th className="font-medium py-2 text-primary">Réfraction OD</th>
                      <th className="font-medium py-2 text-accent">Réfraction OG</th>
                      <th className="font-medium py-2">Tonus OD / OG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {consultations.map((c) => (
                      <tr key={c.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => router.push(`/dashboard/consultations/detail?id=${c.id}`)}>
                        <td className="py-2 pr-2 whitespace-nowrap">{fmtDate(c.date_consultation)}</td>
                        <td className="py-2 pr-2"><LieuBadge lieu={c.lieu} short /></td>
                        <td className="py-2 text-center tabular-nums">{c.vl_od_avec_correction || c.vl_od_sans_correction || "—"}</td>
                        <td className="py-2 text-center tabular-nums">{c.vl_og_avec_correction || c.vl_og_sans_correction || "—"}</td>
                        <td className="py-2 text-center tabular-nums whitespace-nowrap">{c.ref_od_sphere ? `${c.ref_od_sphere} (${c.ref_od_cylindre ?? "0"} à ${c.ref_od_axe ?? "0"}°)` : "—"}</td>
                        <td className="py-2 text-center tabular-nums whitespace-nowrap">{c.ref_og_sphere ? `${c.ref_og_sphere} (${c.ref_og_cylindre ?? "0"} à ${c.ref_og_axe ?? "0"}°)` : "—"}</td>
                        <td className="py-2 text-center tabular-nums">{c.tonus_od || c.tonus_og ? `${c.tonus_od ?? "—"} / ${c.tonus_og ?? "—"}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-xs text-muted-foreground mt-3">AV : acuité de loin avec correction (ou sans, si non mesurée avec).</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordonnances" className="space-y-2">
          {ordonnances.length === 0 ? <Card><CardContent className="pt-6"><Vide icon={<FileText className="h-10 w-10" />}>Aucune ordonnance.</Vide></CardContent></Card> : ordonnances.map((o) => (
            <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{fmtDate(o.consultation.date_consultation)} <span className="text-muted-foreground font-normal">· {o.consultation.lieu?.nom}</span></p>
                <p className="text-xs text-muted-foreground truncate">
                  {[o.type_verre && "Lunettes / lentilles", o.traitement && "Traitement"].filter(Boolean).join(" + ") || "Ordonnance"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => printPrescription(o, user)}><Printer className="mr-1.5 h-3.5 w-3.5" />Imprimer</Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="rdv" className="space-y-2">
          {rdvs.length === 0 ? <Card><CardContent className="pt-6"><Vide icon={<Calendar className="h-10 w-10" />}>Aucun rendez-vous.</Vide></CardContent></Card> : rdvs.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card" style={{ borderLeft: `3px solid ${r.lieu?.couleur}` }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{fmtDate(r.date_heure_rdv, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} à {fmtHeure(r.date_heure_rdv)}</p>
                <p className="text-xs text-muted-foreground truncate">{r.lieu?.nom}{r.motif ? ` · ${r.motif}` : ""}</p>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", statutRdvClass(r.statut))}>{statutRdvLabels[r.statut]}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <RdvDialog open={rdvOpen} onOpenChange={setRdvOpen} patient={patient} onSaved={() => load()} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {nomComplet(patient)} ?</AlertDialogTitle>
            <AlertDialogDescription>
              La fiche, les {consultations.length} consultation(s), les ordonnances et les rendez-vous de ce patient seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={supprimer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer définitivement</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function FichePatientPage() {
  return <Suspense fallback={<Chargement />}><FicheContent /></Suspense>
}
