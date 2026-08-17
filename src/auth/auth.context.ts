import { createContext } from 'react'

import type { LoginParams } from '@/auth/auth.service'
import type { AuthStatus, AuthenticatedUser, LogoutReason, Session } from '@/auth/auth.types'

export interface AuthContextValue {
  status: AuthStatus
  isAuthenticated: boolean
  user: AuthenticatedUser | null
  token: string | null
  /** Set when a session ended, so the login screen can explain why. */
  logoutReason: LogoutReason | null
  login: (params: LoginParams) => Promise<Session>
  logout: (reason?: LogoutReason) => void
  acknowledgeLogoutReason: () => void
}

/**
 * Session context. Kept apart from `AuthProvider` so the provider module only
 * exports components, which keeps React Fast Refresh working.
 *
 * Consume it through `useAuth()` rather than directly.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
