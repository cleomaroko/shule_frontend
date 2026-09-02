import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'

import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
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

const PAGE_SIZE = 10

export interface NamedLookupRow {
  id: number
  name: string
}

export interface NamedLookupManagerProps {
  title: string
  description: string
  emptyTitle: string
  emptyDescription: string
  addLabel?: string
  items: NamedLookupRow[] | undefined
  isLoading: boolean
  isError: boolean
  errorMessage: string
  onRetry: () => void
  canWrite: boolean
  canUpdate?: boolean
  canDelete?: boolean
  isSaving: boolean
  isDeleting?: boolean
  onCreate: (name: string) => void
  onUpdate?: (id: number, name: string) => void
  onDelete?: (id: number) => void
}

export function NamedLookupManager({
  title,
  description,
  emptyTitle,
  emptyDescription,
  addLabel = 'Add',
  items,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  canWrite,
  canUpdate = false,
  canDelete = false,
  isSaving,
  isDeleting = false,
  onCreate,
  onUpdate,
  onDelete,
}: NamedLookupManagerProps): ReactNode {
  const [name, setName] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<NamedLookupRow | null>(null)
  const [editName, setEditName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<NamedLookupRow | null>(null)

  const rows = items ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCreate = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setName('')
  }

  const handleUpdate = (event: FormEvent) => {
    event.preventDefault()
    if (!editing || !onUpdate) return
    const trimmed = editName.trim()
    if (!trimmed) return
    onUpdate(editing.id, trimmed)
    setEditing(null)
  }

  const columns: Array<DataColumn<NamedLookupRow>> = [
    { id: 'name', header: title, cell: (row) => row.name },
    {
      id: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (row) =>
        canWrite && (canUpdate || canDelete) ? (
          <span className="flex justify-end gap-1">
            {canUpdate && onUpdate ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${row.name}`}
                onClick={() => {
                  setEditing(row)
                  setEditName(row.name)
                }}
              >
                <Pencil aria-hidden="true" />
              </Button>
            ) : null}
            {canDelete && onDelete ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.name}`}
                onClick={() => setPendingDelete(row)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            ) : null}
          </span>
        ) : null,
    },
  ]

  if (isError) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">{description}</p>
      {canWrite ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            containerClassName="flex-1"
            required
          />
          <Button type="submit" isLoading={isSaving} loadingLabel="Adding">
            <Plus aria-hidden="true" />
            {addLabel}
          </Button>
        </form>
      ) : null}

      {rows.length === 0 && !isLoading ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
          mobileCard={(row) => <p className="type-heading">{row.name}</p>}
        />
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(next) => {
          if (!next) setEditing(null)
        }}
      >
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Rename {title.toLowerCase()}</DialogTitle>
              <DialogDescription>This name is used in dropdowns across the app.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <TextField
                label="Name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
                Save
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
        title={`Delete ${title.toLowerCase()}?`}
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={isDeleting}
        onConfirm={() => {
          if (!pendingDelete || !onDelete) return
          onDelete(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
