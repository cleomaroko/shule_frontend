import { useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { academicTermLabel } from '@/features/academic/types/academic.types'
import { useAcademicTermList, useClassList } from '@/features/academic/hooks/useAcademic'
import { useExamTypeList, useGradingScaleList, usePathwayDistribution } from '@/features/exams/hooks/useExams'
import { examTypeIncludedInFinal } from '@/features/exams/types/exam.types'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { formatClassLabel } from '@/lib/format'

export function ExamReportsPanel(): ReactNode {
  const types = useExamTypeList()
  const scales = useGradingScaleList()
  const classes = useClassList()
  const terms = useAcademicTermList()
  const [classId, setClassId] = useState('')
  const [termId, setTermId] = useState('')
  const distribution = usePathwayDistribution(classId ? Number(classId) : null, termId ? Number(termId) : null)
  const included = (types.data ?? []).filter(examTypeIncludedInFinal).length
  const entries = Object.entries(distribution.data ?? {}).map(([label, count]) => ({
    label,
    count: Number(count) || 0,
  }))

  if (types.isError) {
    return <ErrorState message={toUserMessage(types.error)} onRetry={() => void types.refetch()} />
  }
  if (scales.isError) {
    return <ErrorState message={toUserMessage(scales.error)} onRetry={() => void scales.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Exam setup"
        note="Types from GET /api/exams/types and bands from GET /api/exams/grading. There is no list-all-marks endpoint."
      >
        <StatGrid
          items={[
            { label: 'Exam types', value: (types.data ?? []).length.toLocaleString() },
            { label: 'Count in final', value: included.toLocaleString() },
            { label: 'Grading bands', value: (scales.data ?? []).length.toLocaleString() },
          ]}
          loading={types.isLoading || scales.isLoading}
        />
      </ReportSection>
      <ReportSection
        title="Pathway distribution"
        note="GET /api/exams/report/pathway-distribution requires classId and termId. Learner analysis lives on the Exams page."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Class"
            value={classId}
            onChange={setClassId}
            options={(classes.data ?? []).map((item) => ({ value: String(item.id), label: formatClassLabel(item) }))}
            allowEmpty={false}
            placeholder="Select class"
          />
          <SelectField
            label="Term"
            value={termId}
            onChange={setTermId}
            options={(terms.data ?? []).map((item) => ({ value: String(item.id), label: academicTermLabel(item) }))}
            allowEmpty={false}
            placeholder="Select term"
          />
        </div>
        {!classId || !termId ? (
          <EmptyState title="Select class and term" description="Pathway counts are not available without both filters." />
        ) : distribution.isError ? (
          <ErrorState message={toUserMessage(distribution.error)} onRetry={() => void distribution.refetch()} />
        ) : (
          <BreakdownCard
            title="Learners by pathway"
            rows={entries}
            empty="No pathway counts returned for this class and term."
            loading={distribution.isLoading}
          />
        )}
      </ReportSection>
    </div>
  )
}
