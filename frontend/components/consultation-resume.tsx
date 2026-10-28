import type { Consultation } from "@/lib/types"

/** Tableau OD / OG d'une consultation (acuité, réfraction, tonus). */
export function TableauMesures({ c, compact = false }: { c: Consultation; compact?: boolean }) {
  const lignes: [string, string | null, string | null][] = [
    ["VL sans correction", c.vl_od_sans_correction, c.vl_og_sans_correction],
    ["VL avec correction", c.vl_od_avec_correction, c.vl_og_avec_correction],
    ["Vision de près", c.vp_od, c.vp_og],
    ["Sphère", c.ref_od_sphere, c.ref_og_sphere],
    ["Cylindre", c.ref_od_cylindre, c.ref_og_cylindre],
    ["Axe", c.ref_od_axe ? `${c.ref_od_axe}°` : null, c.ref_og_axe ? `${c.ref_og_axe}°` : null],
    ["Tonus (mmHg)", c.tonus_od, c.tonus_og],
  ]
  const remplies = lignes.filter(([, od, og]) => od || og)
  if (remplies.length === 0) return <p className="text-sm text-muted-foreground">Aucune mesure saisie.</p>

  return (
    <table className={`w-full ${compact ? "text-xs" : "text-sm"}`}>
      <thead>
        <tr className="text-muted-foreground">
          <th className="text-left font-medium pb-1.5" />
          <th className="text-center font-semibold pb-1.5 text-primary">OD</th>
          <th className="text-center font-semibold pb-1.5 text-accent">OG</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {remplies.map(([label, od, og]) => (
          <tr key={label}>
            <td className="py-1.5 pr-3 text-muted-foreground">{label}</td>
            <td className="py-1.5 text-center font-medium tabular-nums">{od ?? "—"}</td>
            <td className="py-1.5 text-center font-medium tabular-nums">{og ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function BlocTexte({ titre, texte }: { titre: string; texte?: string | null }) {
  if (!texte) return null
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{titre}</p>
      <p className="text-sm whitespace-pre-wrap">{texte}</p>
    </div>
  )
}
