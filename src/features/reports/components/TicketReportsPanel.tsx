import { useMemo, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { ErrorState } from '@/components/feedback/PageStates'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy } from '@/features/reports/lib/summaries'
import { useTicketList } from '@/features/tickets/hooks/useTickets'
import { ticketPriorityLabel, ticketStatusLabel } from '@/features/tickets/types/ticket.types'

export function TicketReportsPanel(): ReactNode {
  const tickets = useTicketList()
  const rows = tickets.data ?? []

  const byStatus = useMemo(() => countBy(rows, (item) => ticketStatusLabel(item.status)), [rows])
  const byPriority = useMemo(() => countBy(rows, (item) => ticketPriorityLabel(item.priority)), [rows])
  const byDept = useMemo(() => countBy(rows, (item) => item.targetDepartment?.name), [rows])

  if (tickets.isError) {
    return <ErrorState message={toUserMessage(tickets.error)} onRetry={() => void tickets.refetch()} />
  }

  return (
    <ReportSection title="Tickets" note="GET /api/tickets returns every ticket. There is no server-side filter.">
      <StatGrid
        loading={tickets.isLoading}
        items={[
          { label: 'All tickets', value: String(rows.length) },
          { label: 'Open', value: String(rows.filter((item) => item.status === 'OPEN').length) },
          { label: 'In progress', value: String(rows.filter((item) => item.status === 'IN_PROGRESS').length) },
          { label: 'Resolved or closed', value: String(rows.filter((item) => item.status === 'RESOLVED' || item.status === 'CLOSED').length) },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <BreakdownCard title="Status" rows={byStatus} empty="No tickets" loading={tickets.isLoading} />
        <BreakdownCard title="Priority" rows={byPriority} empty="No tickets" loading={tickets.isLoading} />
        <BreakdownCard title="Department" rows={byDept} empty="No tickets" loading={tickets.isLoading} />
      </div>
    </ReportSection>
  )
}
