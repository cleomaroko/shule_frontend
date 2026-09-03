import { useMemo, useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { Badge } from '@/components/ui/badge'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import {
  average,
  checkInHourLabel,
  countBy,
  formatStayMinutes,
  parseStayMinutes,
} from '@/features/reports/lib/summaries'
import { useVisitorList } from '@/features/visitors/hooks/useVisitors'
import type { Visitor } from '@/features/visitors/api/visitors.api'
import { displayValue, formatDateTime } from '@/lib/format'

const PAGE_SIZE = 12

function isOnSite(visitor: Visitor): boolean {
  return (visitor.status ?? '').trim().toUpperCase() === 'IN'
}

export function VisitorReportsPanel(): ReactNode {
  const list = useVisitorList()
  const [page, setPage] = useState(1)
  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const summary = useMemo(() => {
    const onSite = rows.filter(isOnSite)
    const stays = rows
      .map((row) => parseStayMinutes(row.stayDuration))
      .filter((value): value is number => value != null)
    const mean = average(stays)
    return {
      onSite: onSite.length,
      out: rows.length - onSite.length,
      meanLabel: mean == null ? '—' : formatStayMinutes(mean),
      stayCount: stays.length,
    }
  }, [rows])

  const hourRows = useMemo(
    () => countBy(rows, (row) => checkInHourLabel(row.checkInTime)),
    [rows],
  )

  const columns: Array<DataColumn<Visitor>> = [
    { id: 'name', header: 'Visitor', cell: (row) => row.fullName },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={isOnSite(row) ? 'success' : 'neutral'}>{displayValue(row.status)}</Badge>
      ),
    },
    { id: 'campus', header: 'Campus', cell: (row) => displayValue(row.campusName ?? row.campus?.name) },
    { id: 'purpose', header: 'Purpose', cell: (row) => displayValue(row.purposeName ?? row.purpose?.name) },
    { id: 'in', header: 'Check-in', cell: (row) => formatDateTime(row.checkInTime) },
    { id: 'stay', header: 'Stay', cell: (row) => displayValue(row.stayDuration) },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Visitor activity"
        note="Average stay and busiest hours are calculated in the browser from GET /api/visitors. stayDuration is filled after check-out."
      >
        <StatGrid
          items={[
            { label: 'Records', value: rows.length.toLocaleString(), hint: 'All visitor log rows' },
            { label: 'On site', value: summary.onSite.toLocaleString(), hint: 'Status IN' },
            { label: 'Checked out', value: summary.out.toLocaleString(), hint: 'Not currently IN' },
            {
              label: 'Average stay',
              value: summary.meanLabel,
              hint:
                summary.stayCount === 0
                  ? 'No checked-out stays yet'
                  : `From ${summary.stayCount.toLocaleString()} completed visits`,
            },
          ]}
          loading={list.isLoading}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="Busiest check-in hours"
            rows={hourRows}
            empty="No check-in times recorded."
            loading={list.isLoading}
          />
          <BreakdownCard
            title="By campus"
            rows={countBy(rows, (row) => row.campusName ?? row.campus?.name)}
            empty="No visitor records yet."
            loading={list.isLoading}
          />
          <BreakdownCard
            title="By purpose"
            rows={countBy(rows, (row) => row.purposeName ?? row.purpose?.name)}
            empty="No visitor records yet."
            loading={list.isLoading}
          />
          <BreakdownCard
            title="By category"
            rows={countBy(rows, (row) => row.categoryName ?? row.category?.name)}
            empty="No visitor records yet."
            loading={list.isLoading}
          />
        </div>
      </ReportSection>

      <ReportSection title="Visitor log">
        {rows.length === 0 && !list.isLoading ? (
          <EmptyState title="No visitors yet" description="Check-ins will appear here after they are recorded." />
        ) : (
          <DataTable
            columns={columns}
            rows={paged}
            getRowId={(row) => row.id}
            isLoading={list.isLoading}
            page={page}
            pageSize={PAGE_SIZE}
            total={rows.length}
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
