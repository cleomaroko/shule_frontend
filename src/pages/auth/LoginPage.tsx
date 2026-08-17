import type { ReactNode } from 'react'

import { LoginForm } from '@/components/auth/LoginForm'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function LoginPage(): ReactNode {
  useDocumentTitle('Sign in')
  return <LoginForm />
}
