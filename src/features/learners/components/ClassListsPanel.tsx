import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { SearchField } from '@/components/data/FilterBar'
import { ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { Badge } from '@/components/ui/badge'
import { useAcademicTermList, useAcademicYearList, useAssignmentList, useClassList, useStreamList } from '@/features/academic/hooks/useAcademic'
import {
  academicTermLabel,
  assignmentIsClassTeacher,
  calendarIsCurrent,
  formatAcademicYearDisplay,
  type AssignmentTeacher,
  type TeacherAssignment,
} from '@/features/academic/types/academic.types'
import { useCampuses } from '@/features/lookups/useLookups'
import type { Learner } from '@/features/learners/types/learner.types'
import { formatPersonName } from '@/lib/format'
import { paths } from '@/routes/paths'

const PAGE_SIZE = 10

export function ClassListsPanel({ learners, isLoading }: { learners: Learner[]; isLoading: boolean }): ReactNode {
  const campuses = useCampuses()
  const classes = useClassList()
  const streams = useStreamList()
  const assignments = useAssignmentList()
  const academicYears = useAcademicYearList()
  const terms = useAcademicTermList()

  const [search, setSearch] = useState('')
  const [campusId, setCampusId] = useState('all')
  const [className, setClassName] = useState('all')
  const [streamName, setStreamName] = useState('all')
  const [teacherId, setTeacherId] = useState('all')
  const [yearSelection, setYearSelection] = useState('current')
  const [termSelection, setTermSelection] = useState('current')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const currentYear = academicYears.data?.find(calendarIsCurrent)
  const currentTerm = terms.data?.find(calendarIsCurrent)
  const yearId = yearSelection === 'current' ? (currentYear ? String(currentYear.id) : 'all') : yearSelection
  const termId = termSelection === 'current' ? (currentTerm ? String(currentTerm.id) : 'all') : termSelection

  const classOptions = unique([
    ...learners.map((learner) => learner.currentClass || learner.admissionClass),
    ...(classes.data ?? []).map((schoolClass) => schoolClass.className),
  ])
  const streamOptions = unique([
    ...learners.map((learner) => learner.stream),
    ...(streams.data ?? []).map((stream) => stream.name),
  ])
  const statusOptions = unique(learners.map((learner) => learner.status))

  const scopedAssignments = useMemo(
    () => (assignments.data ?? []).filter((assignment) => {
      if (campusId !== 'all' && String(assignment.campus?.id ?? '') !== campusId) return false
      if (className !== 'all' && normalize(assignment.schoolClass?.className) !== normalize(className)) return false
      if (streamName !== 'all' && normalize(assignment.stream?.name) !== normalize(streamName)) return false
      if (yearId !== 'all' && String(assignment.academicYear?.id ?? '') !== yearId) return false
      if (termId !== 'all' && String(assignment.term?.id ?? '') !== termId) return false
      return true
    }),
    [assignments.data, campusId, className, streamName, yearId, termId],
  )

  const teacherOptions = useMemo(() => {
    const teachersById = new Map<number, AssignmentTeacher>()
    for (const assignment of scopedAssignments) {
      if (assignment.teacher) teachersById.set(assignment.teacher.id, assignment.teacher)
    }
    return [...teachersById.values()].sort((a, b) => teacherName(a).localeCompare(teacherName(b)))
  }, [scopedAssignments])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const selectedTeacherAssignments = teacherId === 'all'
      ? []
      : scopedAssignments.filter((assignment) => String(assignment.teacher?.id) === teacherId)

    return learners.filter((learner) => {
      const learnerClass = learner.currentClass || learner.admissionClass || ''
      if (campusId !== 'all' && String(learner.campus?.id ?? '') !== campusId) return false
      if (className !== 'all' && normalize(learnerClass) !== normalize(className)) return false
      if (streamName !== 'all' && normalize(learner.stream) !== normalize(streamName)) return false
      if (status !== 'all' && learner.status !== status) return false
      if (teacherId !== 'all' && !selectedTeacherAssignments.some((assignment) => matchesLearner(assignment, learner, learnerClass))) return false
      if (!needle) return true
      return [
        learner.firstName,
        learner.middleName,
        learner.lastName,
        learner.admissionNumber,
        learnerClass,
        learner.stream,
        learner.campus?.name,
        learner.phoneNumber,
        learner.guardianFirstName,
        learner.guardianLastName,
        learner.guardianPhone,
        learner.fatherFirstName,
        learner.fatherLastName,
        learner.fatherPhone,
        learner.motherFirstName,
        learner.motherLastName,
        learner.motherPhone,
      ].join(' ').toLowerCase().includes(needle)
    })
  }, [learners, search, campusId, className, streamName, status, teacherId, scopedAssignments])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const metadataError = campuses.error || classes.error || streams.error || assignments.error || academicYears.error || terms.error
  const loading = isLoading || campuses.isLoading || classes.isLoading || streams.isLoading || assignments.isLoading || academicYears.isLoading || terms.isLoading

  const resetPage = (update: () => void) => {
    update()
    setPage(1)
  }

  const columns: Array<DataColumn<Learner>> = [
    { id: 'learner', header: 'Learner', cell: (learner) => <Link className="font-medium hover:underline" to={paths.learnerDetail(learner.id)}>{formatPersonName(learner)}</Link> },
    { id: 'admission', header: 'Admission no.', cell: (learner) => learner.admissionNumber || '—' },
    { id: 'campus', header: 'Campus', cell: (learner) => learner.campus?.name || '—' },
    { id: 'class', header: 'Class / stream', cell: (learner) => [learner.currentClass || learner.admissionClass, learner.stream].filter(Boolean).join(' · ') || '—' },
    { id: 'teacher', header: 'Class teacher', cell: (learner) => classTeacherName(learner, scopedAssignments) },
    { id: 'guardian', header: 'Guardian', cell: (learner) => guardianName(learner), hideOnMobile: true },
    { id: 'contact', header: 'Primary contact', cell: (learner) => learner.phoneNumber || guardianPhone(learner), hideOnMobile: true },
    { id: 'gender', header: 'Gender', cell: (learner) => learner.gender || '—', hideOnMobile: true },
    { id: 'status', header: 'Status', cell: (learner) => <Badge variant={learner.status?.toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}>{learner.status || 'Unknown'}</Badge> },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SelectField
          label="Campus"
          value={campusId}
          onChange={(value) => resetPage(() => { setCampusId(value); setTeacherId('all') })}
          options={(campuses.data ?? []).map((campus) => ({ value: String(campus.id), label: campus.name }))}
          allowEmpty={false}
          emptyLabel="All campuses"
          emptyMessage="No campuses available."
        />
        <SelectField
          label="Class"
          value={className}
          onChange={(value) => resetPage(() => { setClassName(value); setTeacherId('all') })}
          options={classOptions.map((value) => ({ value, label: value }))}
          allowEmpty={false}
          emptyLabel="All classes"
          emptyMessage="No classes available."
        />
        <SelectField
          label="Stream"
          value={streamName}
          onChange={(value) => resetPage(() => { setStreamName(value); setTeacherId('all') })}
          options={streamOptions.map((value) => ({ value, label: value }))}
          allowEmpty={false}
          emptyLabel="All streams"
          emptyMessage="No streams available."
        />
        <SelectField
          label="Teacher"
          value={teacherId}
          onChange={(value) => resetPage(() => setTeacherId(value))}
          options={teacherOptions.map((teacher) => ({ value: String(teacher.id), label: teacherName(teacher) }))}
          allowEmpty={false}
          emptyLabel="All teachers"
          emptyMessage="No teacher assignments match these filters."
          hint="Teacher lists follow the selected academic year and term."
        />
        <SelectField
          label="Academic year"
          value={yearId}
          onChange={(value) => resetPage(() => { setYearSelection(value); setTeacherId('all') })}
          options={[
            { value: 'all', label: 'All years' },
            ...(academicYears.data ?? []).map((year) => ({ value: String(year.id), label: formatAcademicYearDisplay(year.name) ?? year.name })),
          ]}
          allowEmpty={false}
        />
        <SelectField
          label="Term"
          value={termId}
          onChange={(value) => resetPage(() => { setTermSelection(value); setTeacherId('all') })}
          options={[
            { value: 'all', label: 'All terms' },
            ...(terms.data ?? []).map((term) => ({ value: String(term.id), label: academicTermLabel(term) })),
          ]}
          allowEmpty={false}
        />
        <SelectField
          label="Learner status"
          value={status}
          onChange={(value) => resetPage(() => setStatus(value))}
          options={[{ value: 'all', label: 'All statuses' }, ...statusOptions.map((value) => ({ value, label: value }))]}
          allowEmpty={false}
        />
      </div>

      <SearchField value={search} onChange={(value) => resetPage(() => setSearch(value))} placeholder="Search name, admission no., or guardian…" />
      <p className="type-caption text-muted-foreground" aria-live="polite">
        {filtered.length} learner{filtered.length === 1 ? '' : 's'}
      </p>
      <p className="type-caption text-muted-foreground">
        Class and campus reflect each learner’s current profile. Academic year and term scope teacher assignments.
      </p>

      {metadataError ? (
        <ErrorState
          message={toUserMessage(metadataError)}
          onRetry={() => {
            void campuses.refetch()
            void classes.refetch()
            void streams.refetch()
            void assignments.refetch()
            void academicYears.refetch()
            void terms.refetch()
          }}
        />
      ) : filtered.length === 0 && !loading ? (
        <p className="type-body py-8 text-center text-muted-foreground">No learners match these class filters.</p>
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(learner) => learner.id}
          isLoading={loading}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
          mobileCard={(learner) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link className="type-heading hover:underline" to={paths.learnerDetail(learner.id)}>{formatPersonName(learner)}</Link>
                  <p className="type-caption text-muted-foreground">{learner.admissionNumber || 'No admission number'}</p>
                </div>
                <Badge variant={learner.status?.toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}>{learner.status || 'Unknown'}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                <RosterField label="Campus" value={learner.campus?.name || '—'} />
                <RosterField label="Class / stream" value={[learner.currentClass || learner.admissionClass, learner.stream].filter(Boolean).join(' · ') || '—'} />
                <RosterField label="Class teacher" value={classTeacherName(learner, scopedAssignments)} />
                <RosterField label="Guardian" value={guardianName(learner)} />
                <RosterField label="Contact" value={learner.phoneNumber || guardianPhone(learner)} />
                <RosterField label="Gender" value={learner.gender || '—'} />
              </dl>
            </div>
          )}
        />
      )}
    </div>
  )
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].sort()
}

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

function teacherName(teacher: AssignmentTeacher): string {
  return formatPersonName(teacher) || teacher.workEmail || `Teacher #${teacher.id}`
}

function matchesLearner(assignment: TeacherAssignment, learner: Learner, learnerClass: string): boolean {
  return normalize(assignment.schoolClass?.className) === normalize(learnerClass) &&
    (!assignment.stream?.name || normalize(assignment.stream.name) === normalize(learner.stream)) &&
    (!assignment.campus?.id || assignment.campus.id === learner.campus?.id)
}

function classTeacherName(learner: Learner, assignments: TeacherAssignment[]): string {
  const learnerClass = learner.currentClass || learner.admissionClass || ''
  const names = assignments
    .filter((assignment) => assignmentIsClassTeacher(assignment) && matchesLearner(assignment, learner, learnerClass))
    .map((assignment) => assignment.teacher ? teacherName(assignment.teacher) : '')
    .filter(Boolean)
  return [...new Set(names)].join(', ') || '—'
}

function guardianName(learner: Learner): string {
  const guardian = [learner.guardianFirstName, learner.guardianLastName].filter(Boolean).join(' ')
  const father = [learner.fatherFirstName, learner.fatherLastName].filter(Boolean).join(' ')
  const mother = [learner.motherFirstName, learner.motherLastName].filter(Boolean).join(' ')
  return guardian || father || mother || '—'
}

function guardianPhone(learner: Learner): string {
  return learner.guardianPhone || learner.fatherPhone || learner.motherPhone || '—'
}

function RosterField({ label, value }: { label: string; value: string }): ReactNode {
  return <div><dt>{label}</dt><dd className="font-medium text-foreground">{value}</dd></div>
}
