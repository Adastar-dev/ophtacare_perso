"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { useLieux } from "@/lib/lieu-context"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LieuDot } from "@/components/lieu-badge"
import {
  Eye, Home, Calendar, Users, FileText, Settings, LogOut, Stethoscope, Building2,
  ChevronLeft, ChevronRight, ChevronDown, Menu, Sun, Moon, X, MapPin, Plus,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
  { href: "/dashboard/consultations", label: "Consultations", icon: Stethoscope },
  { href: "/dashboard/ordonnances", label: "Ordonnances", icon: FileText },
  { href: "/dashboard/lieux", label: "Mes lieux", icon: Building2 },
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
]

const bottomItems = navItems.slice(0, 4)

function initialesUser(name?: string) {
  const parts = (name ?? "").trim().split(/\s+/)
  return `${parts[0]?.[0] ?? "?"}${parts[1]?.[0] ?? ""}`.toUpperCase()
}

/** Sélecteur du lieu où la praticienne consulte en ce moment. */
function LieuActifMenu() {
  const { lieux, lieuActif, lieuActifId, setLieuActifId } = useLieux()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 min-w-0 max-w-[60vw] sm:max-w-xs rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
          aria-label="Choisir le lieu actif"
        >
          {lieuActif ? <LieuDot couleur={lieuActif.couleur} /> : <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />}
          <span className="truncate font-medium">{lieuActif?.nom ?? "Tous les lieux"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Où consultez-vous en ce moment ?
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={lieuActifId ? String(lieuActifId) : "tous"}
          onValueChange={(v) => setLieuActifId(v === "tous" ? null : Number(v))}
        >
          <DropdownMenuRadioItem value="tous">Tous les lieux</DropdownMenuRadioItem>
          {lieux.map((l) => (
            <DropdownMenuRadioItem key={l.id} value={String(l.id)}>
              <LieuDot couleur={l.couleur} className="mr-2" />
              <span className="truncate">{l.nom}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/lieux"><Plus className="mr-2 h-4 w-4" />Gérer mes lieux</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.replace("/")
  }

  const path = pathname.replace(/\/$/, "")
  const isActive = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href))
  const displayName = `${user.titre ? user.titre + " " : ""}${user.name}`

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      <div className={cn("border-b border-sidebar-border flex items-center", collapsed ? "p-3 justify-center" : "p-5 justify-between")}>
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0" onClick={onNavClick}>
          <div className="p-1.5 bg-sidebar-primary/10 rounded-lg shrink-0">
            <Eye className="h-5 w-5 text-sidebar-primary" />
          </div>
          {!collapsed && <span className="text-lg font-bold text-sidebar-foreground truncate">OphtaCare</span>}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:block p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Réduire le menu"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label="Agrandir le menu"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <nav className={cn("flex-1 space-y-1 overflow-y-auto", collapsed ? "p-2" : "p-3")}>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const link = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center p-3" : "gap-3 px-3 py-3",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : link
        })}
      </nav>

      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive transition-colors",
            collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && "Déconnexion"}
        </button>
      </div>
    </>
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-background">
        {/* Menu latéral (ordinateur) */}
        <aside className={cn(
          "hidden lg:flex bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 shrink-0 sticky top-0 h-screen",
          collapsed ? "w-16" : "w-64",
        )}>
          <SidebarContent />
        </aside>

        {/* Menu latéral (mobile) */}
        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:hidden pt-[env(safe-area-inset-top)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 mt-[env(safe-area-inset-top)] p-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent onNavClick={() => setMobileOpen(false)} />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
            <div className="h-14 flex items-center justify-between gap-2 px-3 md:px-6">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setMobileOpen(true)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary lg:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <LieuActifMenu />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                  aria-label="Changer le thème"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-secondary">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {initialesUser(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden md:block">{displayName}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <p className="font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/parametres"><Settings className="mr-2 h-4 w-4" />Paramètres</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 pb-24 lg:pb-0 [&>div]:px-4 [&>div]:py-5 [&>div]:md:px-6 [&>div]:md:py-6 [&>div]:lg:px-8 [&>div]:lg:py-8">
            {children}
          </main>
        </div>

        {/* Barre de navigation du bas (iPhone) */}
        <nav className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden safe-area-bottom">
          <div className="flex items-center justify-around h-16">
            {bottomItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 flex-1 h-full px-1 transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <div className={cn("p-1.5 rounded-xl", active && "bg-primary/10")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full px-1 text-muted-foreground"
            >
              <div className="p-1.5 rounded-xl"><Menu className="h-5 w-5" /></div>
              <span className="text-[10px] font-medium leading-none">Plus</span>
            </button>
          </div>
        </nav>
      </div>
    </TooltipProvider>
  )
}
