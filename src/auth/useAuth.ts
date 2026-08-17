import { useContext } from 'react'

import { AuthContext, type AuthContextValue } from '@/auth/auth.context'

/** Accesses the current session. Must be called within an `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }

  return context
}
