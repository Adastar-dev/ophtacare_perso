"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LieuBadge } from "@/components/lieu-badge"
import { LieuSelect } from "@/components/lieu-select"
import { Chargement, Erreur, PageHeader, Vide } from "@/components/page-states"
import { PrescriptionPreview, aCorrectionOptique, printPrescription } from "@/components/prescription/prescription-canvas"
import { Eye, FileText, Printer, Search } from "lucide-react"
import { getPrescriptions } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { useLieux } from "@/lib/lieu-context"
import { ApiError } from "@/lib/api"
import { fmtDate, nomComplet } from "@/lib/format"
import type { Prescription } from "@/lib/types"

export default function OrdonnancesPage() {
  const { user } = useAuth()
  const { lieuActifId } = useLieux()
  const [lieuId, setLieuId] = useState<number | null>(lieuActifId)
  const [items, setItems] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [q, setQ] = useState("")
  const [apercu, setApercu] = useState<Prescription | null>(null)

  useEffect(() => { setLieuId(lieuActifId) }, [lieuActifId])

  useEffect(() => {
    setLoading(true)
    getPrescriptions({ lieu_id: lieuId })
      .then((r) => { setItems(r); setError("") })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erreur de chargement."))
      .finally(() => setLoading(false))
  }, [lieuId])

  const terme = q.trim().toLowerCase()
  const filtres = terme
    ? items.filter((p) => `${nomComplet(p.consultation?.patient)} ${p.consultation?.patient?.code_patient ?? ""}`.toLowerCase().includes(terme))
    : items

  return (
    <div className="space-y-5">
      <PageHeader title="Ordonnances" description={`${filtres.length} ordonnance${filtres.length > 1 ? "s" : ""}`} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un patient…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 text-base sm:text-sm" type="search" />
        </div>
        <LieuSelect value={lieuId} onChange={setLieuId} allowAll className="sm:w-64" />
      </div>

      {error && <Erreur message={error} />}

      <Card>
        <CardContent className="p-0">
          {loading ? <Chargement /> : filtres.length === 0 ? (
            <Vide icon={<FileText className="h-10 w-10" />}>Aucune ordonnance. Elles se rédigent depuis une consultation.</Vide>
          ) : (
            <ul className="divide-y">
              {filtres.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/consultations/detail?id=${p.consultation_id}`} className="font-medium hover:underline truncate block">{nomComplet(p.consultation?.patient)}</Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {fmtDate(p.consultation?.date_consultation)} · {[aCorrectionOptique(p) && "Correction optique", p.traitement && "Traitement"].filter(Boolean).join(" + ") || "Remarques"}
                    </p>
                  </div>
                  <LieuBadge lieu={p.consultation?.lieu} short className="hidden sm:inline-flex" />
                  <Button variant="ghost" size="icon" onClick={() => setApercu(p)} aria-label="Aperçu"><Eye className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => printPrescription(p, user)} aria-label="Imprimer"><Printer className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!apercu} onOpenChange={(o) => !o && setApercu(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ordonnance — {nomComplet(apercu?.consultation?.patient)}</DialogTitle>
            <DialogDescription>Imprimez-la ou enregistrez-la en PDF depuis la fenêtre d&apos;impression.</DialogDescription>
          </DialogHeader>
          {apercu && (
            <>
              <div className="flex justify-end">
                <Button onClick={() => printPrescription(apercu, user)}><Printer className="mr-2 h-4 w-4" />Imprimer / PDF</Button>
              </div>
              <PrescriptionPreview prescription={apercu} praticien={user} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
