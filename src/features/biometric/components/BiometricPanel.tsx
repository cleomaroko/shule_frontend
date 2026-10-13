import { useMemo, useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip, SearchField } from '@/components/data/FilterBar'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { BiometricFilterQuery, BiometricPunchView } from '@/features/biometric/api/biometric.api'
import { useBiometricFilter, useBiometricSummary } from '@/features/biometric/hooks/useBiometric'
import { currentMonthRange, todayIso } from '@/features/reports/lib/summaries'
import { displayValue, formatDateTime } from '@/lib/format'

const PAGE_SIZE = 10

function punchLabel(state: string | null): string {
  if (state === 'CHECK_IN') return 'Check in'
  if (state === 'CHECK_OUT') return 'Check out'
  return 'Punch'
}

function punchBadge(state: string | null): 'success' | 'neutral' | 'warning' {
  if (state === 'CHECK_IN') return 'success'
  if (state === 'CHECK_OUT') return 'neutral'
  return 'warning'
}

export function BiometricPanel(): ReactNode {
  const [windowMode, setWindowMode] = useState<'day' | 'range'>('day')
  const [day, setDay] = useState(todayIso())
  const initialRange = currentMonthRange()
  const [startDate, setStartDate] = useState(initialRange.start)
  const [endDate, setEndDate] = useState(initialRange.end)
  const [state, setState] = useState<'all' | 'CHECK_IN' | 'CHECK_OUT'>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filterQuery = useMemo<BiometricFilterQuery>(() => {
    const next: BiometricFilterQuery = { page: page - 1, size: PAGE_SIZE }
    const needle = query.trim()
    if (needle) next.query = needle
    if (state !== 'all') next.state = state
    if (windowMode === 'day' && day) next.date = day
    if (windowMode === 'range') {
      if (startDate) next.startDate = startDate
      if (endDate) next.endDate = endDate
    }
    return next
  }, [day, endDate, page, query, startDate, state, windowMode])

  const summary = useBiometricSummary(day, windowMode === 'day')
  const list = useBiometricFilter(filterQuery)
  const rows = list.data?.content ?? []
  const total = list.data?.totalElements ?? 0

  const columns: Array<DataColumn<BiometricPunchView>> = [
    {
      id: 'person',
      header: 'Person',
      cell: (row) => (
        <span>
          <span className="block font-medium">{displayValue(row.personName)}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.empCode)}</span>
        </span>
      ),
    },
    { id: 'time', header: 'Time', cell: (row) => formatDateTime(row.punchTime) },
    {
      id: 'state',
      header: 'Type',
      cell: (row) => <Badge variant={punchBadge(row.punchState)}>{punchLabel(row.punchState)}</Badge>,
    },
    { id: 'device', header: 'Device', hideOnMobile: true, cell: (row) => displayValue(row.terminalSn) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Staff punches from the biometric devices. This is separate from the learner class register. A single day
        uses that date; a range hides the day summary.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          placeholder="Name or employee code…"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="Day"
          active={windowMode === 'day'}
          onClick={() => {
            setWindowMode('day')
            setPage(1)
          }}
        />
        <FilterChip
          label="Range"
          active={windowMode === 'range'}
          onClick={() => {
            setWindowMode('range')
            setPage(1)
          }}
        />
        {(
          [
            ['all', 'All'],
            ['CHECK_IN', 'Check in'],
            ['CHECK_OUT', 'Check out'],
          ] as const
        ).map(([value, label]) => (
          <FilterChip
            key={value}
            label={label}
            active={state === value}
            onClick={() => {
              setState(value)
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
        ) : (
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
        )}
      </div>
      {windowMode === 'day' ? <SummaryCards summary={summary.data} loading={summary.isLoading} error={summary.isError ? summary.error : null} onRetry={() => void summary.refetch()} /> : null}
      {list.isError ? (
        <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
      ) : total === 0 && !list.isLoading ? (
        <EmptyState title="No punches in this window" description="Device punches appear here after the school sync sends them." />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div>
              <p className="type-heading">{displayValue(row.personName)}</p>
              <p className="type-caption text-muted-foreground">
                {[punchLabel(row.punchState), formatDateTime(row.punchTime), row.empCode].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
        />
      )}
    </div>
  )
}

function SummaryCards({
  summary,
  loading,
  error,
  onRetry,
}: {
  summary: { totalPunches: number; uniquePeoplePunched: number; totalCheckIns: number; totalCheckOuts: number } | null | undefined
  loading: boolean
  error: unknown
  onRetry: () => void
}): ReactNode {
  if (error) {
    return <ErrorState message={toUserMessage(error)} onRetry={onRetry} />
  }
  const items = [
    { label: 'Punches', value: summary?.totalPunches ?? 0, hint: 'On this day' },
    { label: 'People', value: summary?.uniquePeoplePunched ?? 0, hint: 'Distinct employee codes' },
    { label: 'Check-ins', value: summary?.totalCheckIns ?? 0, hint: 'Arrivals' },
    { label: 'Check-outs', value: summary?.totalCheckOuts ?? 0, hint: 'Departures' },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="rounded-xl">
          <CardContent className="p-4">
            <p className="type-caption font-medium text-muted-foreground">{item.label}</p>
            {loading ? <Skeleton className="mt-2 h-7 w-16" /> : <p className="type-page-title mt-1">{item.value.toLocaleString()}</p>}
            <p className="type-caption mt-1 text-muted-foreground">{item.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
