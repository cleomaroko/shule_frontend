import { useMemo, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { useAttendanceReport } from '@/features/attendance/hooks/useAttendance'
import { isPresent } from '@/features/attendance/types/attendance.types'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy } from '@/features/reports/lib/summaries'
import { formatClassLabel, todayIso } from '@/lib/format'

export function AttendanceReportsPanel(): ReactNode {
  const today = useAttendanceReport({ date: todayIso() })
  const all = useAttendanceReport()
  const rows = today.data ?? []
  const history = all.data ?? []
  const present = rows.filter(isPresent).length
  const absent = rows.length - present

  const byClass = useMemo(
    () => countBy(history, (row) => (row.schoolClass ? formatClassLabel(row.schoolClass) : null)),
    [history],
  )

  if (today.isError) {
    return <ErrorState message={toUserMessage(today.error)} onRetry={() => void today.refetch()} />
  }
  if (all.isError) {
    return <ErrorState message={toUserMessage(all.error)} onRetry={() => void all.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Today’s register"
        note="From GET /api/attendance/report?date=YYYY-MM-DD using today’s date. Year and term are not filter parameters on this endpoint."
      >
        <StatGrid
          items={[
            { label: 'Marked today', value: rows.length.toLocaleString(), hint: 'Rows for today’s date' },
            { label: 'Present', value: present.toLocaleString() },
            { label: 'Absent', value: absent.toLocaleString() },
            { label: 'All records', value: history.length.toLocaleString(), hint: 'Unfiltered report' },
          ]}
          loading={today.isLoading || all.isLoading}
        />
      </ReportSection>
      <ReportSection title="History by class">
        {history.length === 0 && !all.isLoading ? (
          <EmptyState title="No attendance yet" description="Mark a register to populate this breakdown." />
        ) : (
          <BreakdownCard title="Records by class" rows={byClass} empty="No attendance yet." loading={all.isLoading} />
        )}
      </ReportSection>
    </div>
  )
}
