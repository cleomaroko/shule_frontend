import { CalendarDays } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

import type { AuthenticatedUser } from '@/auth/auth.types'
import { formatRoleLabel, getUserInitials } from '@/auth/user-display'
import { DiraMark } from '@/components/branding/DiraMark'
import { navigation } from '@/components/layout/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatAcademicYear } from '@/lib/academic-year'
import { env } from '@/lib/env'
import { cn } from '@/lib/utils'

export interface AppSidebarProps {
  user: AuthenticatedUser
  onNavigate?: () => void
}

export function AppSidebar({ user, onNavigate }: AppSidebarProps): ReactNode {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_0%_100%,color-mix(in_oklab,var(--sidebar-accent)_22%,transparent),transparent_58%)]"
        aria-hidden="true"
      />

      <div className="relative px-5 pt-6 pb-5">
        <span className="inline-flex items-center gap-2">
          <DiraMark className="size-7" />
          <span className="type-wordmark -me-[0.3em] text-base leading-none text-white">{env.appName}</span>
        </span>
        <p className="type-caption mt-2.5 text-sidebar-muted">Intelligent direction for education.</p>
      </div>

      <nav className="relative flex-1 space-y-6 overflow-y-auto px-3 pb-4" aria-label="Application">
        {navigation.map((section) => (
          <div key={section.title}>
            <p className="type-caption mb-2 px-2.5 font-semibold tracking-[0.14em] text-sidebar-muted uppercase">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      {...(item.end ? { end: true } : {})}
                      {...(onNavigate ? { onClick: onNavigate } : {})}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 type-label transition-colors',
                          isActive
                            ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-subtle'
                            : 'text-sidebar-foreground/80 hover:bg-white/10 hover:text-white',
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative mt-auto space-y-3 border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-white/5 px-3 py-2">
          <CalendarDays className="size-4 shrink-0 text-sidebar-accent" aria-hidden="true" />
          <div className="min-w-0">
            <p className="type-caption text-sidebar-muted">Academic year</p>
            <p className="type-label truncate text-white">{formatAcademicYear()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-white/5 px-3 py-2.5">
          <div className="relative shrink-0">
            <Avatar className="size-9">
              <AvatarFallback className="bg-white/10 text-white">{getUserInitials(user)}</AvatarFallback>
            </Avatar>
            <span
              className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-sidebar bg-success"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <p className="type-label truncate text-white">{user.username}</p>
            <p className="type-caption truncate text-sidebar-muted">{formatRoleLabel(user.role)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
