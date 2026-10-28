'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getQueue, processQueue } from '@/lib/offline-queue'
import { API_BASE_URL, getToken } from '@/lib/api'

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const syncingRef = useRef(false)

  const refreshCount = useCallback(async () => {
    try {
      const items = await getQueue()
      setPendingCount(items.length)
    } catch {}
  }, [])

  const sync = useCallback(async () => {
    const token = getToken()
    if (!token || syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    try {
      const synced = await processQueue(API_BASE_URL, token)
      if (synced > 0) {
        await refreshCount()
        window.dispatchEvent(new CustomEvent('ophtacare-synced', { detail: { count: synced } }))
      }
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [refreshCount])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    refreshCount()
    if (navigator.onLine) sync()

    const onOnline = () => { setIsOnline(true); sync() }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_REQUESTED') sync()
    }
    navigator.serviceWorker?.addEventListener('message', onSwMessage)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      navigator.serviceWorker?.removeEventListener('message', onSwMessage)
    }
  }, [sync, refreshCount])

  return { isOnline, pendingCount, syncing, sync, refreshCount }
}
