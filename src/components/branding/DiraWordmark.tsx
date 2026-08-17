import type { ReactNode } from 'react'

import { DiraMark } from '@/components/branding/DiraMark'
import { cn } from '@/lib/utils'
import { env } from '@/lib/env'

const sizeStyles = {
  sm: { mark: 'size-6', text: 'text-base', gap: 'gap-2' },
  md: { mark: 'size-8', text: 'text-xl', gap: 'gap-2.5' },
  lg: { mark: 'size-10', text: 'text-2xl', gap: 'gap-3' },
} as const

export interface DiraWordmarkProps {
  className?: string
  size?: keyof typeof sizeStyles
  /** `mono` inherits the current text colour, for dark brand surfaces. */
  tone?: 'brand' | 'mono'
  /** Stack the mark above the wordmark, as used on the compact auth header. */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * The Dira lockup: mark plus wordmark.
 *
 * The product name is read from configuration rather than hard-coded so the
 * lockup can carry school-specific branding later.
 */
export function DiraWordmark({
  className,
  size = 'md',
  tone = 'brand',
  orientation = 'horizontal',
}: DiraWordmarkProps): ReactNode {
  const styles = sizeStyles[size]

  return (
    <span
      className={cn(
        'inline-flex items-center',
        orientation === 'vertical' ? 'flex-col gap-3' : styles.gap,
        className,
      )}
    >
      <DiraMark className={styles.mark} tone={tone} />
      <span
        className={cn(
          // Trailing letter-spacing is pulled back so the lockup stays optically centred.
          'type-wordmark -me-[0.3em] leading-none',
          styles.text,
          tone === 'brand' ? 'text-foreground' : 'text-current',
        )}
      >
        {env.appName}
      </span>
    </span>
  )
}
