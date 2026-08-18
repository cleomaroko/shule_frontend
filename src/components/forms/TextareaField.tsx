import { useId, type ReactNode } from 'react'

import { FieldError } from '@/components/forms/FieldError'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface TextareaFieldProps {
  label: string
  error?: string | undefined
  hint?: string | undefined
  containerClassName?: string
  name?: string
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  placeholder?: string
  rows?: number
}

export function TextareaField({
  label,
  error,
  hint,
  containerClassName,
  ...textareaProps
}: TextareaFieldProps): ReactNode {
  const generatedId = useId()
  const id = textareaProps.name ? `${textareaProps.name}-${generatedId}` : generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={error ? 'border-destructive' : undefined}
        {...textareaProps}
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
