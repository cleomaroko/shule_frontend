import { cva, type VariantProps } from 'class-variance-authority'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

const alertVariants = cva('flex w-full items-start gap-3 rounded-lg border p-3.5', {
  variants: {
    variant: {
      info: 'border-border bg-muted text-foreground',
      error: 'border-destructive/25 bg-destructive-subtle text-foreground',
      success: 'border-success/25 bg-success-subtle text-foreground',
      warning: 'border-warning/25 bg-warning-subtle text-foreground',
    },
  },
  defaultVariants: { variant: 'info' },
})

const iconStyles: Record<AlertVariant, string> = {
  info: 'text-muted-foreground',
  error: 'text-destructive',
  success: 'text-success',
  warning: 'text-warning',
}

const icons = {
  info: Info,
  error: XCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
} as const

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>

export interface AlertProps extends ComponentProps<'div'>, VariantProps<typeof alertVariants> {
  /** Hide the leading icon when the surrounding context already conveys intent. */
  showIcon?: boolean
}

export function Alert({ className, variant, showIcon = true, children, ...props }: AlertProps): ReactNode {
  const resolved: AlertVariant = variant ?? 'info'
  const Icon = icons[resolved]

  return (
    <div
      // Errors interrupt; everything else is announced politely.
      role={resolved === 'error' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {showIcon ? <Icon className={cn('mt-px size-4 shrink-0', iconStyles[resolved])} aria-hidden="true" /> : null}
      <div className="type-body min-w-0 flex-1 text-[0.875rem]">{children}</div>
    </div>
  )
}

export function AlertTitle({ className, ...props }: ComponentProps<'p'>): ReactNode {
  return <p className={cn('type-heading mb-0.5', className)} {...props} />
}

export function AlertDescription({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div className={cn('text-muted-foreground', className)} {...props} />
}
