import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface FieldErrorProps {
  id: string
  message: string | undefined
  className?: string
}

/**
 * Validation message for a single field.
 *
 * `role="alert"` makes the message announced as soon as it appears, and the id is
 * referenced by the input's `aria-describedby`.
 */
export function FieldError({ id, message, className }: FieldErrorProps): ReactNode {
  if (!message) return null

  return (
    <p id={id} role="alert" className={cn('type-caption text-destructive', className)}>
      {message}
    </p>
  )
}
