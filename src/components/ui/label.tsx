import * as LabelPrimitive from '@radix-ui/react-label'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>): ReactNode {
  return (
    <LabelPrimitive.Root
      className={cn(
        'type-label text-foreground select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  )
}
