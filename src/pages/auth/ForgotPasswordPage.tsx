import type { ReactNode } from 'react'

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function ForgotPasswordPage(): ReactNode {
  useDocumentTitle('Reset password')
  return <ForgotPasswordForm />
}
