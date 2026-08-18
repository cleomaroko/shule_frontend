import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps): ReactNode {
  return (
    <div className={cn('w-full max-w-sm', className)}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        startIcon={<Search />}
        aria-label={placeholder}
      />
    </div>
  )
}

export interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
}

export function FilterChip({ label, active, onClick }: FilterChipProps): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'type-caption rounded-full border px-3 py-1.5 font-medium transition-colors',
        active
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
