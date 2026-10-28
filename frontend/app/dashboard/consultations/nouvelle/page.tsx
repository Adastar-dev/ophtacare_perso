"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ConsultationForm } from "@/components/consultation-form"
import { Chargement, Erreur, PageHeader } from "@/components/page-states"
import { createConsultation, createPrescription, getRendezVousDetail } from "@/lib/services"
import { useLieux } from "@/lib/lieu-context"
import { ApiError } from "@/lib/api"
import { fmtDateLongue, fmtHeure } from "@/lib/format"
import type { RendezVous } from "@/lib/types"

function NouvelleContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { lieuActifId } = useLieux()
  const rdvId = params.get("rdv_id")
  const patientId = params.get("patient_id")

  const [rdv, setRdv] = useState<RendezVous | null>(null)
  const [loading, setLoading] = useState(!!rdvId)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!rdvId) return
    getRendezVousDetail(rdvId)
      .then((r) => {
        if (r.consultation) router.replace(`/dashboard/consultations/detail?id=${r.consultation.id}`)
        else setRdv(r)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Rendez-vous introuvable."))
      .finally(() => setLoading(false))
  }, [rdvId, router])

  if (loading) return <div><Chargement /></div>
  if (error) return <div><Erreur message={error} /></div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle consultation"
        description={rdv ? `Rendez-vous du ${fmtDateLongue(rdv.date_heure_rdv)} à ${fmtHeure(rdv.date_heure_rdv)}` : "Examen ophtalmologique"}
      />
      <ConsultationForm
        patientId={rdv?.patient_id ?? (patientId ? Number(patientId) : null)}
        rendezVousId={rdv?.id ?? null}
        lieuParDefaut={rdv?.lieu_id ?? lieuActifId}
        motifParDefaut={rdv?.motif}
        submitLabel="Enregistrer la consultation"
        onCancel={() => router.back()}
        onSubmit={async ({ prescription, ...data }) => {
          const res = await createConsultation(data)
          if (prescription) {
            try {
              await createPrescription({ consultation_id: res.consultation.id, ...prescription })
            } catch {
              toast.error("Consultation enregistrée, mais l'ordonnance n'a pas pu l'être. Vous pouvez la rédiger depuis la consultation.")
            }
          }
          toast.success("Consultation enregistrée")
          router.replace(`/dashboard/consultations/detail?id=${res.consultation.id}`)
        }}
      />
    </div>
  )
}

export default function NouvelleConsultationPage() {
  return <Suspense fallback={<Chargement />}><NouvelleContent /></Suspense>
}
