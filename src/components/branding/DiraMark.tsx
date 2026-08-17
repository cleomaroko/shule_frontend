import { useId } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface DiraMarkProps {
  className?: string
  /**
   * `brand` paints the green gradient, `mono` inherits the current text colour
   * for use on dark or single-colour surfaces.
   */
  tone?: 'brand' | 'mono'
  /** Hidden from assistive tech when a nearby wordmark already names the product. */
  title?: string | undefined
}

/**
 * The Dira mark: a "D" enclosing a compass needle — the brand's "direction"
 * idea reduced to one geometric form.
 */
export function DiraMark({ className, tone = 'brand', title }: DiraMarkProps): ReactNode {
  // Gradient ids must be unique per instance or duplicated marks share a fill.
  const gradientId = useId()
  const stroke = tone === 'brand' ? `url(#${gradientId})` : 'currentColor'

  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('size-8', className)}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {tone === 'brand' ? (
        <defs>
          <linearGradient id={gradientId} x1="4" y1="30" x2="28" y2="3" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--brand-green-600)" />
            <stop offset="0.55" stopColor="var(--brand-green-400)" />
            <stop offset="1" stopColor="var(--brand-mint-300)" />
          </linearGradient>
        </defs>
      ) : null}

      {/* The "D" bowl, left open at the base to keep the form light. */}
      <path
        d="M7.6 3.9h6.6c6.6 0 11.9 5.4 11.9 12.1s-5.3 12.1-11.9 12.1H7.6V3.9Z"
        stroke={stroke}
        strokeWidth="3.1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Compass needle pointing north-east, drawn as a chevron so the form stays
          legible at favicon sizes. */}
      <path
        d="M11.9 20.1 19.9 12.1M15.6 12.1h4.4v4.4"
        stroke={stroke}
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
