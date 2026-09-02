import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import type { ReactNode } from 'react'

import { SelectField } from '@/components/forms/SelectField'
import type { SelectOption } from '@/components/forms/select-utils'
import { TextField } from '@/components/forms/TextField'

export type LookupSelectOption = string | SelectOption

export interface LookupSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  options: LookupSelectOption[]
  placeholder?: string | undefined
  error?: string | undefined
  hint?: string | undefined
  disabled?: boolean | undefined
  isLoading?: boolean | undefined
  /** When the lookup list is empty, fall back to a free-text field. Off by default so backend lists stay dropdowns. */
  fallbackToText?: boolean
  emptyMessage?: string | undefined
  allowEmpty?: boolean
}

function normalizeOptions(options: LookupSelectOption[]): SelectOption[] {
  const seen = new Set<string>()
  const result: SelectOption[] = []
  for (const item of options) {
    const option = typeof item === 'string' ? { value: item, label: item } : item
    const value = option.value.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push({ value, label: option.label?.trim() || value })
  }
  return result
}

/**
 * Bound select for backend lookup names. Staff/learner fields store the *name*
 * string, not the lookup id.
 */
export function LookupSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  error,
  hint,
  disabled,
  isLoading = false,
  fallbackToText = false,
  emptyMessage,
  allowEmpty,
}: LookupSelectProps<T>): ReactNode {
  const normalized = normalizeOptions(options)

  if (fallbackToText && !isLoading && normalized.length === 0) {
    return (
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TextField
            label={label}
            name={field.name}
            value={String(field.value ?? '')}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            error={error}
            hint={hint ?? 'No lookup values yet — enter a value directly.'}
          />
        )}
      />
    )
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SelectField
          label={label}
          name={field.name}
          value={String(field.value ?? '')}
          onChange={field.onChange}
          options={normalized}
          placeholder={isLoading ? 'Loading…' : (placeholder ?? 'Select…')}
          error={error}
          hint={hint}
          disabled={disabled || isLoading}
          emptyMessage={isLoading ? undefined : emptyMessage}
          {...(allowEmpty === undefined ? {} : { allowEmpty })}
        />
      )}
    />
  )
}
