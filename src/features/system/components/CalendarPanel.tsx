import { Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { SwitchField } from '@/components/forms/SwitchField'
import { TextField } from '@/components/forms/TextField'
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
  useAcademicTermList,
  useAcademicYearList,
} from '@/features/academic/hooks/useAcademic'
import type { AcademicTerm, AcademicYear } from '@/features/academic/types/academic.types'
import { calendarIsCurrent } from '@/features/academic/types/academic.types'
import { displayValue, formatDate } from '@/lib/format'

const PAGE_SIZE = 12

export function CalendarPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  return (
    <div className="flex flex-col gap-8">
      <p className="type-caption text-muted-foreground">
        Years and terms can be listed, created, and updated. The backend has no delete for either.
        Marking one as current turns the others off.
      </p>
      <YearsSection canWrite={canWrite} />
      <TermsSection canWrite={canWrite} />
    </div>
  )
}

function YearsSection({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useAcademicYearList()
  const { createYear, updateYear } = useAcademicMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicYear | null>(null)
  const [name, setName] = useState('')
  const [current, setCurrent] = useState(false)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setCurrent(false)
    setOpen(true)
  }

  const openEdit = (item: AcademicYear) => {
    setEditing(item)
    setName(item.name)
    setCurrent(calendarIsCurrent(item))
    setOpen(true)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const body = { name: trimmed, current, isCurrent: current }
    if (editing) {
      updateYear.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) })
      return
    }
    createYear.mutate(body, { onSuccess: () => setOpen(false) })
  }

  const columns: Array<DataColumn<AcademicYear>> = [
    { id: 'name', header: 'Year', cell: (row) => row.name },
    {
      id: 'current',
      header: 'Current',
      cell: (row) =>
        calendarIsCurrent(row) ? <Badge variant="success">Current</Badge> : <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) =>
        canWrite ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${row.name}`} onClick={() => openEdit(row)}>
            <Pencil aria-hidden="true" />
          </Button>
        ) : null,
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-section-title">Academic years</h2>
          <p className="type-caption text-muted-foreground">Used by terms and store records.</p>
        </div>
        {canWrite ? (
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus aria-hidden="true" />
            Add year
          </Button>
        ) : null}
      </div>
      {rows.length === 0 && !list.isLoading ? (
        <EmptyState
          title="No academic years yet"
          description="Add a year such as 2026."
          {...(canWrite ? { actionLabel: 'Add year', onAction: openCreate } : {})}
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
            <div className="flex items-start justify-between gap-3">
              <p className="type-heading">{row.name}</p>
              {calendarIsCurrent(row) ? <Badge variant="success">Current</Badge> : null}
            </div>
          )}
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit academic year' : 'Add academic year'}</DialogTitle>
              <DialogDescription>Year names must be unique. Only one year can be current.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-4">
              <TextField
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="2026"
                required
              />
              <SwitchField
                label="Current year"
                description="Turns this year on and the others off."
                checked={current}
                onCheckedChange={setCurrent}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createYear.isPending || updateYear.isPending}
                loadingLabel="Saving"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function TermsSection({ canWrite }: { canWrite: boolean }): ReactNode {
  const years = useAcademicYearList()
  const list = useAcademicTermList()
  const { createTerm, updateTerm } = useAcademicMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicTerm | null>(null)
  const [name, setName] = useState('')
  const [yearId, setYearId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [current, setCurrent] = useState(false)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const yearOptions = (years.data ?? []).map((year) => ({ value: String(year.id), label: year.name }))

  const openCreate = () => {
    setEditing(null)
    setName('')
    setYearId(years.data?.[0] ? String(years.data[0].id) : '')
    setStartDate('')
    setEndDate('')
    setCurrent(false)
    setOpen(true)
  }

  const openEdit = (item: AcademicTerm) => {
    setEditing(item)
    setName(item.name)
    setYearId(item.academicYear?.id ? String(item.academicYear.id) : '')
    setStartDate(item.startDate ?? '')
    setEndDate(item.endDate ?? '')
    setCurrent(calendarIsCurrent(item))
    setOpen(true)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const body = {
      name: trimmed,
      current,
      isCurrent: current,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    }
    if (editing) {
      updateTerm.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) })
      return
    }
    const parsedYear = Number(yearId)
    if (!parsedYear) return
    createTerm.mutate({ ...body, academicYear: { id: parsedYear } }, { onSuccess: () => setOpen(false) })
  }

  const columns: Array<DataColumn<AcademicTerm>> = [
    { id: 'name', header: 'Term', cell: (row) => row.name },
    { id: 'year', header: 'Year', cell: (row) => displayValue(row.academicYear?.name) },
    { id: 'start', header: 'Start', cell: (row) => formatDate(row.startDate) },
    { id: 'end', header: 'End', cell: (row) => formatDate(row.endDate) },
    {
      id: 'current',
      header: 'Current',
      cell: (row) =>
        calendarIsCurrent(row) ? <Badge variant="success">Current</Badge> : <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) =>
        canWrite ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${row.name}`} onClick={() => openEdit(row)}>
            <Pencil aria-hidden="true" />
          </Button>
        ) : null,
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-section-title">Terms</h2>
          <p className="type-caption text-muted-foreground">
            Create needs a year. Updating a term cannot change which year it belongs to.
          </p>
        </div>
        {canWrite ? (
          <Button className="w-full sm:w-auto" onClick={openCreate} disabled={(years.data?.length ?? 0) === 0}>
            <Plus aria-hidden="true" />
            Add term
          </Button>
        ) : null}
      </div>
      {rows.length === 0 && !list.isLoading ? (
        <EmptyState
          title="No terms yet"
          description={
            (years.data?.length ?? 0) === 0
              ? 'Add an academic year before creating a term.'
              : 'Add Term 1, Term 2, or Term 3 for the current year.'
          }
          {...(canWrite && (years.data?.length ?? 0) > 0 ? { actionLabel: 'Add term', onAction: openCreate } : {})}
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
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="type-heading">{row.name}</p>
                  <p className="type-caption text-muted-foreground">{displayValue(row.academicYear?.name)}</p>
                </div>
                {calendarIsCurrent(row) ? <Badge variant="success">Current</Badge> : null}
              </div>
              <p className="type-caption text-muted-foreground">
                {formatDate(row.startDate)} – {formatDate(row.endDate)}
              </p>
            </div>
          )}
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="px-5 pt-6 sm:px-6">
              <DialogTitle>{editing ? 'Edit term' : 'Add term'}</DialogTitle>
              <DialogDescription>
                {editing
                  ? 'Name, dates, and current flag can be changed. The academic year cannot.'
                  : 'Only one term can be current at a time.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 overflow-y-auto px-5 py-4 sm:px-6">
              <TextField
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Term 1"
                required
              />
              <SelectField
                label="Academic year"
                value={yearId}
                onChange={setYearId}
                options={yearOptions}
                placeholder="Select year"
                allowEmpty={false}
                hint={editing ? 'The backend does not update the year on PUT.' : undefined}
                disabled={Boolean(editing)}
              />
              <TextField
                label="Start date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <TextField
                label="End date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
              <SwitchField
                label="Current term"
                description="Turns this term on and the others off."
                checked={current}
                onCheckedChange={setCurrent}
              />
            </div>
            <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createTerm.isPending || updateTerm.isPending}
                loadingLabel="Saving"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
