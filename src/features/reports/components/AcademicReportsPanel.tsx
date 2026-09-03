import { useMemo, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { useAssignmentList, useClassList, useLearningAreaList } from '@/features/academic/hooks/useAcademic'
import {
  assignmentIsClassTeacher,
  type SchoolClass,
  type TeacherAssignment,
} from '@/features/academic/types/academic.types'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy } from '@/features/reports/lib/summaries'
import { formatClassLabel, formatPersonName } from '@/lib/format'

function classKey(schoolClass: SchoolClass | null | undefined): string {
  if (!schoolClass) return 'Not set'
  return formatClassLabel(schoolClass)
}

export function AcademicReportsPanel(): ReactNode {
  const classes = useClassList()
  const subjects = useLearningAreaList()
  const assignments = useAssignmentList()

  const assignmentRows = assignments.data ?? []
  const classRows = classes.data ?? []

  const uncovered = useMemo(() => {
    const assigned = new Set(
      assignmentRows.map((row) => row.schoolClass?.id).filter((id): id is number => typeof id === 'number'),
    )
    return classRows.filter((row) => !assigned.has(row.id))
  }, [assignmentRows, classRows])

  const classTeachers = useMemo(
    () => assignmentRows.filter((row) => assignmentIsClassTeacher(row)),
    [assignmentRows],
  )

  const teacherColumns: Array<DataColumn<TeacherAssignment>> = [
    {
      id: 'teacher',
      header: 'Teacher',
      cell: (row) => (row.teacher ? formatPersonName(row.teacher) : '—'),
    },
    {
      id: 'class',
      header: 'Class',
      cell: (row) => classKey(row.schoolClass),
    },
    {
      id: 'stream',
      header: 'Stream',
      cell: (row) => row.stream?.name?.trim() || '—',
    },
    {
      id: 'subject',
      header: 'Learning area',
      cell: (row) => row.subject?.name?.trim() || '—',
    },
  ]

  if (assignments.isError) {
    return <ErrorState message={toUserMessage(assignments.error)} onRetry={() => void assignments.refetch()} />
  }
  if (classes.isError) {
    return <ErrorState message={toUserMessage(classes.error)} onRetry={() => void classes.refetch()} />
  }
  if (subjects.isError) {
    return <ErrorState message={toUserMessage(subjects.error)} onRetry={() => void subjects.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Teacher assignments"
        note="Coverage is counted from GET /api/academic/assignments. There is no exam or timetable report API."
      >
        <StatGrid
          items={[
            { label: 'Assignments', value: assignmentRows.length.toLocaleString(), hint: 'Teacher–class–subject rows' },
            { label: 'Classes', value: classRows.length.toLocaleString(), hint: 'From GET /api/academic/classes' },
            {
              label: 'Without a teacher',
              value: uncovered.length.toLocaleString(),
              hint: 'Classes that do not appear on any assignment',
            },
            {
              label: 'Class teachers',
              value: classTeachers.length.toLocaleString(),
              hint: 'Assignments marked as class teacher',
            },
          ]}
          loading={assignments.isLoading || classes.isLoading}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="Assignments by class"
            rows={countBy(assignmentRows, (row) => classKey(row.schoolClass))}
            empty="No assignments yet."
            loading={assignments.isLoading}
          />
          <BreakdownCard
            title="Assignments by learning area"
            rows={countBy(assignmentRows, (row) => row.subject?.name)}
            empty="No assignments yet."
            loading={assignments.isLoading}
          />
          <BreakdownCard
            title="Learning areas by group"
            rows={countBy(subjects.data ?? [], (row) => row.subjectGroup)}
            empty="No learning areas yet."
            loading={subjects.isLoading}
          />
        </div>
      </ReportSection>

      <ReportSection title="Classes without a teacher assignment">
        {uncovered.length === 0 && !classes.isLoading && !assignments.isLoading ? (
          <EmptyState
            title="Every class has an assignment"
            description="Each class from GET /api/academic/classes appears on at least one teacher assignment."
          />
        ) : (
          <DataTable
            columns={[
              { id: 'class', header: 'Class', cell: (row: SchoolClass) => formatClassLabel(row) },
              {
                id: 'streams',
                header: 'Streams',
                cell: (row: SchoolClass) =>
                  (row.streams ?? []).map((stream) => stream.name).join(', ') || '—',
              },
            ]}
            rows={uncovered}
            getRowId={(row) => row.id}
            isLoading={classes.isLoading || assignments.isLoading}
            page={1}
            pageSize={Math.max(uncovered.length, 1)}
            total={uncovered.length}
            onPageChange={() => undefined}
            mobileCard={(row) => <p className="type-heading">{formatClassLabel(row)}</p>}
          />
        )}
      </ReportSection>

      <ReportSection title="Class teachers">
        {classTeachers.length === 0 && !assignments.isLoading ? (
          <EmptyState
            title="No class teachers marked"
            description="Assignments with the class-teacher flag will appear here."
          />
        ) : (
          <DataTable
            columns={teacherColumns}
            rows={classTeachers}
            getRowId={(row) => row.id}
            isLoading={assignments.isLoading}
            page={1}
            pageSize={Math.max(classTeachers.length, 1)}
            total={classTeachers.length}
            onPageChange={() => undefined}
            mobileCard={(row) => (
              <div>
                <p className="type-heading">{row.teacher ? formatPersonName(row.teacher) : '—'}</p>
                <p className="type-caption text-muted-foreground">{classKey(row.schoolClass)}</p>
              </div>
            )}
          />
        )}
      </ReportSection>
    </div>
  )
}
