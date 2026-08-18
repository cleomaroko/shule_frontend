import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import type { ReactNode } from 'react'

import { useAuth } from '@/auth/useAuth'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'

/**
 * Shell for authenticated screens: navy sidebar on desktop, drawer on mobile.
 */
export function AppLayout(): ReactNode {
  const { user, logout } = useAuth()

  if (!user) return null

  const handleSignOut = () => {
    logout('user')
    toast.success('Signed out', { description: 'You have been signed out of Dira.' })
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-[17.5rem] shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">
          <AppSidebar user={user} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} onSignOut={handleSignOut} />
        <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
