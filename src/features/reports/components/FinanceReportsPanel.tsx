import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useFinanceSummary } from '@/features/finance/hooks/useFinance'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { asMoney, formatKes } from '@/lib/format'
import { paths } from '@/routes/paths'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function FinanceReportsPanel(): ReactNode {
  const { user } = useAuth()
  const canFinance = can(user?.role, 'finance:access')
  const summary = useFinanceSummary(canFinance)

  if (!canFinance) {
    return (
      <EmptyState
        title="Finance access required"
        description="GET /api/finance/reports/summary is declined without finance access. Fee balances are checked per learner on the Fees page."
        actionLabel="Open fees"
        actionTo={paths.fees}
      />
    )
  }

  if (summary.isError) {
    return <ErrorState message={toUserMessage(summary.error)} onRetry={() => void summary.refetch()} />
  }

  const commitments = asMoney(summary.data?.totalApprovedCommitments)
  const outflow = asMoney(summary.data?.totalCashOutflow)
  const pending = asMoney(summary.data?.pendingPayments)

  return (
    <ReportSection
      title="Finance summary"
      note="From GET /api/finance/reports/summary. There is no fee-structure or fee-transaction list endpoint."
    >
      <StatGrid
        loading={summary.isLoading}
        items={[
          { label: 'Approved commitments', value: formatKes(commitments) },
          { label: 'Cash outflow', value: formatKes(outflow) },
          { label: 'Pending payments', value: formatKes(pending) },
        ]}
      />
      <BreakdownCard
        title="Share of cash versus commitments"
        empty="No finance figures yet"
        loading={summary.isLoading}
        rows={[
          { label: 'Paid', count: outflow },
          { label: 'Still pending', count: pending },
        ]}
      />
      <Alert>
        <AlertTitle>Fees</AlertTitle>
        <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>Learner balances use GET /api/finance/fees/balance/{'{id}'} (term 1). Payments are recorded on the Fees page.</span>
          <Button asChild variant="secondary" size="sm">
            <Link to={paths.fees}>Open fees</Link>
          </Button>
        </AlertDescription>
      </Alert>
    </ReportSection>
  )
}
