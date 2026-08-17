import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  cn(
    'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg',
    'type-label font-semibold transition-[background-color,border-color,color,box-shadow,opacity] duration-150',
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:pointer-events-none disabled:opacity-55',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-subtle hover:bg-primary-hover active:bg-primary-hover',
        secondary: 'border border-border bg-card text-foreground shadow-subtle hover:bg-accent',
        outline: 'border border-input bg-transparent text-foreground hover:bg-accent',
        ghost: 'text-foreground hover:bg-accent',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground shadow-subtle hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-3',
        // 44px keeps the primary action within a comfortable touch target.
        md: 'h-11 px-4',
        lg: 'h-12 px-5 text-[0.9375rem]',
        icon: 'size-10',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      block: false,
    },
  },
)

export interface ButtonProps
  extends Omit<ComponentProps<'button'>, 'className'>,
    VariantProps<typeof buttonVariants> {
  className?: string
  /** Renders as the child element, e.g. to make a router `Link` look like a button. */
  asChild?: boolean
  /** Shows a spinner and blocks interaction — prevents duplicate submissions. */
  isLoading?: boolean
  /** Announced to assistive tech while loading. */
  loadingLabel?: string
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  isLoading = false,
  loadingLabel = 'Working',
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps): ReactNode {
  if (asChild) {
    return (
      <Slot className={cn(buttonVariants({ variant, size, block }), className)} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled === true || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}