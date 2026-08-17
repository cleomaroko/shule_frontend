import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 type-caption font-medium whitespace-nowrap [&_svg]:size-3',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-muted text-muted-foreground',
        primary: 'border-primary/20 bg-primary/10 text-primary',
        success: 'border-success/25 bg-success-subtle text-success',
        warning: 'border-warning/25 bg-warning-subtle text-warning',
        destructive: 'border-destructive/25 bg-destructive-subtle text-destructive',
        /** For use on the dark brand surfaces. */
        onDark: 'border-white/15 bg-white/10 text-white/85 backdrop-blur-sm',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export interface BadgeProps extends ComponentProps<'span'>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): ReactNode {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
