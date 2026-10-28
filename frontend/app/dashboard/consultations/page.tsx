"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LieuBadge } from "@/components/lieu-badge"
import { LieuSelect } from "@/components/lieu-select"
import { Chargement, Erreur, PageHeader, Vide } from "@/components/page-states"
import { ChevronRight, FileText, Plus, Search, Stethoscope } from "lucide-react"
import { getConsultations } from "@/lib/services"
import { useLieux } from "@/lib/lieu-context"
import { ApiError } from "@/lib/api"
import { fmtDate, fmtHeure, nomComplet } from "@/lib/format"
import type { Consultation } from "@/lib/types"

export default function ConsultationsPage() {
  const { lieuActifId } = useLieux()
  const [lieuId, setLieuId] = useState<number | null>(lieuActifId)
  const [q, setQ] = useState("")
  const [items, setItems] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => { setLieuId(lieuActifId) }, [lieuActifId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const t = setTimeout(() => {
      getConsultations({ lieu_id: lieuId, q: q.trim() || undefined, limit: 200 })
        .then((r) => { if (!cancelled) { setItems(r); setError("") } })
        .catch((e) => { if (!cancelled) setError(e instanceof ApiError ? e.message : "Erreur de chargement.") })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, q ? 250 : 0)
    return () => { cancelled = true; clearTimeout(t) }
  }, [lieuId, q])

  // Regroupe par mois
  const groupes = items.reduce<Record<string, Consultation[]>>((acc, c) => {
    const k = fmtDate(c.date_consultation, { month: "long", year: "numeric" })
    ;(acc[k] ||= []).push(c)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <PageHeader
        title="Consultations"
        description={loading ? "Chargement…" : `${items.length} consultation${items.length > 1 ? "s" : ""}${items.length === 200 ? " (les 200 plus récentes)" : ""}`}
        actions={<Button asChild><Link href="/dashboard/consultations/nouvelle"><Plus className="mr-2 h-4 w-4" />Nouvelle</Link></Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un patient…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 text-base sm:text-sm" type="search" />
        </div>
        <LieuSelect value={lieuId} onChange={setLieuId} allowAll className="sm:w-64" />
      </div>

      {error && <Erreur message={error} />}

      {loading && items.length === 0 ? <Chargement /> : items.length === 0 ? (
        <Card><CardContent className="pt-6"><Vide icon={<Stethoscope className="h-10 w-10" />}>Aucune consultation.</Vide></CardContent></Card>
      ) : (
        Object.entries(groupes).map(([mois, liste]) => (
          <div key={mois} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground capitalize">{mois}</h2>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {liste.map((c) => (
                    <li key={c.id}>
                      <Link href={`/dashboard/consultations/detail?id=${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50">
                        <div className="text-center w-12 shrink-0">
                          <p className="text-lg font-bold leading-none">{fmtDate(c.date_consultation, { day: "numeric" })}</p>
                          <p className="text-[11px] text-muted-foreground">{fmtHeure(c.date_consultation)}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{nomComplet(c.patient)}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.diagnostic ?? c.motif ?? "Pas de diagnostic"}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          {c.prescription && <Badge variant="secondary" className="text-xs"><FileText className="mr-1 h-3 w-3" />Ordonnance</Badge>}
                          <LieuBadge lieu={c.lieu} short />
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  )
}
