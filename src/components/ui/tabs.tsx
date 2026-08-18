import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>): ReactNode {
  return (
    <TabsPrimitive.List
      className={cn(
        'flex flex-wrap gap-1 rounded-xl border border-border bg-muted p-1',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>): ReactNode {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'type-label rounded-lg px-3 py-2 text-muted-foreground transition-colors',
        'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-subtle',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>): ReactNode {
  return <TabsPrimitive.Content className={cn('mt-6 outline-none', className)} {...props} />
}
