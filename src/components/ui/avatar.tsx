import * as AvatarPrimitive from '@radix-ui/react-avatar'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Avatar({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>): ReactNode {
  return (
    <AvatarPrimitive.Root
      className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
}

export function AvatarImage({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Image>): ReactNode {
  return <AvatarPrimitive.Image className={cn('aspect-square size-full object-cover', className)} {...props} />
}

export function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>): ReactNode {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-navy-800 text-[0.75rem] font-semibold tracking-wide text-white',
        className,
      )}
      {...props}
    />
  )
}
