import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: ComponentProps<'textarea'>): ReactNode {
  return (
    <textarea
      className={cn(
        'type-body min-h-24 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-foreground outline-none',
        'transition-[border-color,box-shadow] duration-150',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
        'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
        className,
      )}
      {...props}
    />
  )
}
