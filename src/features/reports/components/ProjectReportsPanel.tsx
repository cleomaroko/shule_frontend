import { useMemo, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { ErrorState } from '@/components/feedback/PageStates'
import { useProjectList } from '@/features/projects/hooks/useProjects'
import { projectStatusLabel } from '@/features/projects/types/project.types'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy } from '@/features/reports/lib/summaries'
import { asMoney, formatKes } from '@/lib/format'

export function ProjectReportsPanel(): ReactNode {
  const projects = useProjectList()
  const rows = projects.data ?? []
  const byStatus = useMemo(() => countBy(rows, (item) => projectStatusLabel(item.status)), [rows])
  const byDept = useMemo(() => countBy(rows, (item) => item.department?.name), [rows])
  const budget = rows.reduce((sum, item) => sum + asMoney(item.totalBudget), 0)

  if (projects.isError) {
    return <ErrorState message={toUserMessage(projects.error)} onRetry={() => void projects.refetch()} />
  }

  return (
    <ReportSection
      title="Projects"
      note="GET /api/projects is a raw list. Spend versus remaining is fetched per project on the Projects page."
    >
      <StatGrid
        loading={projects.isLoading}
        items={[
          { label: 'Projects', value: String(rows.length) },
          { label: 'Allocated budget', value: formatKes(budget) },
          {
            label: 'In progress',
            value: String(rows.filter((item) => item.status === 'IN_PROGRESS').length),
          },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard title="Status" rows={byStatus} empty="No projects" loading={projects.isLoading} />
        <BreakdownCard title="Department" rows={byDept} empty="No projects" loading={projects.isLoading} />
      </div>
    </ReportSection>
  )
}
