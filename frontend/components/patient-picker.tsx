"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LieuBadge } from "@/components/lieu-badge"
import { Loader2, Search, UserPlus } from "lucide-react"
import Link from "next/link"
import { getPatients } from "@/lib/services"
import { ageLabel, initiales, nomComplet } from "@/lib/format"
import type { Patient } from "@/lib/types"

/**
 * Recherche côté serveur avec un léger délai pendant la frappe.
 * `q = null` désactive la recherche.
 */
export function usePatientSearch(q: string | null, lieuId?: number | null, limit = 50) {
  const [results, setResults] = useState<Patient[]>([])
  const [loading, setLoading] = useState(q !== null)

  useEffect(() => {
    if (q === null) { setResults([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    const t = setTimeout(() => {
      getPatients({ q: q.trim() || undefined, lieu_id: lieuId, limit })
        .then((r) => { if (!cancelled) setResults(r) })
        .catch(() => { if (!cancelled) setResults([]) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, q ? 250 : 0)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q, lieuId, limit])

  return { results, loading }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (patient: Patient) => void
  title?: string
  description?: string
}

/** Fenêtre de recherche d'un patient (tous lieux confondus). */
export function PatientPicker({ open, onOpenChange, onPick, title = "Choisir un patient", description }: Props) {
  const [q, setQ] = useState("")
  const { results, loading } = usePatientSearch(open ? q : null, null, 30)

  useEffect(() => { if (open) setQ("") }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ?? "Recherchez par nom, prénom, téléphone ou code patient."}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ex. Diop, 77 123…, PAT-2026-0001"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 text-base sm:text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto -mx-1 px-1">
          {loading && results.length === 0 ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : results.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">Aucun patient trouvé.</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/patients/nouveau"><UserPlus className="mr-2 h-4 w-4" />Créer une fiche</Link>
              </Button>
            </div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onPick(p); onOpenChange(false) }}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-colors"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{initiales(p)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{nomComplet(p)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.code_patient} · {ageLabel(p.date_naissance)}{p.telephone ? ` · ${p.telephone}` : ""}
                  </p>
                </div>
                {p.lieu && <LieuBadge lieu={p.lieu} short className="hidden sm:inline-flex" />}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
