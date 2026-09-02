import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
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
} from '@/features/store/hooks/useStore'
import {
  computeStoreWeekReport,
  datesInRange,
  mondayToFriday,
  weekdayLabel,
} from '@/features/store/lib/store-report'
import type {
  InventoryCategory,
  StockLog,
  StockLogCreatePayload,
  StockLogUpdatePayload,
  StoreItem,
  StoreItemWritePayload,
  StoreLocation,
  StoreLocationWritePayload,
  StoreReportRow,
  TransactionType,
} from '@/features/store/types/store.types'
import {
  TRANSACTION_TYPES,
  defaultTermId,
  formatStoreQty,
  issuedToLabel,
  storeIsMain,
  termLabel,
  transactionTypeLabel,
  uniqueUnits,
} from '@/features/store/types/store.types'
import { useSupplierList } from '@/features/suppliers/hooks/useSuppliers'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDate } from '@/lib/format'

const PAGE_SIZE = 10
const STORE_TABS = ['locations', 'categories', 'items', 'transactions', 'report'] as const
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
        description="Store locations, item catalogues, supplier receipts, transfers, and weekly stock-take sheets."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="report">Weekly report</TabsTrigger>
        </TabsList>
        <TabsContent value="locations">
          <LocationsPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="items">
          <ItemsPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="report">
          <ReportPanel />
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

function ItemsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useStoreItems()
  const categories = useStoreCategories()
  const { createItem, updateItem, deleteItem } = useStoreMutations()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<StoreItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<StoreItem | null>(null)

  const units = uniqueUnits(list.data ?? [])

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
      className: 'w-24 text-right',
      cell: (row) =>
        canWrite ? (
          <span className="flex justify-end gap-1">
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
          </span>
        ) : null,
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
        units={units}
        categories={categories.data ?? []}
        isSaving={createItem.isPending || updateItem.isPending}
        onSubmit={handleSubmit}
      />
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
  const { createLog, updateLog, deleteLog } = useStoreMutations()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [storeFilter, setStoreFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<StockLog | null>(null)
  const [pendingDelete, setPendingDelete] = useState<StockLog | null>(null)

  const terms = termList.data ?? []
  const canCreate = canWrite && (items.data?.length ?? 0) > 0 && (stores.data?.length ?? 0) > 0

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (logs.data ?? []).filter((log) => {
      if (typeFilter !== 'all' && log.type !== typeFilter) return false
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
        log.recordedBy,
        log.logDate,
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
    { id: 'from', header: 'From', hideOnMobile: true, cell: (row) => displayValue(row.sourceStore?.name) },
    { id: 'to', header: 'To / issued', hideOnMobile: true, cell: (row) => displayValue(row.destinationStore?.name) === '—' ? issuedToLabel(row) : displayValue(row.destinationStore?.name) },
    { id: 'qty', header: 'Qty', cell: (row) => formatStoreQty(row.quantity) },
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
                    {formatDate(row.logDate)} · {displayValue(row.sourceStore?.name)}
                  </p>
                </div>
                <Badge variant={typeBadgeVariant(row.type)}>{transactionTypeLabel(row.type)}</Badge>
              </div>
              <p className="type-caption text-muted-foreground">Qty {formatStoreQty(row.quantity)}</p>
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

function ReportPanel(): ReactNode {
  const items = useStoreItems()
  const logs = useStoreLogs()
  const stores = useStoreLocations()
  const termList = useAcademicTermList()
  const week = mondayToFriday()
  const [storeId, setStoreId] = useState('')
  const [termId, setTermId] = useState('')
  const [startDate, setStartDate] = useState(week.startDate)
  const [endDate, setEndDate] = useState(week.endDate)
  const [hideZero, setHideZero] = useState(false)
  const terms = termList.data ?? []

  useEffect(() => {
    if (!storeId && stores.data?.[0]) setStoreId(String(stores.data[0].id))
  }, [storeId, stores.data])

  useEffect(() => {
    if (termId) return
    const next = defaultTermId(termList.data ?? [])
    if (next) setTermId(next)
  }, [termId, termList.data])

  const rows = useMemo(() => {
    const store = Number(storeId)
    const term = Number(termId)
    if (!store || !term || !startDate || !endDate) return []
    return computeStoreWeekReport({
      items: items.data ?? [],
      logs: logs.data ?? [],
      storeId: store,
      termId: term,
      startDate,
      endDate,
    })
  }, [endDate, items.data, logs.data, startDate, storeId, termId])

  const visible = hideZero
    ? rows.filter(
        (row) =>
          row.balanceBf !== 0 ||
          row.additionalStock !== 0 ||
          row.weekRelease !== 0 ||
          Object.values(row.byDate).some((value) => value !== 0),
      )
    : rows

  const days = datesInRange(startDate, endDate)
  const ready = Boolean(Number(storeId) && Number(termId) && startDate && endDate)

  const columns: Array<DataColumn<StoreReportRow>> = [
    {
      id: 'item',
      header: 'Item',
      cell: (row) => (
        <span>
          <span className="block font-medium">{row.itemName}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.unitName)}</span>
        </span>
      ),
    },
    { id: 'bf', header: 'Balance B/F', cell: (row) => formatStoreQty(row.balanceBf) },
    { id: 'in', header: 'Received', cell: (row) => formatStoreQty(row.additionalStock) },
    { id: 'total', header: 'Total stock', cell: (row) => formatStoreQty(row.totalStock) },
    ...days.map((day) => ({
      id: day,
      header: weekdayLabel(day),
      cell: (row: StoreReportRow) => formatStoreQty(row.byDate[day] ?? 0),
    })),
    { id: 'release', header: 'Week release', cell: (row) => formatStoreQty(row.weekRelease) },
    { id: 'close', header: 'Closing', cell: (row) => formatStoreQty(row.closingBalance) },
  ]

  if (items.isError) {
    return <ErrorState message={toUserMessage(items.error)} onRetry={() => void items.refetch()} />
  }
  if (logs.isError) {
    return <ErrorState message={toUserMessage(logs.error)} onRetry={() => void logs.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Built from all stock logs. Incoming transfers count as received. Consumption is mapped by date. The
        stock-take endpoint only returns source-store rows, so the full log list is used here.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Store"
          value={storeId}
          onChange={setStoreId}
          options={(stores.data ?? []).map((store) => ({ value: String(store.id), label: store.name }))}
          placeholder="Select store"
          allowEmpty={false}
        />
        <SelectField
          label="Term"
          value={termId}
          onChange={setTermId}
          options={terms.map((term) => ({ value: String(term.id), label: termLabel(term) }))}
          placeholder={termList.isLoading ? 'Loading terms…' : 'Select term'}
          allowEmpty={false}
          disabled={termList.isLoading}
        />
        <TextField label="Week start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        <TextField label="Week end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="All items" active={!hideZero} onClick={() => setHideZero(false)} />
        <FilterChip label="With movement" active={hideZero} onClick={() => setHideZero(true)} />
      </div>
      {!ready ? (
        <EmptyState title="Choose store and term" description="Select a store and term to build the weekly sheet." />
      ) : visible.length === 0 && !items.isLoading && !logs.isLoading ? (
        <EmptyState title="No rows to show" description="Add items or record stock for this store." />
      ) : (
        <DataTable
          columns={columns}
          rows={visible}
          getRowId={(row) => row.itemId}
          isLoading={items.isLoading || logs.isLoading}
          page={1}
          pageSize={Math.max(visible.length, 1)}
          total={visible.length}
          onPageChange={() => undefined}
          mobileCard={(row) => (
            <div>
              <p className="type-heading">{row.itemName}</p>
              <p className="type-caption text-muted-foreground">
                B/F {formatStoreQty(row.balanceBf)} · In {formatStoreQty(row.additionalStock)} · Out{' '}
                {formatStoreQty(row.weekRelease)} · Close {formatStoreQty(row.closingBalance)}
              </p>
            </div>
          )}
        />
      )}
    </div>
  )
}
