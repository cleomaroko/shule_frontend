import type { ReactNode } from 'react'

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function ResetPasswordPage(): ReactNode {
  useDocumentTitle('New password')
  return <ResetPasswordForm />
}
