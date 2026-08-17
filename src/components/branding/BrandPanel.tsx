import { BarChart3, GraduationCap, MessagesSquare, Users, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'

import { BrandGeometry } from '@/components/branding/BrandGeometry'
import { DiraWordmark } from '@/components/branding/DiraWordmark'

/**
 * Capability labels shown as static brand copy. These are illustrative only —
 * none of these modules are implemented, and nothing here is interactive.
 */
const capabilities = [
  { label: 'Academics', icon: GraduationCap },
  { label: 'Students', icon: Users },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Finance', icon: Wallet },
  { label: 'Communication', icon: MessagesSquare },
] as const

/**
 * The dark brand surface beside the authentication form. Hidden below `lg`,
 * where the form takes the full viewport instead of being scaled down.
 */
export function BrandPanel(): ReactNode {
  return (
    <aside className="relative isolate hidden overflow-hidden bg-navy-800 text-white lg:flex lg:flex-col">
      {/* Layered, motionless atmosphere: a green cast from below and a cool top light. */}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(115%_85%_at_8%_105%,color-mix(in_oklab,var(--brand-green-500)_45%,transparent),transparent_62%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(75%_55%_at_85%_-10%,color-mix(in_oklab,var(--brand-navy-600)_75%,transparent),transparent_70%)]"
        aria-hidden="true"
      />
      <BrandGeometry className="absolute -right-24 bottom-[-14%] -z-10 w-[34rem] text-white opacity-70" />

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-12 p-10 xl:p-14">
        <DiraWordmark tone="mono" size="md" className="text-white" />

        <div className="max-w-md animate-in fade-in slide-in-from-bottom-3 duration-700">
          <h1 className="type-display text-balance">
            Intelligent direction for <span className="text-mint-300">every school.</span>
          </h1>
          <p className="type-body mt-5 max-w-sm text-pretty text-white/70">
            Dira connects every part of your institution and gives your team the clarity to make better
            decisions, every day.
          </p>

          <div className="mt-8 h-px w-16 bg-gradient-to-r from-mint-300/80 to-transparent" />
        </div>

        <ul className="flex flex-wrap gap-2" aria-label="Planned Dira modules">
          {capabilities.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="type-caption inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/8 px-2.5 py-1.5 font-medium text-white/80 backdrop-blur-sm"
            >
              <Icon className="size-3.5 text-mint-300" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
