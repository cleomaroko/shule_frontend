import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps): ReactNode {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="type-page-title">{title}</h1>
        {description ? <p className="type-body mt-1.5 max-w-2xl text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string | undefined
  actionTo?: string | undefined
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({ title, description, actionLabel, actionTo, onAction, icon }: EmptyStateProps): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <h2 className="type-section-title">{title}</h2>
      <p className="type-body max-w-sm text-muted-foreground">{description}</p>
      {actionLabel && actionTo ? (
        <Button asChild className="mt-2">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Unable to load this page', message, onRetry }: ErrorStateProps): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive-subtle px-6 py-12 text-center">
      <h2 className="type-section-title">{title}</h2>
      <p className="type-body max-w-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
