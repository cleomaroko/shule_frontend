import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
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
  const { createClass } = useAcademicMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState('')
  const [className, setClassName] = useState('')

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
  ]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedSection = section.trim()
    const trimmedName = className.trim()
    if (!trimmedSection || !trimmedName) return
    createClass.mutate(
      { section: trimmedSection, className: trimmedName },
      {
        onSuccess: () => {
          setOpen(false)
          setSection('')
          setClassName('')
        },
      },
    )
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
            The backend can add classes but does not expose edit or delete for them.
          </p>
        </div>
        {canWrite ? (
          <Button onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            Add class
          </Button>
        ) : null}
      </div>

      {!list.isLoading && rows.length === 0 ? (
        <EmptyState
          title="No classes yet"
          description="Add a class such as Grade 7 in Junior Secondary."
          {...(canWrite ? { actionLabel: 'Add class', onAction: () => setOpen(true) } : {})}
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
              <DialogTitle>Add class</DialogTitle>
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
              <Button type="submit" isLoading={createClass.isPending} loadingLabel="Saving">
                Save class
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function StreamsTable({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useStreamList()
  const { createStream } = useAcademicMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const rows = useMemo(() => list.data ?? [], [list.data])
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<AcademicStream>> = [
    { id: 'name', header: 'Stream', cell: (row) => row.name },
  ]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    createStream.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setOpen(false)
          setName('')
        },
      },
    )
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
          <Button variant="secondary" onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            Add stream
          </Button>
        ) : null}
      </div>

      {!list.isLoading && rows.length === 0 ? (
        <EmptyState
          title="No streams yet"
          description="Add streams such as North, East, or Blue."
          {...(canWrite ? { actionLabel: 'Add stream', onAction: () => setOpen(true) } : {})}
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
              <DialogTitle>Add stream</DialogTitle>
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
              <Button type="submit" isLoading={createStream.isPending} loadingLabel="Saving">
                Save stream
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
