"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ConsultationForm } from "@/components/consultation-form"
import { Chargement, Erreur, PageHeader } from "@/components/page-states"
import { getConsultation, updateConsultation } from "@/lib/services"
import { ApiError } from "@/lib/api"
import { fmtDate, nomComplet } from "@/lib/format"
import type { Consultation } from "@/lib/types"

function ModifierContent() {
  const router = useRouter()
  const id = useSearchParams().get("id")
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    getConsultation(id).then(setConsultation).catch((e) => setError(e instanceof ApiError ? e.message : "Consultation introuvable."))
  }, [id])

  if (error) return <div><Erreur message={error} /></div>
  if (!consultation) return <div><Chargement /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Modifier la consultation" description={`${nomComplet(consultation.patient)} · ${fmtDate(consultation.date_consultation)}`} />
      <ConsultationForm
        consultation={consultation}
        submitLabel="Enregistrer les modifications"
        onCancel={() => router.back()}
        onSubmit={async ({ prescription: _p, ...data }) => {
          await updateConsultation(consultation.id, data)
          toast.success("Consultation mise à jour")
          router.replace(`/dashboard/consultations/detail?id=${consultation.id}`)
        }}
      />
    </div>
  )
}

export default function ModifierConsultationPage() {
  return <Suspense fallback={<Chargement />}><ModifierContent /></Suspense>
}
