import { cn } from "@/lib/utils"
import type { LieuMini } from "@/lib/types"

/** Pastille colorée + nom du lieu. */
export function LieuBadge({ lieu, className, short = false }: { lieu?: LieuMini | null; className?: string; short?: boolean }) {
  if (!lieu) return <span className={cn("text-xs text-muted-foreground", className)}>Sans lieu</span>
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium max-w-full",
        className,
      )}
      style={{ borderColor: `${lieu.couleur}55`, backgroundColor: `${lieu.couleur}14`, color: lieu.couleur }}
      title={lieu.nom}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: lieu.couleur }} />
      <span className={cn("truncate", short && "max-w-[8rem]")}>{lieu.nom}</span>
    </span>
  )
}

export function LieuDot({ couleur, className }: { couleur?: string; className?: string }) {
  return <span className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)} style={{ backgroundColor: couleur ?? "#94a3b8" }} />
}
