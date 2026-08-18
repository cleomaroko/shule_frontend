import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}): ReactNode {
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-5 shadow-subtle sm:p-6', className)}>
      <header className="mb-5">
        <h2 className="type-section-title">{title}</h2>
        {description ? <p className="type-caption mt-1 text-muted-foreground">{description}</p> : null}
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function ProfileSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}): ReactNode {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-subtle">
      <h2 className="type-heading border-b border-border px-5 py-3.5 sm:px-6">{title}</h2>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  )
}

export function ProfileField({
  label,
  value,
}: {
  label: string
  value: ReactNode
}): ReactNode {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-start sm:gap-6 sm:px-6">
      <dt className="type-label w-44 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="type-body min-w-0 break-words font-medium">{value}</dd>
    </div>
  )
}
