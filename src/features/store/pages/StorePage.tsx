import { Check, History, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip, SearchField } from '@/components/data/FilterBar'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { SwitchField } from '@/components/forms/SwitchField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StoreItemDialog } from '@/features/store/components/StoreItemDialog'
import { StoreLogDialog } from '@/features/store/components/StoreLogDialog'
import { ExpiryPanel } from '@/features/store/components/ExpiryPanel'
import { ItemMovementsDialog } from '@/features/store/components/ItemMovementsDialog'
import { WeeklyStockReportPanel } from '@/features/store/components/WeeklyStockReportPanel'
import { useAcademicTermList } from '@/features/academic/hooks/useAcademic'
import { useLearnerList } from '@/features/learners/hooks/useLearners'
import { useCampuses, useDepartments } from '@/features/lookups/useLookups'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import {
  useStoreCategories,
  useStoreItems,
  useStoreLocations,
  useStoreLogs,
  useStoreMutations,
  useStoreUnits,
} from '@/features/store/hooks/useStore'
import type {
  InventoryCategory,
  ItemUnit,
  StockLog,
  StockLogCreatePayload,
  StockLogUpdatePayload,
  StoreItem,
  StoreItemWritePayload,
  StoreLocation,
  StoreLocationWritePayload,
  TransactionType,
} from '@/features/store/types/store.types'
import {
  TRANSACTION_TYPES,
  formatStoreQty,
  isPendingTransfer,
  issuedToLabel,
  logFromLabel,
  logToLabel,
  requisitionNumberLabel,
  storeIsMain,
  termLabel,
  transactionTypeLabel,
  transferStatusLabel,
} from '@/features/store/types/store.types'
import { useSupplierList } from '@/features/suppliers/hooks/useSuppliers'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDate } from '@/lib/format'

const PAGE_SIZE = 10
const STORE_TABS = ['locations', 'categories', 'units', 'items', 'transactions', 'expiry', 'report'] as const
type StoreTab = (typeof STORE_TABS)[number]

function tabFromParam(value: string | null): StoreTab {
  return STORE_TABS.includes(value as StoreTab) ? (value as StoreTab) : 'items'
}

function typeBadgeVariant(type: TransactionType | null | undefined) {
  switch (type) {
    case 'ADDITION':
      return 'success' as const
    case 'TRANSFER':
      return 'primary' as const
    case 'CONSUMPTION':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

export function StorePage(): ReactNode {
  useDocumentTitle('Store Management')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'store:write')
  const [params, setParams] = useSearchParams()
  const tab = tabFromParam(params.get('tab'))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Store Management"
        description="Locations, units, catalogue, receipts, two-step transfers, expiry batches, and weekly stock-take sheets."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="expiry">Expiry</TabsTrigger>
          <TabsTrigger value="report">Weekly report</TabsTrigger>
        </TabsList>
        <TabsContent value="locations">
          <LocationsPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="units">
          <UnitsPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="items">
          <ItemsPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="expiry">
          <ExpiryPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="report">
          <WeeklyStockReportPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LocationsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useStoreLocations()
  const campuses = useCampuses()
  const { createLocation, deleteLocation } = useStoreMutations()
  const [page, setPage] = useState(1)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [campusId, setCampusId] = useState('')
  const [isMain, setIsMain] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<StoreLocation | null>(null)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const body: StoreLocationWritePayload = {
      name: trimmed,
      isMainStore: isMain,
      mainStore: isMain,
    }
    if (code.trim()) body.code = code.trim()
    const campus = Number(campusId)
    if (campus) body.campus = { id: campus }
    createLocation.mutate(body, {
      onSuccess: () => {
        setName('')
        setCode('')
        setCampusId('')
        setIsMain(false)
      },
    })
  }

  const columns: Array<DataColumn<StoreLocation>> = [
    {
      id: 'name',
      header: 'Store',
      cell: (row) => (
        <span>
          <span className="block font-medium">{row.name}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.code)}</span>
        </span>
      ),
    },
    { id: 'campus', header: 'Campus', cell: (row) => displayValue(row.campus?.name) },
    {
      id: 'kind',
      header: 'Kind',
      cell: (row) => (storeIsMain(row) ? <Badge variant="primary">Main</Badge> : <Badge variant="neutral">Campus</Badge>),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) =>
        canWrite ? (
          <Button variant="ghost" size="icon" aria-label={`Delete ${row.name}`} onClick={() => setPendingDelete(row)}>
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
        Locations can be added and removed. The backend has no update for store locations.
      </p>
      {canWrite ? (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
          <TextField label="Code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="MEM-ST" />
          <SelectField
            label="Campus"
            value={campusId}
            onChange={setCampusId}
            options={(campuses.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
            placeholder="Select campus"
            emptyLabel="Not set"
          />
          <div className="flex items-end">
            <SwitchField
              label="Main store"
              description="The hub that receives supplier stock."
              checked={isMain}
              onCheckedChange={setIsMain}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={createLocation.isPending} loadingLabel="Adding">
              <Plus aria-hidden="true" />
              Add location
            </Button>
          </div>
        </form>
      ) : null}
      {rows.length === 0 && !list.isLoading ? (
        <EmptyState title="No store locations yet" description="Add a main store and campus stores before recording stock." />
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
              <p className="type-caption text-muted-foreground">
                {[row.code, row.campus?.name, storeIsMain(row) ? 'Main' : 'Campus'].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
        />
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Delete store location?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteLocation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteLocation.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function CategoriesPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useStoreCategories()
  const { createCategory, deleteCategory } = useStoreMutations()
  const [page, setPage] = useState(1)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [parentId, setParentId] = useState('')
  const [pendingDelete, setPendingDelete] = useState<InventoryCategory | null>(null)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const body: { name: string; code?: string; parentCategory?: { id: number } } = { name: trimmed }
    if (code.trim()) body.code = code.trim()
    const parent = Number(parentId)
    if (parent) body.parentCategory = { id: parent }
    createCategory.mutate(body, {
      onSuccess: () => {
        setName('')
        setCode('')
        setParentId('')
      },
    })
  }

  const columns: Array<DataColumn<InventoryCategory>> = [
    { id: 'name', header: 'Category', cell: (row) => row.name },
    { id: 'code', header: 'Code', cell: (row) => displayValue(row.code) },
    { id: 'parent', header: 'Parent', cell: (row) => displayValue(row.parentCategory?.name) },
    {
      id: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) =>
        canWrite ? (
          <Button variant="ghost" size="icon" aria-label={`Delete ${row.name}`} onClick={() => setPendingDelete(row)}>
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
        Categories can be nested by choosing a parent. They can be added and removed, not renamed.
      </p>
      {canWrite ? (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
          <TextField label="Code" value={code} onChange={(event) => setCode(event.target.value)} />
          <SelectField
            label="Parent category"
            value={parentId}
            onChange={setParentId}
            options={rows.map((item) => ({ value: String(item.id), label: item.name }))}
            placeholder="None"
            emptyLabel="None"
            containerClassName="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={createCategory.isPending} loadingLabel="Adding">
              <Plus aria-hidden="true" />
              Add category
            </Button>
          </div>
        </form>
      ) : null}
      {rows.length === 0 && !list.isLoading ? (
        <EmptyState title="No categories yet" description="Add Stationery, Catering, or Uniforms." />
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
              <p className="type-caption text-muted-foreground">
                {[row.code, row.parentCategory?.name].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          )}
        />
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Delete category?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteCategory.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteCategory.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function UnitsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useStoreUnits()
  const { createUnit, deleteUnit } = useStoreMutations()
  const [page, setPage] = useState(1)
  const [name, setName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ItemUnit | null>(null)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    createUnit.mutate(
      { name: trimmed },
      {
        onSuccess: () => setName(''),
      },
    )
  }

  const columns: Array<DataColumn<ItemUnit>> = [
    { id: 'name', header: 'Unit', cell: (row) => row.name },
    {
      id: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) =>
        canWrite ? (
          <Button variant="ghost" size="icon" aria-label={`Delete ${row.name}`} onClick={() => setPendingDelete(row)}>
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
        Units can be listed, added, and removed. There is no update route. Seeded units are Kg, Pcs, Liters, and Bales.
      </p>
      {canWrite ? (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1fr_auto]">
          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Cartons"
            required
          />
          <div className="flex items-end">
            <Button type="submit" isLoading={createUnit.isPending} loadingLabel="Adding">
              <Plus aria-hidden="true" />
              Add unit
            </Button>
          </div>
        </form>
      ) : null}
      {rows.length === 0 && !list.isLoading ? (
        <EmptyState title="No units yet" description="Add Kg, Pcs, or another measurement used on store items." />
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
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Delete unit?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}. Items that still use it may fail.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteUnit.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteUnit.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function ItemsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useStoreItems()
  const categories = useStoreCategories()
  const units = useStoreUnits()
  const { createItem, updateItem, deleteItem } = useStoreMutations()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<StoreItem | null>(null)
  const [historyItem, setHistoryItem] = useState<StoreItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<StoreItem | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((item) => {
      if (!needle) return true
      return [item.name, item.itemCode, item.category?.name, item.unit?.name].join(' ').toLowerCase().includes(needle)
    })
  }, [list.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSubmit = (body: StoreItemWritePayload) => {
    if (editing) {
      updateItem.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) })
      return
    }
    createItem.mutate(body, { onSuccess: () => setOpen(false) })
  }

  const columns: Array<DataColumn<StoreItem>> = [
    {
      id: 'name',
      header: 'Item',
      cell: (row) => (
        <span>
          <span className="block font-medium">{row.name}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.itemCode)}</span>
        </span>
      ),
    },
    { id: 'category', header: 'Category', cell: (row) => displayValue(row.category?.name) },
    { id: 'unit', header: 'Unit', cell: (row) => displayValue(row.unit?.name) },
    {
      id: 'price',
      header: 'Price',
      hideOnMobile: true,
      cell: (row) => (row.price == null ? '—' : row.price.toLocaleString()),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-32 text-right',
      cell: (row) => (
        <span className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label={`History for ${row.name}`} onClick={() => setHistoryItem(row)}>
            <History aria-hidden="true" />
          </Button>
          {canWrite ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${row.name}`}
                onClick={() => {
                  setEditing(row)
                  setOpen(true)
                }}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Delete ${row.name}`} onClick={() => setPendingDelete(row)}>
                <Trash2 aria-hidden="true" />
              </Button>
            </>
          ) : null}
        </span>
      ),
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  const isEmpty = !list.isLoading && (list.data?.length ?? 0) === 0
  const noMatches = !list.isLoading && !isEmpty && filtered.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          placeholder="Search items…"
        />
        {canWrite ? (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus aria-hidden="true" />
            Add item
          </Button>
        ) : null}
      </div>
      {isEmpty ? (
        <EmptyState
          title="No store items yet"
          description="Define items such as exercise books before recording stock movement."
          {...(canWrite
            ? {
                actionLabel: 'Add item',
                onAction: () => {
                  setEditing(null)
                  setOpen(true)
                },
              }
            : {})}
        />
      ) : noMatches ? (
        <EmptyState title="No matching items" description="Try a different search." />
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
              <p className="type-heading">{row.name}</p>
              <p className="type-caption text-muted-foreground">
                {[row.itemCode, row.category?.name, row.unit?.name].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          )}
        />
      )}
      <StoreItemDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        units={units.data ?? []}
        categories={categories.data ?? []}
        isSaving={createItem.isPending || updateItem.isPending}
        onSubmit={handleSubmit}
      />
      <ItemMovementsDialog item={historyItem} onOpenChange={(next) => !next && setHistoryItem(null)} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Delete item?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteItem.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteItem.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function TransactionsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const items = useStoreItems()
  const logs = useStoreLogs()
  const stores = useStoreLocations()
  const termList = useAcademicTermList()
  const suppliers = useSupplierList()
  const staff = useStaffList()
  const learners = useLearnerList()
  const departments = useDepartments()
  const { createLog, updateLog, deleteLog, receiveLog } = useStoreMutations()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType | 'pending'>('all')
  const [storeFilter, setStoreFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<StockLog | null>(null)
  const [pendingDelete, setPendingDelete] = useState<StockLog | null>(null)
  const [pendingReceive, setPendingReceive] = useState<StockLog | null>(null)

  const terms = termList.data ?? []
  const canCreate = canWrite && (items.data?.length ?? 0) > 0 && (stores.data?.length ?? 0) > 0

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (logs.data ?? []).filter((log) => {
      if (typeFilter === 'pending') {
        if (!isPendingTransfer(log)) return false
      } else if (typeFilter !== 'all' && log.type !== typeFilter) {
        return false
      }
      if (storeFilter !== 'all') {
        const id = Number(storeFilter)
        if (log.sourceStore?.id !== id && log.destinationStore?.id !== id) return false
      }
      if (!needle) return true
      return [
        log.item?.name,
        log.sourceStore?.name,
        log.destinationStore?.name,
        termLabel(log.term),
        transactionTypeLabel(log.type),
        issuedToLabel(log),
        log.supplier?.name,
        log.recordedBy,
        log.logDate,
        log.requisition?.requisitionNumber,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [logs.data, query, storeFilter, typeFilter])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<StockLog>> = [
    { id: 'date', header: 'Date', cell: (row) => formatDate(row.logDate) },
    {
      id: 'type',
      header: 'Type',
      cell: (row) => <Badge variant={typeBadgeVariant(row.type)}>{transactionTypeLabel(row.type)}</Badge>,
    },
    { id: 'item', header: 'Item', cell: (row) => displayValue(row.item?.name) },
    { id: 'from', header: 'From', hideOnMobile: true, cell: (row) => logFromLabel(row) },
    { id: 'to', header: 'To / issued', hideOnMobile: true, cell: (row) => logToLabel(row) },
    { id: 'qty', header: 'Qty', cell: (row) => formatStoreQty(row.quantity) },
    {
      id: 'req',
      header: 'Requisition',
      hideOnMobile: true,
      cell: (row) => requisitionNumberLabel(row),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) =>
        row.type === 'TRANSFER' ? (
          <Badge variant={isPendingTransfer(row) ? 'warning' : 'success'}>{transferStatusLabel(row.status)}</Badge>
        ) : (
          '—'
        ),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-36 text-right',
      cell: (row) =>
        canWrite ? (
          <span className="flex justify-end gap-1">
            {isPendingTransfer(row) ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Confirm receipt"
                onClick={() => setPendingReceive(row)}
              >
                <Check aria-hidden="true" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Correct log"
              onClick={() => {
                setEditing(row)
                setOpen(true)
              }}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete log" onClick={() => setPendingDelete(row)}>
              <Trash2 aria-hidden="true" />
            </Button>
          </span>
        ) : null,
    },
  ]

  if (logs.isError) {
    return <ErrorState message={toUserMessage(logs.error)} onRetry={() => void logs.refetch()} />
  }

  const isEmpty = !logs.isLoading && (logs.data?.length ?? 0) === 0
  const noMatches = !logs.isLoading && !isEmpty && filtered.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          placeholder="Search transactions…"
        />
        {canWrite ? (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            disabled={!canCreate}
          >
            <Plus aria-hidden="true" />
            Record transaction
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label="All types"
          active={typeFilter === 'all'}
          onClick={() => {
            setTypeFilter('all')
            setPage(1)
          }}
        />
        {TRANSACTION_TYPES.map((type) => (
          <FilterChip
            key={type}
            label={transactionTypeLabel(type)}
            active={typeFilter === type}
            onClick={() => {
              setTypeFilter(type)
              setPage(1)
            }}
          />
        ))}
        <FilterChip
          label="Pending receipt"
          active={typeFilter === 'pending'}
          onClick={() => {
            setTypeFilter('pending')
            setPage(1)
          }}
        />
      </div>
      <SelectField
        label="Store"
        value={storeFilter === 'all' ? '' : storeFilter}
        onChange={(value) => {
          setStoreFilter(value || 'all')
          setPage(1)
        }}
        options={(stores.data ?? []).map((store) => ({ value: String(store.id), label: store.name }))}
        emptyLabel="All stores"
      />
      {isEmpty ? (
        <EmptyState
          title="No stock transactions yet"
          description="Record an addition into the main store, then transfer to a campus store."
          {...(canCreate
            ? {
                actionLabel: 'Record transaction',
                onAction: () => {
                  setEditing(null)
                  setOpen(true)
                },
              }
            : {})}
        />
      ) : noMatches ? (
        <EmptyState title="No matching transactions" description="Try a different search or filter." />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={logs.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="type-heading truncate">{displayValue(row.item?.name)}</p>
                  <p className="type-caption text-muted-foreground">
                    {formatDate(row.logDate)} · {logFromLabel(row)} → {logToLabel(row)}
                  </p>
                </div>
                <Badge variant={typeBadgeVariant(row.type)}>{transactionTypeLabel(row.type)}</Badge>
              </div>
              <p className="type-caption text-muted-foreground">
                Qty {formatStoreQty(row.quantity)}
                {row.type === 'TRANSFER' ? ` · ${transferStatusLabel(row.status)}` : ''}
                {row.requisition?.requisitionNumber ? ` · ${row.requisition.requisitionNumber}` : ''}
              </p>
              {canWrite && isPendingTransfer(row) ? (
                <Button type="button" size="sm" onClick={() => setPendingReceive(row)}>
                  Confirm receipt
                </Button>
              ) : null}
            </div>
          )}
        />
      )}
      <StoreLogDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        items={items.data ?? []}
        stores={stores.data ?? []}
        terms={terms}
        termsLoading={termList.isLoading}
        suppliers={suppliers.data ?? []}
        staff={staff.data ?? []}
        learners={learners.data ?? []}
        departments={departments.data ?? []}
        isSaving={createLog.isPending || updateLog.isPending}
        onCreate={(body: StockLogCreatePayload) => createLog.mutate(body, { onSuccess: () => setOpen(false) })}
        onUpdate={(body: StockLogUpdatePayload) => {
          if (!editing) return
          updateLog.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) })
        }}
      />
      <ConfirmDialog
        open={pendingReceive !== null}
        onOpenChange={(next) => {
          if (!next) setPendingReceive(null)
        }}
        title="Confirm receipt?"
        description={
          pendingReceive
            ? `This adds ${formatStoreQty(pendingReceive.quantity)} of ${pendingReceive.item?.name ?? 'this item'} to ${pendingReceive.destinationStore?.name ?? 'the destination store'}. Stock was already deducted from ${pendingReceive.sourceStore?.name ?? 'the source store'}.`
            : ''
        }
        confirmLabel="Confirm receipt"
        confirmVariant="primary"
        loadingLabel="Receiving"
        isConfirming={receiveLog.isPending}
        onConfirm={() => {
          if (!pendingReceive) return
          receiveLog.mutate(pendingReceive.id, { onSuccess: () => setPendingReceive(null) })
        }}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Delete stock log?"
        description={
          pendingDelete
            ? `This will remove the ${transactionTypeLabel(pendingDelete.type).toLowerCase()} of ${formatStoreQty(pendingDelete.quantity)} for ${pendingDelete.item?.name ?? 'this item'}. Stock balances are not recalculated.`
            : ''
        }
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteLog.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteLog.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}
