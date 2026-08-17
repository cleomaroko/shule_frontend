import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface InputProps extends ComponentProps<'input'> {
  /** Renders a leading icon inside the field; purely decorative. */
  startIcon?: ReactNode
  /** Renders trailing content inside the field, e.g. a visibility toggle. */
  endAdornment?: ReactNode
  /** Applies error styling. Pair with `aria-invalid` for assistive tech. */
  hasError?: boolean
}

export function Input({
  className,
  type = 'text',
  startIcon,
  endAdornment,
  hasError = false,
  ...props
}: InputProps): ReactNode {
  return (
    <div
      className={cn(
        'group relative flex h-11 w-full items-center rounded-lg border bg-card',
        'transition-[border-color,box-shadow] duration-150',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30',
        hasError ? 'border-destructive focus-within:border-destructive focus-within:ring-destructive/25' : 'border-input',
        props.disabled === true && 'cursor-not-allowed bg-muted opacity-70',
      )}
    >
      {startIcon ? (
        <span
          className={cn(
            'pointer-events-none flex shrink-0 pl-3 text-muted-foreground',
            'transition-colors duration-150 group-focus-within:text-foreground',
            hasError && 'text-destructive',
            '[&_svg]:size-4',
          )}
          aria-hidden="true"
        >
          {startIcon}
        </span>
      ) : null}

      <input
        type={type}
        className={cn(
          'type-body h-full w-full bg-transparent px-3 text-foreground outline-none',
          'disabled:cursor-not-allowed',
          // Neutralise the browser's autofill background so fields stay on-brand.
          'autofill:shadow-[inset_0_0_0_1000px_var(--card)] autofill:[-webkit-text-fill-color:var(--foreground)]',
          startIcon ? 'pl-2' : '',
          endAdornment ? 'pr-1' : '',
          className,
        )}
        {...props}
      />

      {endAdornment ? <span className="flex shrink-0 items-center pr-1.5">{endAdornment}</span> : null}
    </div>
  )
}
