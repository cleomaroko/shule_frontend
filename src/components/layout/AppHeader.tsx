import type { ReactNode } from 'react'

import type { AuthenticatedUser } from '@/auth/auth.types'
import { DiraWordmark } from '@/components/branding/DiraWordmark'
import { UserMenu } from '@/components/layout/UserMenu'

export interface AppHeaderProps {
  user: AuthenticatedUser
  onSignOut: () => void
}

/**
 * Top bar for authenticated screens. Kept intentionally sparse: navigation
 * belongs here once ERP modules exist.
 */
export function AppHeader({ user, onSignOut }: AppHeaderProps): ReactNode {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <DiraWordmark size="sm" />
        <UserMenu user={user} onSignOut={onSignOut} />
      </div>
    </header>
  )
}
