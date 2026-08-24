import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSystemAnalytics } from '@/features/system/hooks/useSystem'
import {
  analyticsSlices,
  formatPercent,
  type AnalyticsSlice,
} from '@/features/system/types/system.types'

export function AnalyticsPanel(): ReactNode {
  const query = useSystemAnalytics(true)

  if (query.isError) {
    return <ErrorState message={toUserMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  if (query.isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  const slices = analyticsSlices(query.data)
  const total = query.data?.totalActions ?? 0

  if (slices.length === 0) {
    return (
      <EmptyState
        title="No usage data yet"
        description="Module usage is calculated from system audit logs. It will appear after staff, learners, assets, stores, or academics are changed."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Share of audit-log actions by module. Unclassified actions (zones, transport, and similar) are grouped as
        Other. Percentages are of all logged actions, so the listed modules may not add up to 100% on their own.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="type-section-title">Total actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="type-page-title">{total.toLocaleString()}</p>
          <p className="type-caption mt-1 text-muted-foreground">Counted from the system audit log.</p>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="type-section-title">Usage mix</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
            <UsagePie slices={slices} />
            <UsageLegend slices={slices} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="type-section-title">Usage by module</CardTitle>
          </CardHeader>
          <CardContent>
            <UsageBars slices={slices} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function UsageLegend({ slices }: { slices: AnalyticsSlice[] }): ReactNode {
  return (
    <ul className="flex w-full flex-col gap-2 sm:max-w-56">
      {slices.map((slice) => (
        <li key={slice.name} className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="type-label truncate">{slice.name}</span>
          </span>
          <span className="type-caption shrink-0 text-muted-foreground">{formatPercent(slice.percent)}</span>
        </li>
      ))}
    </ul>
  )
}

function UsageBars({ slices }: { slices: AnalyticsSlice[] }): ReactNode {
  const max = Math.max(...slices.map((slice) => slice.count), 1)
  return (
    <ul className="flex flex-col gap-3">
      {slices.map((slice) => (
        <li key={slice.name} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="type-label">{slice.name}</span>
            <span className="type-caption text-muted-foreground">
              {slice.count.toLocaleString()} · {formatPercent(slice.percent)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((slice.count / max) * 100, 4)}%`, backgroundColor: slice.color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function UsagePie({ slices }: { slices: AnalyticsSlice[] }): ReactNode {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0)
  if (total <= 0) return null

  const cx = 80
  const cy = 80
  const r = 72
  let angle = 0
  const paths: ReactNode[] = []

  if (slices.length === 1) {
    const only = slices[0]
    if (only) paths.push(<circle key={only.name} cx={cx} cy={cy} r={r} fill={only.color} />)
  } else {
    for (const slice of slices) {
      const sweep = (slice.count / total) * 360
      const start = angle
      const end = angle + sweep
      paths.push(<path key={slice.name} d={pieSlice(cx, cy, r, start, end)} fill={slice.color} />)
      angle = end
    }
  }

  return (
    <svg viewBox="0 0 160 160" className="size-44 shrink-0 sm:size-52" role="img" aria-label="Module usage pie chart">
      {paths}
    </svg>
  )
}

function pieSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polar(cx, cy, r, endAngle)
  const end = polar(cx, cy, r, startAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`
}

function polar(cx: number, cy: number, r: number, angle: number): { x: number; y: number } {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
