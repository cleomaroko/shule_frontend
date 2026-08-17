import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { setAuthTokenProvider, setUnauthorizedHandler } from '@/api/client'
import { AuthContext, type AuthContextValue } from '@/auth/auth.context'
import { authService, type LoginParams } from '@/auth/auth.service'
import { sessionStorageAdapter } from '@/auth/auth.storage'
import type { AuthStatus, LogoutReason, Session } from '@/auth/auth.types'
import { logger } from '@/lib/logger'

/** setTimeout treats delays beyond this as zero, so expiry timers are clamped. */
const MAX_TIMEOUT_MS = 2_147_483_647

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Owns all authentication state for the application.
 *
 * Session persistence, token exposure to the API client and expiry handling all
 * live here so no component ever touches a token directly.
 */
export function AuthProvider({ children }: AuthProviderProps): ReactNode {
  const [session, setSession] = useState<Session | null>(() => authService.restoreSession())
  const [status, setStatus] = useState<AuthStatus>('initialising')
  const [logoutReason, setLogoutReason] = useState<LogoutReason | null>(null)

  // Mirrors `session` so the API client can read the current token synchronously
  // from an interceptor without re-registering on every change.
  const sessionRef = useRef<Session | null>(session)

  const applySession = useCallback((next: Session | null) => {
    sessionRef.current = next
    setSession(next)
    setStatus(next ? 'authenticated' : 'unauthenticated')
  }, [])

  const logout = useCallback(
    (reason: LogoutReason = 'user') => {
      if (sessionRef.current === null) return
      authService.logout()
      applySession(null)
      setLogoutReason(reason)
    },
    [applySession],
  )

  const login = useCallback(
    async (params: LoginParams): Promise<Session> => {
      const next = await authService.login(params)
      setLogoutReason(null)
      applySession(next)
      return next
    },
    [applySession],
  )

  const acknowledgeLogoutReason = useCallback(() => setLogoutReason(null), [])

  // Resolve the initial status once the stored session has been evaluated.
  useEffect(() => {
    setStatus(sessionRef.current ? 'authenticated' : 'unauthenticated')
  }, [])

  // Give the API client access to the token and a way to end an invalid session.
  useEffect(() => {
    setAuthTokenProvider(() => sessionRef.current?.token ?? null)
    setUnauthorizedHandler(() => logout('expired'))

    return () => {
      setAuthTokenProvider(() => null)
      setUnauthorizedHandler(() => {})
    }
  }, [logout])

  // Sign out the moment the JWT lapses rather than waiting for a failed request,
  // which matters because the backend cannot tell us the token is stale.
  useEffect(() => {
    const expiresAt = session?.expiresAt
    if (!session || expiresAt == null) return

    const delay = Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMEOUT_MS)
    const timer = window.setTimeout(() => {
      logger.debug('Session token expired; signing out')
      logout('expired')
    }, delay)

    return () => window.clearTimeout(timer)
  }, [session, logout])

  // Keep browser tabs consistent when the session is created or discarded
  // elsewhere. Only persistent ("remember me") sessions are shared across tabs.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return

      const stored = authService.restoreSession()
      if (stored?.token === sessionRef.current?.token) return

      if (stored) {
        applySession(stored)
      } else if (sessionStorageAdapter.read() === null) {
        applySession(null)
        setLogoutReason('user')
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [applySession])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === 'authenticated' && session !== null,
      user: session?.user ?? null,
      token: session?.token ?? null,
      logoutReason,
      login,
      logout,
      acknowledgeLogoutReason,
    }),
    [status, session, logoutReason, login, logout, acknowledgeLogoutReason],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
