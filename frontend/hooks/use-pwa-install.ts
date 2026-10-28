"use client"

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'ophtacare_pwa_dismissed'

function detectIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as any).standalone === true)
  )
}

export type InstallMode = 'native' | 'ios' | null

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [mode, setMode] = useState<InstallMode>(null)

  useEffect(() => {
    if (isInStandaloneMode()) {
      setIsInstalled(true)
      return
    }
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return

    if (detectIos()) {
      // iOS Safari: no beforeinstallprompt — show manual instructions
      setMode('ios')
      setShowBanner(true)
      return
    }

    // Chrome / Edge / Android
    const handler = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
      setMode('native')
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!promptEvent) return
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setShowBanner(false)
    setPromptEvent(null)
  }

  const dismiss = (permanent = false) => {
    if (permanent) localStorage.setItem(DISMISSED_KEY, 'true')
    setShowBanner(false)
  }

  return { showBanner, isInstalled, install, dismiss, mode }
}
