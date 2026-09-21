import { useMemo, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { ErrorState } from '@/components/feedback/PageStates'
import { useFormTemplates } from '@/features/forms/hooks/useForms'
import { parseFieldDefinitions } from '@/features/forms/types/form.types'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy } from '@/features/reports/lib/summaries'

export function FormReportsPanel(): ReactNode {
  const templates = useFormTemplates()

  const fieldCounts = useMemo(
    () =>
      countBy(templates.data ?? [], (item) => {
        const n = parseFieldDefinitions(item.fieldDefinitions).length
        if (n === 0) return 'No fields'
        if (n <= 3) return '1–3 fields'
        if (n <= 6) return '4–6 fields'
        return '7+ fields'
      }),
    [templates.data],
  )

  if (templates.isError) {
    return <ErrorState message={toUserMessage(templates.error)} onRetry={() => void templates.refetch()} />
  }

  return (
    <ReportSection title="Forms" note="Template list from GET /api/forms/templates. Response counts are per-template on the Forms page.">
      <StatGrid
        loading={templates.isLoading}
        items={[
          { label: 'Templates', value: String(templates.data?.length ?? 0) },
          {
            label: 'Total fields defined',
            value: String(
              (templates.data ?? []).reduce((sum, item) => sum + parseFieldDefinitions(item.fieldDefinitions).length, 0),
            ),
          },
        ]}
      />
      <BreakdownCard title="Field count bands" rows={fieldCounts} empty="No templates yet" loading={templates.isLoading} />
    </ReportSection>
  )
}
