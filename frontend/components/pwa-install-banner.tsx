"use client"

import { usePwaInstall } from '@/hooks/use-pwa-install'
import { Eye, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// iOS Share icon (SVG inline — lucide doesn't have the exact iOS share arrow)
function IosShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 inline-block align-middle" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-4" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

export function PwaInstallBanner() {
  const { showBanner, install, dismiss, mode } = usePwaInstall()

  if (!showBanner) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={() => dismiss(false)}
      />

      {/* Bottom sheet on mobile, centered card on desktop */}
      <div className="fixed z-[70] bottom-0 inset-x-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm md:w-full animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300">
        <div className="relative bg-background rounded-t-2xl md:rounded-2xl shadow-2xl border border-border p-6">
          {/* Close */}
          <button
            onClick={() => dismiss(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon + Title */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Eye className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Installer OphtaCare</h2>
              <p className="text-sm text-muted-foreground">Accès rapide depuis votre écran d&apos;accueil</p>
            </div>
          </div>

          {mode === 'ios' ? (
            /* ── iOS instructions ── */
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Safari ne propose pas de bouton automatique. Suivez ces 3 étapes rapides&nbsp;:
              </p>
              <ol className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <p className="text-sm">
                    Appuyez sur <span className="font-semibold">Partager</span>{' '}
                    <IosShareIcon />{' '}
                    en bas de Safari
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <p className="text-sm">
                    Faites défiler et tapez <span className="font-semibold">&quot;Sur l&apos;écran d&apos;accueil&quot;</span>
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <p className="text-sm">
                    Confirmez en appuyant sur <span className="font-semibold">Ajouter</span>
                  </p>
                </li>
              </ol>
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full h-11" onClick={() => dismiss(false)}>
                  J&apos;ai compris
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-10 text-sm text-muted-foreground"
                  onClick={() => dismiss(true)}
                >
                  Ne plus afficher
                </Button>
              </div>
            </>
          ) : (
            /* ── Native prompt (Chrome/Android/Edge) ── */
            <>
              <div className="space-y-2 mb-6">
                {[
                  'Accès immédiat sans navigateur',
                  'Fonctionne hors connexion',
                  'Notifications en temps réel',
                ].map((txt) => (
                  <div key={txt} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {txt}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={install} className="w-full h-11 gap-2">
                  <Download className="h-4 w-4" />
                  Ajouter à l&apos;écran d&apos;accueil
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-10 text-sm text-muted-foreground"
                  onClick={() => dismiss(true)}
                >
                  Ne plus afficher
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
