import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip, SearchField } from '@/components/data/FilterBar'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { SwitchField } from '@/components/forms/SwitchField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAcademicMutations,
  useAssignmentList,
  useClassList,
  useLearningAreaList,
  useStreamList,
} from '@/features/academic/hooks/useAcademic'
import {
  assignmentIsClassTeacher,
  type AssignmentWritePayload,
  type TeacherAssignment,
} from '@/features/academic/types/academic.types'
import { useTeacherList } from '@/features/staff/hooks/useStaff'
import { formatClassLabel, formatPersonName } from '@/lib/format'

const PAGE_SIZE = 10

function sameStream(assignment: TeacherAssignment, streamId: string): boolean {
  if (!streamId) return !assignment.stream?.id
  return assignment.stream?.id === Number(streamId)
}

export function AssignmentsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useAssignmentList()
  const classes = useClassList()
  const streams = useStreamList()
  const subjects = useLearningAreaList()
  const staff = useTeacherList()
  const { createAssignment, deleteAssignment } = useAcademicMutations()

  const [query, setQuery] = useState('')
  const [classTeachersOnly, setClassTeachersOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<TeacherAssignment | null>(null)
  const [teacherId, setTeacherId] = useState('')
  const [classId, setClassId] = useState('')
  const [streamId, setStreamId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [isClassTeacher, setIsClassTeacher] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((item) => {
      if (classTeachersOnly && !assignmentIsClassTeacher(item)) return false
      if (!needle) return true
      const haystack = [
        item.teacher ? formatPersonName(item.teacher) : '',
        item.teacher?.staffNumber,
        item.schoolClass ? formatClassLabel(item.schoolClass) : '',
        item.stream?.name,
        item.subject?.name,
        assignmentIsClassTeacher(item) ? 'class teacher' : '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [classTeachersOnly, list.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selectedClass = (classes.data ?? []).find((item) => String(item.id) === classId)
  const streamOptions = (selectedClass?.streams?.length ? selectedClass.streams : streams.data) ?? []

  const currentClassTeacher = useMemo(() => {
    if (!classId) return null
    return (
      (list.data ?? []).find(
        (item) =>
          assignmentIsClassTeacher(item) &&
          String(item.schoolClass?.id ?? '') === classId &&
          sameStream(item, streamId),
      ) ?? null
    )
  }, [classId, list.data, streamId])

  const resetForm = () => {
    setTeacherId('')
    setClassId('')
    setStreamId('')
    setSubjectId('')
    setIsClassTeacher(false)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const teacher = Number(teacherId)
    const schoolClass = Number(classId)
    if (!teacher || !schoolClass) return
    if (!isClassTeacher && !Number(subjectId)) return

    const body: AssignmentWritePayload = {
      teacher: { id: teacher },
      schoolClass: { id: schoolClass },
      classTeacher: isClassTeacher,
      isClassTeacher,
    }
    if (streamId) body.stream = { id: Number(streamId) }
    if (subjectId) body.subject = { id: Number(subjectId) }

    createAssignment.mutate(body, {
      onSuccess: () => {
        setOpen(false)
        resetForm()
      },
    })
  }

  const columns: Array<DataColumn<TeacherAssignment>> = [
    {
      id: 'teacher',
      header: 'Teacher',
      cell: (row) => (row.teacher ? formatPersonName(row.teacher) : '—'),
    },
    {
      id: 'class',
      header: 'Class',
      cell: (row) => (row.schoolClass ? formatClassLabel(row.schoolClass) : '—'),
    },
    {
      id: 'stream',
      header: 'Stream',
      cell: (row) => row.stream?.name || '—',
    },
    {
      id: 'subject',
      header: 'Learning area',
      cell: (row) => row.subject?.name || (assignmentIsClassTeacher(row) ? 'Class teacher only' : '—'),
    },
    {
      id: 'classTeacher',
      header: 'Class teacher',
      cell: (row) =>
        assignmentIsClassTeacher(row) ? (
          <Badge variant="primary">Yes</Badge>
        ) : (
          <span className="text-muted-foreground">No</span>
        ),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-14 text-right',
      cell: (row) =>
        canWrite ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove assignment"
            onClick={() => setPendingDelete(row)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : null,
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Assignments are created with POST only — there is no update endpoint. Turning on class teacher for a class
        (and stream, if set) clears the previous class-teacher flag on that class.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          placeholder="Search assignments…"
        />
        {canWrite ? (
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            Assign teacher
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          active={!classTeachersOnly}
          onClick={() => {
            setClassTeachersOnly(false)
            setPage(1)
          }}
        />
        <FilterChip
          label="Class teachers"
          active={classTeachersOnly}
          onClick={() => {
            setClassTeachersOnly(true)
            setPage(1)
          }}
        />
      </div>

      {!list.isLoading && (list.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No teacher assignments yet"
          description="Link a staff member to a class. Add a learning area for a teaching load, or mark them as class teacher."
          {...(canWrite ? { actionLabel: 'Assign teacher', onAction: () => setOpen(true) } : {})}
        />
      ) : !list.isLoading && filtered.length === 0 ? (
        <EmptyState title="No matching assignments" description="Try a different search or filter." />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="type-heading truncate">
                    {row.teacher ? formatPersonName(row.teacher) : 'Unassigned'}
                  </p>
                  <p className="type-caption text-muted-foreground">
                    {[
                      row.schoolClass ? formatClassLabel(row.schoolClass) : null,
                      row.stream?.name,
                      row.subject?.name,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Class teacher only'}
                  </p>
                </div>
                {assignmentIsClassTeacher(row) ? <Badge variant="primary">Class teacher</Badge> : null}
              </div>
            </div>
          )}
        />
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="px-5 pt-6 sm:px-6">
              <DialogTitle>Assign teacher</DialogTitle>
              <DialogDescription>
                A teacher cannot be assigned twice to the same learning area in the same class and stream. Subject can
                be left unset for a class-teacher-only row.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 overflow-y-auto px-5 py-4 sm:px-6">
              <SelectField
                label="Teacher"
                value={teacherId}
                onChange={setTeacherId}
                allowEmpty={false}
                placeholder={staff.isLoading ? 'Loading teachers…' : 'Select teacher'}
                hint="Loaded from teaching staff only (teachers, heads, and deans)."
                disabled={staff.isLoading}
                emptyMessage="No teaching staff available"
                options={(staff.data ?? []).map((item) => ({
                  value: String(item.id),
                  label: [formatPersonName(item), item.staffNumber].filter(Boolean).join(' · '),
                }))}
              />
              <SelectField
                label="Class"
                value={classId}
                onChange={(value) => {
                  setClassId(value)
                  setStreamId('')
                }}
                allowEmpty={false}
                placeholder="Select class"
                options={(classes.data ?? []).map((item) => ({
                  value: String(item.id),
                  label: formatClassLabel(item),
                }))}
              />
              <SelectField
                label="Stream"
                value={streamId}
                onChange={setStreamId}
                emptyLabel="None"
                placeholder="Optional"
                hint="Optional. Class teacher is unique for this class and stream together."
                options={streamOptions.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
              />
              <SelectField
                label="Learning area"
                value={subjectId}
                onChange={setSubjectId}
                emptyLabel="None (class teacher only)"
                placeholder="Optional"
                hint={
                  isClassTeacher
                    ? 'Leave unset if this person is only the class teacher.'
                    : 'Required for a teaching load.'
                }
                options={(subjects.data ?? []).map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
              />
              <SwitchField
                label="Class teacher"
                description="Replaces the previous class teacher for this class and stream. Their teaching assignment stays."
                checked={isClassTeacher}
                onCheckedChange={setIsClassTeacher}
              />
              {isClassTeacher && currentClassTeacher?.teacher ? (
                <p className="type-caption text-muted-foreground">
                  {formatPersonName(currentClassTeacher.teacher)} is currently the class teacher
                  {currentClassTeacher.schoolClass
                    ? ` for ${formatClassLabel(currentClassTeacher.schoolClass)}`
                    : ''}
                  {currentClassTeacher.stream?.name ? ` ${currentClassTeacher.stream.name}` : ''}. Assigning a new one
                  will clear that flag.
                </p>
              ) : null}
            </div>
            <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createAssignment.isPending} loadingLabel="Assigning">
                Assign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Remove assignment?"
        description={
          pendingDelete
            ? `This will unassign ${pendingDelete.teacher ? formatPersonName(pendingDelete.teacher) : 'this teacher'} from ${pendingDelete.schoolClass ? formatClassLabel(pendingDelete.schoolClass) : 'this class'}${pendingDelete.subject?.name ? ` / ${pendingDelete.subject.name}` : ''}.`
            : ''
        }
        confirmLabel="Remove"
        loadingLabel="Removing"
        isConfirming={deleteAssignment.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteAssignment.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}
