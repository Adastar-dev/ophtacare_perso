"use client"

/**
 * « Lieu actif » : le lieu où la praticienne consulte en ce moment.
 * Choisi une fois dans l'en-tête, il filtre l'accueil, les patients, l'agenda,
 * les consultations et les ordonnances, et sert de valeur par défaut aux
 * nouvelles fiches. `null` = tous les lieux.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Lieu } from "@/lib/types"
import { getLieux } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"

const STORAGE_KEY = "ophtacare_lieu_actif"

interface LieuContextType {
  lieux: Lieu[]
  lieuActifId: number | null
  lieuActif: Lieu | null
  setLieuActifId: (id: number | null) => void
  refreshLieux: () => Promise<void>
  loading: boolean
  lieuById: (id: number | null | undefined) => Lieu | undefined
}

const LieuContext = createContext<LieuContextType | undefined>(undefined)

function readStored(): number | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v ? Number(v) || null : null
  } catch {
    return null
  }
}

export function LieuProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [lieux, setLieux] = useState<Lieu[]>([])
  const [lieuActifId, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshLieux = useCallback(async () => {
    try {
      const data = await getLieux()
      setLieux(data)
      // Si le lieu mémorisé a été archivé, on revient à « tous »
      setId((current) => (current && !data.some((l) => l.id === current) ? null : current))
    } catch {
      /* l'erreur s'affichera sur la page concernée */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    setId(readStored())
    refreshLieux()
  }, [user, refreshLieux])

  const setLieuActifId = useCallback((id: number | null) => {
    setId(id)
    try {
      if (id) localStorage.setItem(STORAGE_KEY, String(id))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* stockage indisponible (navigation privée) */
    }
  }, [])

  const value = useMemo<LieuContextType>(() => {
    const lieuById = (id: number | null | undefined) => (id ? lieux.find((l) => l.id === id) : undefined)
    return {
      lieux,
      lieuActifId,
      lieuActif: lieuById(lieuActifId) ?? null,
      setLieuActifId,
      refreshLieux,
      loading,
      lieuById,
    }
  }, [lieux, lieuActifId, setLieuActifId, refreshLieux, loading])

  return <LieuContext.Provider value={value}>{children}</LieuContext.Provider>
}

export function useLieux() {
  const ctx = useContext(LieuContext)
  if (!ctx) throw new Error("useLieux doit être utilisé dans LieuProvider")
  return ctx
}
