"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LieuBadge } from "@/components/lieu-badge"
import { Chargement, Erreur, Vide } from "@/components/page-states"
import { usePatientSearch } from "@/components/patient-picker"
import { Building2, Calendar, CheckCircle2, ChevronRight, Search, Stethoscope, UserPlus, Users } from "lucide-react"
import { getDashboard, updateRendezVous } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { useLieux } from "@/lib/lieu-context"
import { ApiError } from "@/lib/api"
import { ageLabel, fmtDate, fmtHeure, nomComplet, statutRdvClass, statutRdvLabels } from "@/lib/format"
import type { DashboardData } from "@/lib/types"
import { cn } from "@/lib/utils"

function RechercheRapide() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const { results, loading } = usePatientSearch(q.trim().length >= 2 ? q : null, null, 8)
  const actif = q.trim().length >= 2

  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        placeholder="Retrouver un patient : nom, téléphone, code…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && results[0]) router.push(`/dashboard/patients/fiche?id=${results[0].id}`) }}
        className="pl-11 h-12 text-base rounded-xl shadow-sm"
        type="search"
        autoComplete="off"
      />
      {actif && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border bg-popover shadow-lg overflow-hidden">
          {loading ? <p className="p-4 text-sm text-muted-foreground">Recherche…</p> : results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucun patient trouvé.</p>
          ) : results.map((p) => (
            <Link key={p.id} href={`/dashboard/patients/fiche?id=${p.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{nomComplet(p)}</p>
                <p className="text-xs text-muted-foreground truncate">{p.code_patient} · {ageLabel(p.date_naissance)}{p.telephone ? ` · ${p.telephone}` : ""}</p>
              </div>
              {p.lieu && <LieuBadge lieu={p.lieu} short className="hidden sm:inline-flex" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AccueilPage() {
  const { user } = useAuth()
  const { lieux, lieuActif, lieuActifId, loading: lieuxLoading } = useLieux()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(() => {
    getDashboard(lieuActifId)
      .then((d) => { setData(d); setError("") })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger l'accueil."))
  }, [lieuActifId])

  useEffect(() => { load() }, [load])

  const marquerVu = async (id: number) => {
    try {
      await updateRendezVous(id, { statut: "honore" })
      load()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erreur")
    }
  }

  const heure = new Date().getHours()
  const salut = heure < 18 ? "Bonjour" : "Bonsoir"

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">{salut}, {user?.titre ? `${user.titre} ` : ""}{user?.name}</h1>
        <p className="text-muted-foreground mt-1 capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          {lieuActif && <span className="normal-case"> · {lieuActif.nom}</span>}
        </p>
      </div>

      <RechercheRapide />

      {!lieuxLoading && lieux.length === 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <Building2 className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Première étape : ajoutez vos lieux de consultation</p>
              <p className="text-sm text-muted-foreground">Les cliniques et hôpitaux où vous consultez. Vos patients et rendez-vous y seront rattachés.</p>
            </div>
            <Button asChild><Link href="/dashboard/lieux">Ajouter mes lieux</Link></Button>
          </CardContent>
        </Card>
      )}

      {error && <Erreur message={error} />}

      {!data ? <Chargement /> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: lieuActif ? "Patients du lieu" : "Patients", value: data.stats.patients, icon: Users, href: "/dashboard/patients" },
              { label: "Consultations ce mois", value: data.stats.consultations_mois, icon: Stethoscope, href: "/dashboard/consultations" },
              { label: "RDV à venir", value: data.stats.rdv_a_venir, icon: Calendar, href: "/dashboard/agenda" },
            ].map((s) => (
              <Link key={s.label} href={s.href}>
                <Card className="hover:border-primary/40 transition-colors h-full">
                  <CardContent className="pt-4 pb-4 px-3 sm:px-6">
                    <s.icon className="h-4 w-4 text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Aujourd&apos;hui</CardTitle>
                  <CardDescription>{data.rdv_du_jour.filter((r) => r.statut !== "annule").length} rendez-vous{lieuActif ? "" : " · tous lieux"}</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild><Link href="/dashboard/agenda">Agenda<ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.rdv_du_jour.length === 0 ? (
                  <Vide icon={<Calendar className="h-8 w-8" />}>Aucun rendez-vous aujourd&apos;hui.</Vide>
                ) : data.rdv_du_jour.map((r) => (
                  <div key={r.id} className={cn("flex items-center gap-3 p-3 rounded-lg border", r.statut === "annule" && "opacity-50")} style={{ borderLeft: `4px solid ${r.lieu?.couleur}` }}>
                    <span className="text-base font-bold tabular-nums w-12 shrink-0">{fmtHeure(r.date_heure_rdv)}</span>
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/patients/fiche?id=${r.patient_id}`} className="font-medium text-sm hover:underline truncate block">{nomComplet(r.patient)}</Link>
                      <p className="text-xs text-muted-foreground truncate">{r.lieu?.nom}{r.motif ? ` · ${r.motif}` : ""}</p>
                    </div>
                    {r.consultation ? (
                      <Button size="sm" variant="ghost" asChild><Link href={`/dashboard/consultations/detail?id=${r.consultation.id}`}>Voir</Link></Button>
                    ) : r.statut === "prevu" ? (
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" asChild><Link href={`/dashboard/consultations/nouvelle?rdv_id=${r.id}`}><Stethoscope className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Consulter</span></Link></Button>
                        <Button size="sm" variant="outline" onClick={() => marquerVu(r.id)} aria-label="Marquer vu"><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : (
                      <span className={cn("text-[11px] px-1.5 py-0.5 rounded-full shrink-0", statutRdvClass(r.statut))}>{statutRdvLabels[r.statut]}</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Actions rapides</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-2">
                  <Button className="justify-start" asChild><Link href="/dashboard/consultations/nouvelle"><Stethoscope className="mr-2 h-4 w-4" />Nouvelle consultation</Link></Button>
                  <Button variant="outline" className="justify-start" asChild><Link href="/dashboard/patients/nouveau"><UserPlus className="mr-2 h-4 w-4" />Nouveau patient</Link></Button>
                  <Button variant="outline" className="justify-start" asChild><Link href="/dashboard/agenda"><Calendar className="mr-2 h-4 w-4" />Agenda</Link></Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Dernières consultations</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {data.consultations_recentes.length === 0 ? <p className="text-sm text-muted-foreground">Aucune pour l&apos;instant.</p> : data.consultations_recentes.map((c) => (
                    <Link key={c.id} href={`/dashboard/consultations/detail?id=${c.id}`} className="flex items-center gap-2 p-2 -mx-2 rounded-lg hover:bg-secondary/60">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.lieu?.couleur }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{nomComplet(c.patient)}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.diagnostic ?? "—"}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{fmtDate(c.date_consultation, { day: "numeric", month: "short" })}</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
