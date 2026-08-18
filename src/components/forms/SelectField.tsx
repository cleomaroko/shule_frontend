import { useId, type ReactNode } from 'react'

import { FieldError } from '@/components/forms/FieldError'
import { fromSelectValue, type SelectOption } from '@/components/forms/select-utils'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string | undefined
  error?: string | undefined
  hint?: string | undefined
  disabled?: boolean | undefined
  name?: string | undefined
  containerClassName?: string
  allowEmpty?: boolean
  emptyLabel?: string
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  error,
  hint,
  disabled,
  name,
  containerClassName,
  allowEmpty = true,
  emptyLabel = 'Not set',
}: SelectFieldProps): ReactNode {
  const generatedId = useId()
  const id = name ? `${name}-${generatedId}` : generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        onValueChange={(next) => onChange(fromSelectValue(next))}
        {...(value ? { value } : {})}
        {...(disabled ? { disabled: true } : {})}
        {...(name ? { name } : {})}
      >
        <SelectTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={error ? 'border-destructive' : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty ? (
            <SelectItem value="__empty">{emptyLabel}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? (
        <p id={hintId} className="type-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  )
}
