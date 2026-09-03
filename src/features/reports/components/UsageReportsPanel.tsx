import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportSection } from '@/features/reports/components/ReportPrimitives'
import { AnalyticsPanel } from '@/features/system/components/AnalyticsPanel'
import { useEmailUsage } from '@/features/system/hooks/useSystem'

export function UsageReportsPanel(): ReactNode {
  const { user } = useAuth()
  const canAnalytics = can(user?.role, 'system:analytics')
  const isSuper = can(user?.role, 'system:super')

  if (!canAnalytics && !isSuper) {
    return (
      <EmptyState
        title="Usage reports are restricted"
        description="Module usage needs an IT administrator or super administrator role. Email quota is super administrator only."
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {canAnalytics ? (
        <ReportSection
          title="Module usage"
          note="GET /api/system/analytics. Share of audit-log actions by module. Restricted to IT administrators and super administrators."
        >
          <AnalyticsPanel />
        </ReportSection>
      ) : null}
      {isSuper ? (
        <ReportSection title="Email quota" note="GET /api/system/email-usage. Super administrator only.">
          <EmailUsageCard />
        </ReportSection>
      ) : null}
    </div>
  )
}

function EmailUsageCard(): ReactNode {
  const usage = useEmailUsage(true)

  if (usage.isError) {
    return <ErrorState message={toUserMessage(usage.error)} onRetry={() => void usage.refetch()} />
  }

  const sent = usage.data?.sentToday ?? 0
  const limit = usage.data?.dailyLimit ?? 500
  const remaining = usage.data?.remaining ?? 0

  return (
    <Card className="rounded-xl sm:max-w-md">
      <CardHeader className="p-5 pb-2">
        <CardTitle className="type-heading">Email usage today</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 p-5 pt-3">
        {usage.isLoading ? (
          <>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </>
        ) : (
          <>
            <UsageRow label="Sent today" value={String(sent)} />
            <UsageRow label="Daily limit" value={String(limit)} />
            <UsageRow label="Remaining" value={String(remaining)} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function UsageRow({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="type-label text-muted-foreground">{label}</span>
      <span className="type-heading">{value}</span>
    </div>
  )
}
