import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, StatusBadge, type DataColumn } from '@/components/data/DataTable'
import { SearchField } from '@/components/data/FilterBar'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAcademicMutations, useLearningAreaList } from '@/features/academic/hooks/useAcademic'
import {
  SUBJECT_GROUPS,
  SUBJECT_STATUSES,
  type LearningArea,
  type LearningAreaWritePayload,
} from '@/features/academic/types/academic.types'
import { displayValue } from '@/lib/format'

const PAGE_SIZE = 10

const emptyForm: LearningAreaWritePayload = {
  name: '',
  shortName: '',
  knecCode: '',
  subjectGroup: 'Default',
  status: 'ACTIVE',
}

export function LearningAreasPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useLearningAreaList()
  const { createLearningArea, updateLearningArea, deleteLearningArea } = useAcademicMutations()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<LearningAreaWritePayload>(emptyForm)
  const [editing, setEditing] = useState<LearningArea | null>(null)
  const [open, setOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<LearningArea | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((item) => {
      if (!needle) return true
      return [item.name, item.shortName, item.knecCode, item.subjectGroup, item.status]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [list.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (item: LearningArea) => {
    setEditing(item)
    setForm({
      name: item.name,
      shortName: item.shortName ?? '',
      knecCode: item.knecCode ?? '',
      subjectGroup: item.subjectGroup || 'Default',
      status: item.status || 'ACTIVE',
    })
    setOpen(true)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const body: LearningAreaWritePayload = {
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      knecCode: form.knecCode.trim(),
      subjectGroup: form.subjectGroup.trim() || 'Default',
      status: form.status.trim() || 'ACTIVE',
    }
    if (!body.name) return

    if (editing) {
      updateLearningArea.mutate(
        { id: editing.id, body },
        { onSuccess: () => setOpen(false) },
      )
    } else {
      createLearningArea.mutate(body, { onSuccess: () => setOpen(false) })
    }
  }

  const columns: Array<DataColumn<LearningArea>> = [
    { id: 'name', header: 'Learning area', cell: (row) => row.name },
    { id: 'short', header: 'Short name', cell: (row) => displayValue(row.shortName) },
    { id: 'knec', header: 'KNEC code', cell: (row) => displayValue(row.knecCode) },
    { id: 'group', header: 'Group', cell: (row) => displayValue(row.subjectGroup) },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
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

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  const isSaving = createLearningArea.isPending || updateLearningArea.isPending

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          placeholder="Search learning areas…"
        />
        {canWrite ? (
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" />
            Add learning area
          </Button>
        ) : null}
      </div>

      {!list.isLoading && (list.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No learning areas yet"
          description="Define curriculum subjects such as Mathematics or English."
          {...(canWrite ? { actionLabel: 'Add learning area', onAction: openCreate } : {})}
        />
      ) : !list.isLoading && filtered.length === 0 ? (
        <EmptyState title="No matching learning areas" description="Try a different search." />
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="type-heading">{row.name}</p>
                <p className="type-caption text-muted-foreground">
                  {[row.shortName, row.knecCode].filter(Boolean).join(' · ') || 'No code'}
                </p>
              </div>
              <StatusBadge status={row.status} />
            </div>
          )}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit learning area' : 'Add learning area'}</DialogTitle>
              <DialogDescription>
                Updates overwrite name, short name, KNEC code, group, and status.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-4">
              <TextField
                label="Name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
              <TextField
                label="Short name"
                value={form.shortName}
                onChange={(event) => setForm((current) => ({ ...current, shortName: event.target.value }))}
                placeholder="MAT"
              />
              <TextField
                label="KNEC code"
                value={form.knecCode}
                onChange={(event) => setForm((current) => ({ ...current, knecCode: event.target.value }))}
                placeholder="121"
              />
              <SelectField
                label="Subject group"
                value={form.subjectGroup}
                onChange={(value) => setForm((current) => ({ ...current, subjectGroup: value || 'Default' }))}
                options={SUBJECT_GROUPS.map((value) => ({ value, label: value }))}
                allowEmpty={false}
              />
              <SelectField
                label="Status"
                value={form.status}
                onChange={(value) => setForm((current) => ({ ...current, status: value || 'ACTIVE' }))}
                options={SUBJECT_STATUSES.map((value) => ({ value, label: value }))}
                allowEmpty={false}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
                {editing ? 'Save changes' : 'Create'}
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
        title="Remove learning area?"
        description={
          pendingDelete
            ? `This will permanently delete ${pendingDelete.name}. Existing teacher assignments that use it may fail.`
            : ''
        }
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteLearningArea.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteLearningArea.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}
