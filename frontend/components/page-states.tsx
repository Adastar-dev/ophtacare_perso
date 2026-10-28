import { AlertCircle, Loader2 } from "lucide-react"
import type { ReactNode } from "react"

export function Chargement({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  )
}

export function Erreur({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  )
}

export function Vide({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="text-center py-10 text-muted-foreground text-sm space-y-3">
      {icon && <div className="flex justify-center opacity-40">{icon}</div>}
      <div>{children}</div>
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
