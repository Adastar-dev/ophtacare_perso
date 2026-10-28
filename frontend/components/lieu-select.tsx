"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LieuDot } from "@/components/lieu-badge"
import { useLieux } from "@/lib/lieu-context"

const TOUS = "tous"
const AUCUN = "aucun"

interface Props {
  value: number | null
  onChange: (id: number | null) => void
  /** Ajoute l'option « Tous les lieux » (filtres) */
  allowAll?: boolean
  /** Ajoute l'option « Aucun » (champ facultatif) */
  allowNone?: boolean
  placeholder?: string
  className?: string
  id?: string
}

export function LieuSelect({ value, onChange, allowAll, allowNone, placeholder = "Choisir un lieu", className, id }: Props) {
  const { lieux } = useLieux()
  const current = value ? String(value) : allowAll ? TOUS : allowNone ? AUCUN : ""

  return (
    <Select
      value={current}
      onValueChange={(v) => onChange(v === TOUS || v === AUCUN ? null : Number(v))}
    >
      <SelectTrigger className={className} id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value={TOUS}>Tous les lieux</SelectItem>}
        {allowNone && <SelectItem value={AUCUN}>Aucun</SelectItem>}
        {lieux.map((l) => (
          <SelectItem key={l.id} value={String(l.id)}>
            <span className="flex items-center gap-2">
              <LieuDot couleur={l.couleur} />
              {l.nom}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
