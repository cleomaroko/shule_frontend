import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { DiraWordmark } from '@/components/branding/DiraWordmark'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

interface RootErrorBoundaryProps {
  children: ReactNode
}

interface RootErrorBoundaryState {
  hasError: boolean
}

/**
 * Last line of defence for unexpected render errors.
 *
 * Without this, a thrown error unmounts the whole tree and leaves a blank page.
 * The technical cause is logged; the user gets an on-brand recovery screen.
 *
 * Deliberately free of router and auth dependencies so it still renders when
 * those are the things that failed.
 */
export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Unhandled UI error', error, info.componentStack)
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-5 text-center">
        <DiraWordmark size="sm" />

        <div className="flex flex-col gap-2">
          <h1 className="type-page-title">Something went wrong</h1>
          <p className="type-body max-w-sm text-muted-foreground">
            Dira hit an unexpected problem and could not finish loading this page. Reloading usually
            resolves it.
          </p>
        </div>

        <Button onClick={() => window.location.reload()}>Reload Dira</Button>
      </div>
    )
  }
}
