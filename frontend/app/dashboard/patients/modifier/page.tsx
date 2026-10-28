"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { PatientForm } from "@/components/patient-form"
import { Chargement, Erreur, PageHeader } from "@/components/page-states"
import { getPatient, updatePatient } from "@/lib/services"
import { ApiError } from "@/lib/api"
import { nomComplet } from "@/lib/format"
import type { Patient } from "@/lib/types"

function ModifierContent() {
  const router = useRouter()
  const id = useSearchParams().get("id")
  const [patient, setPatient] = useState<Patient | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    getPatient(id).then(setPatient).catch((e) => setError(e instanceof ApiError ? e.message : "Patient introuvable."))
  }, [id])

  if (error) return <div><Erreur message={error} /></div>
  if (!patient) return <div><Chargement /></div>

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title={`Modifier — ${nomComplet(patient)}`} description={patient.code_patient} />
      <PatientForm
        patient={patient}
        submitLabel="Enregistrer"
        onCancel={() => router.back()}
        onSubmit={async (data) => {
          await updatePatient(patient.id, data)
          toast.success("Fiche mise à jour")
          router.replace(`/dashboard/patients/fiche?id=${patient.id}`)
        }}
      />
    </div>
  )
}

export default function ModifierPatientPage() {
  return <Suspense fallback={<Chargement />}><ModifierContent /></Suspense>
}
