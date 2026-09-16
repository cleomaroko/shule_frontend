import { useMemo, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy } from '@/features/reports/lib/summaries'
import { useSowReport } from '@/features/sow/hooks/useSow'
import { formatClassLabel, formatPersonName } from '@/lib/format'

export function SchemeReportsPanel(): ReactNode {
  const list = useSowReport()
  const rows = list.data ?? []

  const bySubject = useMemo(() => countBy(rows, (row) => row.subject?.name), [rows])
  const byClass = useMemo(
    () => countBy(rows, (row) => (row.schoolClass ? formatClassLabel(row.schoolClass) : null)),
    [rows],
  )
  const byTeacher = useMemo(
    () => countBy(rows, (row) => (row.teacher ? formatPersonName(row.teacher) : null)),
    [rows],
  )

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Schemes of work"
        note="Unfiltered GET /api/sow/report. The controller applies only one query filter at a time on the Schemes page."
      >
        <StatGrid
          items={[{ label: 'Schemes', value: rows.length.toLocaleString(), hint: 'Document links on file' }]}
          loading={list.isLoading}
        />
        {rows.length === 0 && !list.isLoading ? (
          <EmptyState title="No schemes uploaded" description="Teachers upload an HTTPS link from the Schemes of work module." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownCard title="By learning area" rows={bySubject} empty="No schemes yet." loading={list.isLoading} />
            <BreakdownCard title="By class" rows={byClass} empty="No schemes yet." loading={list.isLoading} />
            <BreakdownCard title="By teacher" rows={byTeacher} empty="No schemes yet." loading={list.isLoading} />
          </div>
        )}
      </ReportSection>
    </div>
  )
}
