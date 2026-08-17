import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Static decorative geometry for the brand panel — a compass rose with a
 * north-east bearing, echoing the mark. Deliberately low-contrast and motionless
 * so it never competes with the sign-in form.
 */
export function BrandGeometry({ className }: { className?: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 400 400"
      className={cn('size-full', className)}
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="dira-bearing" x1="120" y1="290" x2="300" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand-green-400)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--brand-mint-200)" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <g stroke="currentColor">
        <circle cx="200" cy="200" r="150" strokeOpacity="0.09" />
        <circle cx="200" cy="200" r="110" strokeOpacity="0.12" />
        <circle cx="200" cy="200" r="70" strokeOpacity="0.09" />
        {/* Cardinal ticks, kept faint so they read as calibration rather than lines. */}
        <path d="M200 36v18M200 346v18M36 200h18M346 200h18" strokeOpacity="0.16" strokeWidth="1.5" />
      </g>

      {/* Bearing needle, matching the chevron in the Dira mark. */}
      <g
        stroke="url(#dira-bearing)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      >
        <path d="M136 274 258 152" />
        <path d="M204 152h54v54" />
      </g>
    </svg>
  )
}
