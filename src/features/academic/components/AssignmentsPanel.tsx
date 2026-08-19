import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { SearchField } from '@/components/data/FilterBar'
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
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { formatClassLabel, formatPersonName } from '@/lib/format'

const PAGE_SIZE = 10

export function AssignmentsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useAssignmentList()
  const classes = useClassList()
  const streams = useStreamList()
  const subjects = useLearningAreaList()
  const staff = useStaffList()
  const { createAssignment, deleteAssignment } = useAcademicMutations()

  const [query, setQuery] = useState('')
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
      if (!needle) return true
      const haystack = [
        item.teacher ? formatPersonName(item.teacher) : '',
        item.teacher?.staffNumber,
        item.schoolClass ? formatClassLabel(item.schoolClass) : '',
        item.stream?.name,
        item.subject?.name,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [list.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
    const subject = Number(subjectId)
    if (!teacher || !schoolClass || !subject) return

    const body: AssignmentWritePayload = {
      teacher: { id: teacher },
      schoolClass: { id: schoolClass },
      stream: streamId ? { id: Number(streamId) } : null,
      subject: { id: subject },
      classTeacher: isClassTeacher,
      isClassTeacher,
    }

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
      cell: (row) => row.subject?.name || '—',
    },
    {
      id: 'classTeacher',
      header: 'Class teacher',
      cell: (row) =>
        assignmentIsClassTeacher(row) ? <Badge variant="primary">Yes</Badge> : <span className="text-muted-foreground">No</span>,
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
          <Button onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            Assign teacher
          </Button>
        ) : null}
      </div>

      {!list.isLoading && (list.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No teacher assignments yet"
          description="Link a staff member to a learning area, class, and optional stream."
          {...(canWrite ? { actionLabel: 'Assign teacher', onAction: () => setOpen(true) } : {})}
        />
      ) : !list.isLoading && filtered.length === 0 ? (
        <EmptyState title="No matching assignments" description="Try a different search." />
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
            <div>
              <p className="type-heading">{row.teacher ? formatPersonName(row.teacher) : 'Unassigned'}</p>
              <p className="type-caption text-muted-foreground">
                {[row.subject?.name, row.schoolClass ? formatClassLabel(row.schoolClass) : null, row.stream?.name]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
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
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Assign teacher</DialogTitle>
              <DialogDescription>
                A teacher cannot be assigned twice to the same learning area in the same class and stream.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-4">
              <SelectField
                label="Teacher"
                value={teacherId}
                onChange={setTeacherId}
                allowEmpty={false}
                placeholder="Select staff"
                options={(staff.data ?? []).map((item) => ({
                  value: String(item.id),
                  label: formatPersonName(item),
                }))}
              />
              <SelectField
                label="Class"
                value={classId}
                onChange={setClassId}
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
                options={(streams.data ?? []).map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
              />
              <SelectField
                label="Learning area"
                value={subjectId}
                onChange={setSubjectId}
                allowEmpty={false}
                placeholder="Select learning area"
                options={(subjects.data ?? []).map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
              />
              <SwitchField
                label="Class teacher"
                description="Only the teacher in charge of this class and stream."
                checked={isClassTeacher}
                onCheckedChange={setIsClassTeacher}
              />
            </div>
            <DialogFooter>
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
        description="The teacher will no longer be linked to this class and learning area."
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
