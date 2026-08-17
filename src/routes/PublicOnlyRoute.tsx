import { Navigate, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from '@/auth/useAuth'
import { FullPageLoader } from '@/components/feedback/FullPageLoader'
import { DEFAULT_AUTHENTICATED_PATH } from '@/routes/paths'

/**
 * Keeps signed-in users away from the authentication screens, so returning to
 * `/login` with a live session lands on the app instead.
 */
export function PublicOnlyRoute(): ReactNode {
  const { status, isAuthenticated } = useAuth()

  if (status === 'initialising') {
    return <FullPageLoader />
  }

  if (isAuthenticated) {
    return <Navigate to={DEFAULT_AUTHENTICATED_PATH} replace />
  }

  return <Outlet />
}
