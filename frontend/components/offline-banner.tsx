'use client'
import { useEffect } from 'react'
import { RefreshCw, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useOfflineSync } from '@/hooks/use-offline-sync'

export function OfflineBanner() {
  const { isOnline, pendingCount, syncing, sync } = useOfflineSync()

  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent<{ count: number }>).detail?.count
      if (count > 0)
        toast.success(
          `${count} consultation${count > 1 ? 's' : ''} synchronisée${count > 1 ? 's' : ''}`,
        )
    }
    window.addEventListener('ophtacare-synced', handler)
    return () => window.removeEventListener('ophtacare-synced', handler)
  }, [])

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg',
        !isOnline ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white',
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Hors ligne{pendingCount > 0 ? ` · ${pendingCount} en attente` : ''}</span>
        </>
      ) : (
        <>
          <RefreshCw className={cn('h-4 w-4 shrink-0', syncing && 'animate-spin')} />
          <button onClick={sync} disabled={syncing} className="disabled:opacity-70">
            {syncing
              ? 'Synchronisation…'
              : `${pendingCount} consultation${pendingCount > 1 ? 's' : ''} à synchroniser`}
          </button>
        </>
      )}
    </div>
  )
}
