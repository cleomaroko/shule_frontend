import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Card({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-card', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<'h2'>): ReactNode {
  return <h2 className={cn('type-page-title', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>): ReactNode {
  return <p className={cn('type-body text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div className={cn('p-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}
