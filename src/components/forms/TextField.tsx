import { useId, type ReactNode } from 'react'

import { FieldError } from '@/components/forms/FieldError'
import { Input, type InputProps } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface TextFieldProps extends Omit<InputProps, 'id' | 'hasError'> {
  label: string
  error?: string | undefined
  /** Supporting copy rendered beneath the control. */
  hint?: string | undefined
  containerClassName?: string
}

/**
 * A labelled text input with validation messaging and ARIA wiring already
 * connected. Spread `register(...)` from React Hook Form directly onto it.
 */
export function TextField({
  label,
  error,
  hint,
  containerClassName,
  ...inputProps
}: TextFieldProps): ReactNode {
  const generatedId = useId()
  const id = inputProps.name ? `${inputProps.name}-${generatedId}` : generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={id}>{label}</Label>

      <Input
        id={id}
        hasError={Boolean(error)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />

      {hint ? (
        <p id={hintId} className="type-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}

      <FieldError id={errorId} message={error} />
    </div>
  )
}
