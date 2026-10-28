"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LieuBadge, LieuDot } from "@/components/lieu-badge"
import { Chargement, PageHeader, Vide } from "@/components/page-states"
import { usePatientSearch } from "@/components/patient-picker"
import { ChevronRight, Search, UserPlus, Users, X } from "lucide-react"
import { useLieux } from "@/lib/lieu-context"
import { ageLabel, fmtDate, initiales, nomComplet } from "@/lib/format"
import { cn } from "@/lib/utils"

function PatientsContent() {
  const searchParams = useSearchParams()
  const { lieux, lieuActifId } = useLieux()
  const paramLieu = searchParams.get("lieu")

  const [q, setQ] = useState("")
  const [lieuId, setLieuId] = useState<number | null>(paramLieu ? Number(paramLieu) : lieuActifId)

  // Suit le lieu actif de l'en-tête, sauf si un lieu est imposé dans l'URL
  useEffect(() => { if (!paramLieu) setLieuId(lieuActifId) }, [lieuActifId, paramLieu])

  const { results, loading } = usePatientSearch(q, lieuId, 500)
  const lieu = lieux.find((l) => l.id === lieuId)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Patients"
        description={loading ? "Recherche…" : `${results.length} patient${results.length > 1 ? "s" : ""}${lieu ? ` · ${lieu.nom}` : " · tous les lieux"}`}
        actions={
          <Button asChild>
            <Link href="/dashboard/patients/nouveau"><UserPlus className="mr-2 h-4 w-4" />Nouveau patient</Link>
          </Button>
        }
      />

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Nom, prénom, téléphone ou code patient…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 pr-9 h-11 text-base sm:text-sm"
          type="search"
          autoComplete="off"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground" aria-label="Effacer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtre par lieu */}
      {lieux.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => setLieuId(null)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
              lieuId === null ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary",
            )}
          >
            Tous
          </button>
          {lieux.map((l) => (
            <button
              key={l.id}
              onClick={() => setLieuId(l.id)}
              className={cn(
                "shrink-0 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                lieuId === l.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary",
              )}
            >
              <LieuDot couleur={l.couleur} className={lieuId === l.id ? "ring-2 ring-primary-foreground/60" : ""} />
              {l.nom}
            </button>
          ))}
        </div>
      )}
      {lieuId !== null && (
        <p className="text-xs text-muted-foreground -mt-2">
          Patients suivis habituellement dans ce lieu ou qui y ont eu au moins une consultation ou un rendez-vous.
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          {loading && results.length === 0 ? <Chargement /> : results.length === 0 ? (
            <Vide icon={<Users className="h-10 w-10" />}>
              {q ? "Aucun patient ne correspond à cette recherche." : "Aucun patient pour l'instant."}
              <div className="mt-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/patients/nouveau"><UserPlus className="mr-2 h-4 w-4" />Créer une fiche</Link>
                </Button>
              </div>
            </Vide>
          ) : (
            <ul className="divide-y">
              {results.map((p) => (
                <li key={p.id}>
                  <Link href={`/dashboard/patients/fiche?id=${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{initiales(p)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{nomComplet(p)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.code_patient} · {ageLabel(p.date_naissance)}{p.telephone ? ` · ${p.telephone}` : ""}
                      </p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                      {p.lieu && <LieuBadge lieu={p.lieu} short />}
                      <span className="text-[11px] text-muted-foreground">
                        {p.derniere_consultation ? `Vu le ${fmtDate(p.derniere_consultation)}` : "Jamais consulté"}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<Chargement />}>
      <PatientsContent />
    </Suspense>
  )
}
