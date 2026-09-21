import type { FormEvent, ReactNode } from 'react'

import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import type { FormFieldDefinition } from '@/features/forms/types/form.types'

export function DynamicFormFields({
  fields,
  values,
  onChange,
  disabled = false,
}: {
  fields: FormFieldDefinition[]
  values: Record<string, string>
  onChange: (label: string, value: string) => void
  disabled?: boolean
}): ReactNode {
  if (fields.length === 0) {
    return <p className="type-caption text-muted-foreground">This template has no parseable fields.</p>
  }

  return (
    <>
      {fields.map((field) => {
        const value = values[field.label] ?? ''
        const type = field.type.toLowerCase()
        if (type === 'textarea') {
          return (
            <TextareaField
              key={field.label}
              label={field.label}
              value={value}
              onChange={(event) => onChange(field.label, event.target.value)}
              disabled={disabled}
              containerClassName="sm:col-span-2"
              rows={4}
            />
          )
        }
        if (type === 'select') {
          return (
            <SelectField
              key={field.label}
              label={field.label}
              value={value}
              onChange={(next) => onChange(field.label, next)}
              options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
              disabled={disabled}
              allowEmpty={false}
              placeholder="Select…"
              emptyMessage="No options on this field."
            />
          )
        }
        return (
          <TextField
            key={field.label}
            label={field.label}
            type={type === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(event) => onChange(field.label, event.target.value)}
            disabled={disabled}
          />
        )
      })}
    </>
  )
}

export function collectAnswers(
  event: FormEvent,
  fields: FormFieldDefinition[],
  values: Record<string, string>,
): Record<string, string> | null {
  event.preventDefault()
  const answers: Record<string, string> = {}
  for (const field of fields) {
    const value = (values[field.label] ?? '').trim()
    if (!value) return null
    answers[field.label] = value
  }
  return answers
}
