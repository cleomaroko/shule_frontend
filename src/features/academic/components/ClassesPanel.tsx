import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { TextField } from '@/components/forms/TextField'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAcademicMutations, useClassList, useStreamList } from '@/features/academic/hooks/useAcademic'
import type { AcademicStream, SchoolClass } from '@/features/academic/types/academic.types'
import { formatClassLabel } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

const PAGE_SIZE = 10

export function ClassesPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  return (
    <div className="flex flex-col gap-8">
      <ClassesTable canWrite={canWrite} />
      <StreamsTable canWrite={canWrite} />
    </div>
  )
}

function ClassesTable({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useClassList()
  const { createClass, updateClass, deleteClass } = useAcademicMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SchoolClass | null>(null)
  const [section, setSection] = useState('')
  const [className, setClassName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<SchoolClass | null>(null)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setSection('')
    setClassName('')
    setOpen(true)
  }

  const openEdit = (item: SchoolClass) => {
    setEditing(item)
    setSection(item.section ?? '')
    setClassName(item.className ?? '')
    setOpen(true)
  }

  const columns: Array<DataColumn<SchoolClass>> = [
    {
      id: 'class',
      header: 'Class',
      cell: (row) => formatClassLabel(row),
    },
    {
      id: 'section',
      header: 'Section',
      cell: (row) => row.section || '—',
    },
    {
      id: 'streams',
      header: 'Linked streams',
      cell: (row) => {
        const streams = row.streams ?? []
        if (streams.length === 0) return '—'
        return (
          <span className="flex flex-wrap gap-1">
            {streams.map((stream) => (
              <Badge key={stream.id} variant="neutral">
                {stream.name}
              </Badge>
            ))}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (row) =>
        canWrite ? (
          <span className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${formatClassLabel(row)}`}
              onClick={() => openEdit(row)}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${formatClassLabel(row)}`}
              onClick={() => setPendingDelete(row)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </span>
        ) : null,
    },
  ]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedSection = section.trim()
    const trimmedName = className.trim()
    if (!trimmedSection || !trimmedName) return
    const body = { section: trimmedSection, className: trimmedName }
    if (editing) {
      updateClass.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) })
      return
    }
    createClass.mutate(body, { onSuccess: () => setOpen(false) })
  }

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="type-section-title">Classes</h2>
          <p className="type-caption mt-1 text-muted-foreground">
            Section is the school phase. Class name is the year group.
          </p>
        </div>
        {canWrite ? (
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" />
            Add class
          </Button>
        ) : null}
      </div>

      {!list.isLoading && rows.length === 0 ? (
        <EmptyState
          title="No classes yet"
          description="Add a class such as Grade 7 in Junior Secondary."
          {...(canWrite ? { actionLabel: 'Add class', onAction: openCreate } : {})}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div>
              <p className="type-heading">{formatClassLabel(row)}</p>
              <p className="type-caption text-muted-foreground">{row.section || 'No section'}</p>
            </div>
          )}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit class' : 'Add class'}</DialogTitle>
              <DialogDescription>Section is the school phase, class name is the year group.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex flex-col gap-4">
              <TextField
                label="Section"
                value={section}
                onChange={(event) => setSection(event.target.value)}
                placeholder="Junior Secondary"
                required
              />
              <TextField
                label="Class name"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                placeholder="Grade 7"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createClass.isPending || updateClass.isPending}
                loadingLabel="Saving"
              >
                Save class
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
        title="Delete class?"
        description={pendingDelete ? `This will remove ${formatClassLabel(pendingDelete)}.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteClass.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteClass.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </section>
  )
}

function StreamsTable({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useStreamList()
  const { createStream, updateStream, deleteStream } = useAcademicMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicStream | null>(null)
  const [name, setName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<AcademicStream | null>(null)

  const rows = useMemo(() => list.data ?? [], [list.data])
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setOpen(true)
  }

  const openEdit = (item: AcademicStream) => {
    setEditing(item)
    setName(item.name)
    setOpen(true)
  }

  const columns: Array<DataColumn<AcademicStream>> = [
    { id: 'name', header: 'Stream', cell: (row) => row.name },
    {
      id: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (row) =>
        canWrite ? (
          <span className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" aria-label={`Edit ${row.name}`} onClick={() => openEdit(row)}>
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${row.name}`}
              onClick={() => setPendingDelete(row)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </span>
        ) : null,
    },
  ]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (editing) {
      updateStream.mutate({ id: editing.id, body: { name: trimmed } }, { onSuccess: () => setOpen(false) })
      return
    }
    createStream.mutate({ name: trimmed }, { onSuccess: () => setOpen(false) })
  }

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="type-section-title">Streams</h2>
          <p className="type-caption mt-1 text-muted-foreground">
            Used when assigning a teacher to a class and stream. Names must be unique.
          </p>
        </div>
        {canWrite ? (
          <Button variant="secondary" onClick={openCreate}>
            <Plus aria-hidden="true" />
            Add stream
          </Button>
        ) : null}
      </div>

      {!list.isLoading && rows.length === 0 ? (
        <EmptyState
          title="No streams yet"
          description="Add streams such as North, East, or Blue."
          {...(canWrite ? { actionLabel: 'Add stream', onAction: openCreate } : {})}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
          mobileCard={(row) => <p className="type-heading">{row.name}</p>}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit stream' : 'Add stream'}</DialogTitle>
              <DialogDescription>A stream name such as North or East.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <TextField
                label="Stream name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="North"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createStream.isPending || updateStream.isPending}
                loadingLabel="Saving"
              >
                Save stream
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
        title="Remove stream?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : ''}
        confirmLabel="Remove"
        loadingLabel="Removing"
        isConfirming={deleteStream.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteStream.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </section>
  )
}
