import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from '@/auth/useAuth'
import { FullPageLoader } from '@/components/feedback/FullPageLoader'
import { paths } from '@/routes/paths'

/**
 * Gate for authenticated routes.
 *
 * Rendering is held back until the stored session has been evaluated, otherwise a
 * reload would bounce an authenticated user to the login screen. The attempted
 * location is preserved so the user returns to it after signing in.
 */
export function ProtectedRoute(): ReactNode {
  const { status, isAuthenticated } = useAuth()
  const location = useLocation()

  if (status === 'initialising') {
    return <FullPageLoader label="Restoring your session" />
  }

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace state={{ from: location }} />
  }

  return <Outlet />
}
