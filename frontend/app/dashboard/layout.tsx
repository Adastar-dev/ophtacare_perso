"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { LieuProvider } from '@/lib/lieu-context'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Spinner } from '@/components/ui/spinner'

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) router.replace('/')
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <LieuProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </LieuProvider>
  )
}
