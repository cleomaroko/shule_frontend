import { useId, type ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export interface SwitchFieldProps {
  label: string
  description?: string | undefined
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  name?: string
}

export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  name,
}: SwitchFieldProps): ReactNode {
  const id = useId()

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-3.5 py-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {description ? <p className="type-caption mt-0.5 text-muted-foreground">{description}</p> : null}
      </div>
      <Switch
        id={id}
        name={name}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn('mt-0.5')}
      />
    </div>
  )
}
