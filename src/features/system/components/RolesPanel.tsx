import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
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
import { useStaffRoles } from '@/features/lookups/useLookups'
import type { NamedLookup } from '@/features/lookups/lookups.types'
import { useSystemMutations } from '@/features/system/hooks/useSystem'

const PAGE_SIZE = 12

export function RolesPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useStaffRoles()
  const { createRole, updateRole, deleteRole } = useSystemMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<NamedLookup | null>(null)
  const [name, setName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<NamedLookup | null>(null)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setOpen(true)
  }

  const openEdit = (item: NamedLookup) => {
    setEditing(item)
    setName(item.name)
    setOpen(true)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (editing) {
      updateRole.mutate({ id: editing.id, body: { name: trimmed } }, { onSuccess: () => setOpen(false) })
      return
    }
    createRole.mutate({ name: trimmed }, { onSuccess: () => setOpen(false) })
  }

  const columns: Array<DataColumn<NamedLookup>> = [
    { id: 'name', header: 'Role', cell: (row) => row.name },
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

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Staff roles used on staff records. These names do not change the login role in the users table.
      </p>
      <div className="flex justify-end">
        {canWrite ? (
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus aria-hidden="true" />
            Add role
          </Button>
        ) : null}
      </div>
      {rows.length === 0 && !list.isLoading ? (
        <EmptyState
          title="No staff roles yet"
          description="Add a role such as Head of School or Campus Admin."
          {...(canWrite ? { actionLabel: 'Add role', onAction: openCreate } : {})}
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
              <DialogTitle>{editing ? 'Edit staff role' : 'Add staff role'}</DialogTitle>
              <DialogDescription>Role names must be unique.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <TextField
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Head of School"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createRole.isPending || updateRole.isPending}
                loadingLabel="Saving"
              >
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
        title="Remove staff role?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : ''}
        confirmLabel="Remove"
        loadingLabel="Removing"
        isConfirming={deleteRole.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteRole.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}
