import { Toaster as SonnerToaster } from 'sonner'
import type { ReactNode } from 'react'

/**
 * Application-wide toast host, themed with Dira tokens so notifications match
 * the rest of the product rather than Sonner's defaults.
 */
export function Toaster(): ReactNode {
  return (
    <SonnerToaster
      // Bottom-right keeps confirmations clear of the header and the auth form.
      position="bottom-right"
      offset={20}
      gap={10}
      duration={5000}
      toastOptions={{
        classNames: {
          toast:
            'group flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-card',
          title: 'type-heading',
          description: 'type-caption text-muted-foreground',
          actionButton: 'type-caption rounded-md bg-primary px-2.5 py-1 font-semibold text-primary-foreground',
          cancelButton: 'type-caption rounded-md bg-muted px-2.5 py-1 font-medium text-muted-foreground',
          icon: 'shrink-0',
          error: 'border-destructive/25 [&_[data-icon]]:text-destructive',
          success: 'border-success/25 [&_[data-icon]]:text-success',
          warning: 'border-warning/25 [&_[data-icon]]:text-warning',
        },
      }}
    />
  )
}
