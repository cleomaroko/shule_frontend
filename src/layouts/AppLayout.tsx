import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import type { ReactNode } from 'react'

import { useAuth } from '@/auth/useAuth'
import { AppHeader } from '@/components/layout/AppHeader'

/**
 * Shell for authenticated screens.
 *
 * A module sidebar slots in beside `<main>` once ERP modules land; until then the
 * header is the only chrome, so no empty navigation is rendered.
 */
export function AppLayout(): ReactNode {
  const { user, logout } = useAuth()

  // ProtectedRoute guarantees a user before this renders.
  if (!user) return null

  const handleSignOut = () => {
    logout('user')
    toast.success('Signed out', { description: 'You have been signed out of Dira.' })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader user={user} onSignOut={handleSignOut} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
