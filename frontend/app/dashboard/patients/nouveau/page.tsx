"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PatientForm } from "@/components/patient-form"
import { PageHeader } from "@/components/page-states"
import { createPatient } from "@/lib/services"
import { useLieux } from "@/lib/lieu-context"

export default function NouveauPatientPage() {
  const router = useRouter()
  const { lieuActifId } = useLieux()

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title="Nouveau patient" description="Seuls le nom et le prénom sont obligatoires." />
      <PatientForm
        lieuParDefaut={lieuActifId}
        submitLabel="Créer la fiche"
        onCancel={() => router.back()}
        onSubmit={async (data) => {
          const res = await createPatient(data)
          toast.success(`Fiche créée : ${res.patient.code_patient}`)
          router.replace(`/dashboard/patients/fiche?id=${res.patient.id}`)
        }}
      />
    </div>
  )
}
