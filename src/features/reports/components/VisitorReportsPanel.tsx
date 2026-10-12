import { useMemo, useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip } from '@/components/data/FilterBar'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { currentMonthRange, todayIso, type CountRow } from '@/features/reports/lib/summaries'
import type { Visitor, VisitorAnalyticsQuery } from '@/features/visitors/api/visitors.api'
import { useVisitorAnalytics } from '@/features/visitors/hooks/useVisitors'
import { displayValue, formatDateTime } from '@/lib/format'

const PAGE_SIZE = 12

function mapCounts(value: Record<string, number> | undefined): CountRow[] {
  if (!value) return []
  return Object.entries(value)
    .map(([label, count]) => ({ label, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function VisitorReportsPanel(): ReactNode {
  const [page, setPage] = useState(1)
  const [windowMode, setWindowMode] = useState<'day' | 'month' | 'range'>('month')
  const [day, setDay] = useState(todayIso())
  const [month, setMonth] = useState(todayIso().slice(0, 7))
  const initialRange = currentMonthRange()
  const [startDate, setStartDate] = useState(initialRange.start)
  const [endDate, setEndDate] = useState(initialRange.end)

  const query = useMemo<VisitorAnalyticsQuery>(() => {
    const next: VisitorAnalyticsQuery = { page: page - 1, size: PAGE_SIZE }
    if (windowMode === 'day' && day) next.day = day
    if (windowMode === 'month' && month) next.month = month
    if (windowMode === 'range') {
      if (startDate) next.startDate = startDate
      if (endDate) next.endDate = endDate
    }
    return next
  }, [day, endDate, month, page, startDate, windowMode])

  const report = useVisitorAnalytics(query)
  const summary = report.data?.summary
  const rows = report.data?.visitors.content ?? []
  const total = report.data?.visitors.totalElements ?? 0

  const columns: Array<DataColumn<Visitor>> = [
    { id: 'name', header: 'Visitor', cell: (row) => row.fullName },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'IN' ? 'success' : 'neutral'}>{displayValue(row.status)}</Badge>
      ),
    },
    { id: 'campus', header: 'Campus', hideOnMobile: true, cell: (row) => displayValue(row.campusName) },
    { id: 'purpose', header: 'Purpose', hideOnMobile: true, cell: (row) => displayValue(row.purposeName) },
    { id: 'in', header: 'Check-in', cell: (row) => formatDateTime(row.checkInTime) },
    { id: 'stay', header: 'Stay', hideOnMobile: true, cell: (row) => displayValue(row.stayDuration) },
  ]

  if (report.isError) {
    return <ErrorState message={toUserMessage(report.error)} onRetry={() => void report.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Visitor activity"
        note="Totals come from GET /api/visitors/report/analytics. With no dates the server uses today. On-site counts only visits inside the selected window."
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['day', 'Day'],
                ['month', 'Month'],
                ['range', 'Range'],
              ] as const
            ).map(([value, label]) => (
              <FilterChip
                key={value}
                label={label}
                active={windowMode === value}
                onClick={() => {
                  setWindowMode(value)
                  setPage(1)
                }}
              />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
            {windowMode === 'day' ? (
              <TextField
                label="Day"
                type="date"
                value={day}
                onChange={(event) => {
                  setDay(event.target.value)
                  setPage(1)
                }}
              />
            ) : null}
            {windowMode === 'month' ? (
              <TextField
                label="Month"
                type="month"
                value={month}
                onChange={(event) => {
                  setMonth(event.target.value)
                  setPage(1)
                }}
              />
            ) : null}
            {windowMode === 'range' ? (
              <>
                <TextField
                  label="From"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value)
                    setPage(1)
                  }}
                />
                <TextField
                  label="To"
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value)
                    setPage(1)
                  }}
                />
              </>
            ) : null}
          </div>
        </div>
        <StatGrid
          items={[
            { label: 'Visits', value: (summary?.totalVisits ?? 0).toLocaleString(), hint: 'In the selected window' },
            { label: 'Unique visitors', value: (summary?.uniqueVisitors ?? 0).toLocaleString(), hint: 'Distinct names in the window' },
            { label: 'On premises', value: (summary?.onPremisesNow ?? 0).toLocaleString(), hint: 'Still checked in during the window' },
            {
              label: 'Window',
              value: summary?.windowStart ? formatDateTime(summary.windowStart) : '—',
              hint: summary?.windowEnd ? `Through ${formatDateTime(summary.windowEnd)}` : 'Server date window',
            },
          ]}
          loading={report.isLoading}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="By campus"
            rows={mapCounts(summary?.visitsByCampus)}
            empty="No campus visits in this window."
            loading={report.isLoading}
          />
          <BreakdownCard
            title="By department"
            rows={mapCounts(summary?.visitsByDepartment)}
            empty="No department visits in this window."
            loading={report.isLoading}
          />
          <BreakdownCard
            title="Most visited staff"
            rows={mapCounts(summary?.topVisitedStaff)}
            empty="No staff visits in this window."
            loading={report.isLoading}
          />
        </div>
      </ReportSection>

      <ReportSection title="Visits in this window">
        {total === 0 && !report.isLoading ? (
          <EmptyState title="No visitors in this window" description="Choose a wider date range to see earlier check-ins." />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            isLoading={report.isLoading}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            mobileCard={(row) => (
              <div>
                <p className="type-heading">{row.fullName}</p>
                <p className="type-caption text-muted-foreground">
                  {displayValue(row.status)} · {formatDateTime(row.checkInTime)}
                </p>
              </div>
            )}
          />
        )}
      </ReportSection>
    </div>
  )
}
