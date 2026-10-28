"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AuthScreen } from '@/components/auth/auth-screen'
import { Spinner } from '@/components/ui/spinner'

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard')
  }, [user, isLoading, router])

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  return <AuthScreen />
}
