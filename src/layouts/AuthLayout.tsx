import { Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'

import { BrandPanel } from '@/components/branding/BrandPanel'
import { DiraWordmark } from '@/components/branding/DiraWordmark'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { env } from '@/lib/env'

/**
 * Shell for every unauthenticated screen.
 *
 * Desktop shows the brand panel beside the form. Below `lg` the panel is
 * replaced by a compact brand header so the form gets the full viewport rather
 * than a shrunken version of the desktop composition.
 */
export function AuthLayout(): ReactNode {
  const year = new Date().getFullYear()

  return (
    <div className="min-h-dvh bg-card lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <BrandPanel />

      <main className="relative flex min-h-dvh flex-col bg-card px-5 py-8 sm:px-8 lg:min-h-0 lg:px-10 lg:py-10">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>

        {/* Compact brand lockup for viewports without the brand panel. */}
        <div className="mb-10 flex justify-center lg:hidden">
          <DiraWordmark size="sm" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[26rem] animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </div>

        <footer className="mt-10 flex flex-col items-center gap-1 text-center lg:mt-8">
          <p className="type-caption text-muted-foreground">
            {env.appName} · School Management System
          </p>
          <p className="type-caption text-muted-foreground/70">© {year} {env.appName}. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}
