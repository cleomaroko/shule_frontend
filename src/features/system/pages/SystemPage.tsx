import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { toUserMessage } from '@/api/errors'
import { endpoints, queryKeys } from '@/api/endpoints'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { SearchField } from '@/components/data/FilterBar'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useBanks,
  useCampuses,
  useDepartments,
  useEmploymentStatuses,
  useGenders,
  useMaritalStatuses,
  useTaxExemptReasons,
  useTitles,
} from '@/features/lookups/useLookups'
import type { Campus, Department, NamedLookup } from '@/features/lookups/lookups.types'
import { useAuditLogs, useEmailUsage, useSystemMutations } from '@/features/system/hooks/useSystem'
import type { SystemLog } from '@/features/system/types/system.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDateTime } from '@/lib/format'

const PAGE_SIZE = 12

export function SystemPage(): ReactNode {
  useDocumentTitle('System')
  const { user } = useAuth()
  const isSuper = can(user?.role, 'system:super')
  const canAdmin = can(user?.role, 'staff:write')
  const [params, setParams] = useSearchParams()

  const defaultTab = isSuper ? 'logs' : 'campuses'
  const requested = params.get('tab')
  const tab = requested ?? defaultTab

  if (!isSuper && !canAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="System administration" description="Restricted to administrators." />
        <EmptyState
          title="Access denied"
          description="Your role cannot view system administration. Super administrators can see audit logs and email usage."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="System administration"
        description="Audit activity, campuses, departments, and reference lists used across Dira."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          {isSuper ? (
            <>
              <TabsTrigger value="logs">Audit logs</TabsTrigger>
              <TabsTrigger value="email">Email & reset</TabsTrigger>
            </>
          ) : null}
          {canAdmin ? (
            <>
              <TabsTrigger value="campuses">Campuses</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="lookups">Reference lists</TabsTrigger>
            </>
          ) : null}
        </TabsList>
        {isSuper ? (
          <>
            <TabsContent value="logs">
              <AuditLogsPanel />
            </TabsContent>
            <TabsContent value="email">
              <EmailResetPanel />
            </TabsContent>
          </>
        ) : null}
        {canAdmin ? (
          <>
            <TabsContent value="campuses">
              <CampusesPanel />
            </TabsContent>
            <TabsContent value="departments">
              <DepartmentsPanel />
            </TabsContent>
            <TabsContent value="lookups">
              <LookupsPanel />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  )
}

function AuditLogsPanel(): ReactNode {
  const list = useAuditLogs(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const rows = [...(list.data ?? [])].sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''))
    if (!needle) return rows
    return rows.filter((item) =>
      [item.username, item.action, item.details].join(' ').toLowerCase().includes(needle),
    )
  }, [list.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<SystemLog>> = [
    { id: 'time', header: 'When', cell: (row) => formatDateTime(row.timestamp) },
    { id: 'user', header: 'User', cell: (row) => displayValue(row.username) },
    {
      id: 'action',
      header: 'Action',
      cell: (row) => <Badge variant="neutral">{row.action || '—'}</Badge>,
    },
    { id: 'details', header: 'Details', cell: (row) => displayValue(row.details) },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchField
        value={query}
        onChange={(value) => {
          setQuery(value)
          setPage(1)
        }}
        placeholder="Search logs…"
      />
      {!list.isLoading && filtered.length === 0 ? (
        <EmptyState title="No audit logs" description="Secure actions will appear here after they are recorded." />
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
              <p className="type-heading">{row.action || 'Action'}</p>
              <p className="type-caption text-muted-foreground">
                {displayValue(row.username)} · {formatDateTime(row.timestamp)}
              </p>
              <p className="type-caption mt-1">{displayValue(row.details)}</p>
            </div>
          )}
        />
      )}
    </div>
  )
}

function EmailResetPanel(): ReactNode {
  const usage = useEmailUsage(true)
  const { reset } = useSystemMutations()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (usage.isError) {
    return <ErrorState message={toUserMessage(usage.error)} onRetry={() => void usage.refetch()} />
  }

  const sent = usage.data?.sentToday ?? 0
  const limit = usage.data?.dailyLimit ?? 500
  const remaining = usage.data?.remaining ?? 0

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="type-section-title">Email usage today</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <UsageRow label="Sent today" value={String(sent)} />
          <UsageRow label="Daily limit" value={String(limit)} />
          <UsageRow label="Remaining" value={String(remaining)} />
          <p className="type-caption text-muted-foreground">
            Counts messages logged for today. The daily cap is 500.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="type-section-title">Reset to defaults</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="type-body text-muted-foreground">
            Restores the mgaschool administrator password to the seeded default and adds campuses and departments only
            if those lists are empty. It does not wipe staff, learners, or other records.
          </p>
          <Button variant="destructive" className="self-start" onClick={() => setConfirmOpen(true)}>
            Reset system defaults
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Restore system defaults?"
        description="This resets the seeded admin account. Campuses and departments are added only when those lists are empty."
        confirmLabel="Reset defaults"
        loadingLabel="Resetting"
        isConfirming={reset.isPending}
        onConfirm={() => {
          reset.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })
        }}
      />
    </div>
  )
}

function UsageRow({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="type-label text-muted-foreground">{label}</span>
      <span className="type-heading">{value}</span>
    </div>
  )
}

function CampusesPanel(): ReactNode {
  const list = useCampuses()
  const { createCampus, updateCampus, deleteCampus } = useSystemMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Campus | null>(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Campus | null>(null)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setLocation('')
    setOpen(true)
  }

  const openEdit = (item: Campus) => {
    setEditing(item)
    setName(item.name)
    setLocation(item.location ?? '')
    setOpen(true)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    const trimmedLocation = location.trim()

    if (editing) {
      updateCampus.mutate(
        { id: editing.id, body: { name: trimmedName, location: trimmedLocation } },
        { onSuccess: () => setOpen(false) },
      )
      return
    }

    createCampus.mutate(
      trimmedLocation ? { name: trimmedName, location: trimmedLocation } : { name: trimmedName },
      { onSuccess: () => setOpen(false) },
    )
  }

  const columns: Array<DataColumn<Campus>> = [
    { id: 'name', header: 'Campus', cell: (row) => row.name },
    { id: 'location', header: 'Location', cell: (row) => displayValue(row.location) },
    {
      id: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (row) => (
        <span className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label={`Edit ${row.name}`} onClick={() => openEdit(row)}>
            <Pencil aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Delete ${row.name}`} onClick={() => setPendingDelete(row)}>
            <Trash2 aria-hidden="true" />
          </Button>
        </span>
      ),
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" />
          Add campus
        </Button>
      </div>
      {rows.length === 0 && !list.isLoading ? (
        <EmptyState
          title="No campuses yet"
          description="Add a campus such as Mwiki."
          actionLabel="Add campus"
          onAction={openCreate}
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
              <p className="type-heading">{row.name}</p>
              <p className="type-caption text-muted-foreground">{displayValue(row.location)}</p>
            </div>
          )}
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit campus' : 'Add campus'}</DialogTitle>
              <DialogDescription>Campus names must be unique.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-4">
              <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
              <TextField
                label="Location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createCampus.isPending || updateCampus.isPending}
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
        title="Delete campus?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteCampus.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteCampus.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function DepartmentsPanel(): ReactNode {
  const list = useDepartments()
  const { createDepartment, deleteDepartment } = useSystemMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Department | null>(null)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    createDepartment.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setOpen(false)
          setName('')
        },
      },
    )
  }

  const columns: Array<DataColumn<Department>> = [
    { id: 'name', header: 'Department', cell: (row) => row.name },
    {
      id: 'actions',
      header: '',
      className: 'w-14 text-right',
      cell: (row) => (
        <Button variant="ghost" size="icon" aria-label={`Delete ${row.name}`} onClick={() => setPendingDelete(row)}>
          <Trash2 aria-hidden="true" />
        </Button>
      ),
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Departments can be created and deleted. The backend does not expose an update endpoint.
      </p>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" />
          Add department
        </Button>
      </div>
      {rows.length === 0 && !list.isLoading ? (
        <EmptyState
          title="No departments yet"
          description="Add a department such as Education or Finance."
          actionLabel="Add department"
          onAction={() => setOpen(true)}
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
              <DialogTitle>Add department</DialogTitle>
              <DialogDescription>Department names must be unique.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createDepartment.isPending} loadingLabel="Saving">
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
        title="Remove department?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : ''}
        confirmLabel="Remove"
        loadingLabel="Removing"
        isConfirming={deleteDepartment.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteDepartment.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function LookupsPanel(): ReactNode {
  const { addLookup } = useSystemMutations()
  const titles = useTitles()
  const genders = useGenders()
  const marital = useMaritalStatuses()
  const banks = useBanks()
  const employment = useEmploymentStatuses()
  const taxExempt = useTaxExemptReasons()

  const groups = [
    { title: 'Titles', path: endpoints.lookups.titles, key: queryKeys.lookups.titles, query: titles },
    { title: 'Genders', path: endpoints.lookups.genders, key: queryKeys.lookups.genders, query: genders },
    {
      title: 'Marital statuses',
      path: endpoints.lookups.maritalStatuses,
      key: queryKeys.lookups.maritalStatuses,
      query: marital,
    },
    { title: 'Banks', path: endpoints.lookups.banks, key: queryKeys.lookups.banks, query: banks },
    {
      title: 'Employment statuses',
      path: endpoints.lookups.employmentStatuses,
      key: queryKeys.lookups.employmentStatuses,
      query: employment,
    },
    {
      title: 'Tax-exempt reasons',
      path: endpoints.lookups.taxExemptReasons,
      key: queryKeys.lookups.taxExemptReasons,
      query: taxExempt,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group) => (
        <LookupCard
          key={group.title}
          title={group.title}
          items={group.query.data ?? []}
          isLoading={group.query.isLoading}
          onAdd={(name) => addLookup.mutate({ path: group.path, name, key: group.key })}
          isAdding={addLookup.isPending}
        />
      ))}
    </div>
  )
}

function LookupCard({
  title,
  items,
  isLoading,
  onAdd,
  isAdding,
}: {
  title: string
  items: NamedLookup[]
  isLoading: boolean
  onAdd: (name: string) => void
  isAdding: boolean
}): ReactNode {
  const [name, setName] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-section-title">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <p className="type-caption text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="type-caption text-muted-foreground">No values yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <li key={item.id}>
                <Badge variant="neutral">{item.name}</Badge>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <TextField
            label={`Add to ${title.toLowerCase()}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            containerClassName="flex-1"
          />
          <Button type="submit" isLoading={isAdding} loadingLabel="Adding">
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
