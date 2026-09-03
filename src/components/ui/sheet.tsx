import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export function SheetContent({
  className,
  children,
  side = 'left',
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { side?: 'left' | 'right' }): ReactNode {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 touch-none bg-navy-950/45 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          'sheet-drawer fixed z-50 flex h-full w-[min(20rem,88vw)] flex-col bg-card shadow-panel',
          'transform-gpu backface-hidden will-change-transform',
          side === 'left'
            ? 'sheet-drawer-left inset-y-0 left-0 border-r border-border'
            : 'sheet-drawer-right inset-y-0 right-0 border-l border-border',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close navigation</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>): ReactNode {
  return <DialogPrimitive.Title className={cn('type-section-title', className)} {...props} />
}
