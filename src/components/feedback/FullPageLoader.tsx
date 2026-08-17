import type { ReactNode } from 'react'

import { DiraMark } from '@/components/branding/DiraMark'

export interface FullPageLoaderProps {
  /** Announced to assistive technology while the app resolves its state. */
  label?: string
}

/**
 * Shown while the stored session is being restored, so the app never flashes the
 * login screen at an already-authenticated user.
 */
export function FullPageLoader({ label = 'Loading Dira' }: FullPageLoaderProps): ReactNode {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background" role="status">
      <DiraMark className="size-9 animate-pulse" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
