import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { CountRow } from '@/features/reports/lib/summaries'

export function ReportSection({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: ReactNode
}): ReactNode {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="type-section-title">{title}</h2>
        {note ? <p className="type-caption mt-1 text-muted-foreground">{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function StatGrid({
  items,
  loading = false,
}: {
  items: Array<{ label: string; value: string; hint?: string }>
  loading?: boolean
}): ReactNode {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="rounded-xl">
          <CardContent className="p-4">
            <p className="type-caption font-medium text-muted-foreground">{item.label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <p className="type-page-title mt-1 truncate">{item.value}</p>
            )}
            {item.hint ? <p className="type-caption mt-1 text-muted-foreground">{item.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function BreakdownCard({
  title,
  rows,
  empty,
  loading = false,
}: {
  title: string
  rows: CountRow[]
  empty: string
  loading?: boolean
}): ReactNode {
  const max = Math.max(...rows.map((row) => row.count), 1)

  return (
    <Card className="rounded-xl">
      <CardHeader className="p-5 pb-2">
        <CardTitle className="type-heading">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <p className="type-caption py-4 text-muted-foreground">{empty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.label} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="type-label truncate">{row.label}</span>
                  <span className="type-caption shrink-0 text-muted-foreground">{row.count.toLocaleString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max((row.count / max) * 100, 4)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
