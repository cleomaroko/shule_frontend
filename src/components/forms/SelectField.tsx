import { useId, useState, type ReactNode } from 'react'

import { FieldError } from '@/components/forms/FieldError'
import { fromSelectValue, type SelectOption } from '@/components/forms/select-utils'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const SEARCH_THRESHOLD = 6

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
  /** Shown inside the list when `options` is empty (desktop and mobile). */
  emptyMessage?: string | undefined
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
  emptyMessage,
}: SelectFieldProps): ReactNode {
  const generatedId = useId()
  const id = name ? `${name}-${generatedId}` : generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')
  const [query, setQuery] = useState('')
  const searchable = options.length > SEARCH_THRESHOLD
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle))
    : options

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        onOpenChange={(open) => {
          if (!open) setQuery('')
        }}
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
          {searchable ? (
            <div
              className="sticky top-0 z-10 bg-popover p-1.5"
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search…"
                aria-label={`Search ${label}`}
                className="h-9 w-full rounded-md border border-input bg-card px-2.5 type-label text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
              />
            </div>
          ) : null}
          {allowEmpty ? <SelectItem value="__empty">{emptyLabel}</SelectItem> : null}
          {options.length === 0 && emptyMessage ? (
            <div className="px-2.5 py-2 type-label text-muted-foreground" role="status">
              {emptyMessage}
            </div>
          ) : null}
          {searchable && options.length > 0 && visible.length === 0 ? (
            <div className="px-2.5 py-2 type-label text-muted-foreground" role="status">
              No matches
            </div>
          ) : null}
          {visible.map((option) => (
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
