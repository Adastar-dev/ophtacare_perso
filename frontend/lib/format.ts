import type { StatutRdv, TypeLieu, TypeTeinte, TypeVerre } from "@/lib/types"

export function nomComplet(p?: { prenom?: string | null; nom?: string | null } | null): string {
  if (!p) return "Patient inconnu"
  return `${p.prenom ?? ""} ${p.nom ?? ""}`.trim() || "Patient sans nom"
}

export function initiales(p?: { prenom?: string | null; nom?: string | null } | null): string {
  return `${p?.prenom?.[0] ?? ""}${p?.nom?.[0] ?? ""}`.toUpperCase() || "?"
}

export function age(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null
  const birth = new Date(dateNaissance)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let a = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--
  return a
}

export function ageLabel(dateNaissance?: string | null): string {
  const a = age(dateNaissance)
  if (a === null) return "Âge inconnu"
  return a < 2 ? `${a} an` : `${a} ans`
}

/** Les dates de l'API arrivent sans fuseau ("2026-10-27T09:30:00") : on les lit en heure locale. */
export function parseDate(iso?: string | null): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function fmtDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const d = parseDate(iso)
  return d ? d.toLocaleDateString("fr-FR", opts) : "—"
}

export function fmtDateLongue(iso?: string | null) {
  return fmtDate(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

export function fmtHeure(iso?: string | null) {
  const d = parseDate(iso)
  return d ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"
}

/** Clé "AAAA-MM-JJ" en heure locale. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Valeur pour <input type="datetime-local"> */
export function toDateTimeLocal(d: Date): string {
  return `${dateKey(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export const statutRdvLabels: Record<StatutRdv, string> = {
  prevu: "Prévu",
  honore: "Vu",
  annule: "Annulé",
  absent: "Absent",
}

export function statutRdvClass(statut: StatutRdv): string {
  switch (statut) {
    case "prevu":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300"
    case "honore":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "absent":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "annule":
      return "bg-muted text-muted-foreground line-through"
  }
}

export const typeLieuLabels: Record<TypeLieu, string> = {
  clinique: "Clinique",
  hopital: "Hôpital",
  cabinet: "Cabinet",
  autre: "Autre",
}

export const typeVerreLabels: Record<TypeVerre, string> = {
  unifocal: "Unifocaux",
  progressif: "Progressifs",
  bifocal: "Bifocaux",
  lentilles: "Lentilles de contact",
}

export const typeTeinteLabels: Record<TypeTeinte, string> = {
  blanc: "Blancs (incolores)",
  photochromique: "Photochromiques",
  solaire: "Teintés / solaires",
}

/** Couleurs proposées pour distinguer les lieux. */
export const COULEURS_LIEU = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0891b2", "#4b5563"]
