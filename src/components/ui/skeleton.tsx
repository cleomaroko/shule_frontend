import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden="true" {...props} />
}
