import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import type { ReactNode } from 'react'

import { SelectField } from '@/components/forms/SelectField'
import { toSelectOptions } from '@/components/forms/select-utils'
import { TextField } from '@/components/forms/TextField'

export interface LookupSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  options: string[]
  placeholder?: string | undefined
  error?: string | undefined
  hint?: string | undefined
  disabled?: boolean | undefined
  /** When the lookup list is empty, fall back to a free-text field. */
  fallbackToText?: boolean
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
  fallbackToText = true,
}: LookupSelectProps<T>): ReactNode {
  if (fallbackToText && options.length === 0) {
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
          options={toSelectOptions(options)}
          placeholder={placeholder}
          error={error}
          hint={hint}
          disabled={disabled}
        />
      )}
    />
  )
}
