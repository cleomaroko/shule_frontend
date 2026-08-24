import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip, SearchField } from '@/components/data/FilterBar'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StoreItemDialog } from '@/features/store/components/StoreItemDialog'
import { StoreLogDialog } from '@/features/store/components/StoreLogDialog'
import { useAcademicTermList } from '@/features/academic/hooks/useAcademic'
import { useStoreItems, useStoreLogs, useStoreMutations } from '@/features/store/hooks/useStore'
import {
  computeCampusWeekReport,
  datesInRange,
  mondayToFriday,
  weekdayLabel,
} from '@/features/store/lib/store-report'
import type {
  StockLog,
  StockLogCreatePayload,
  StockLogUpdatePayload,
  StoreItem,
  StoreItemWritePayload,
  StoreReportRow,
  TransactionType,
} from '@/features/store/types/store.types'
import {
  TRANSACTION_TYPES,
  defaultTermId,
  formatStoreQty,
  termLabel,
  transactionTypeLabel,
  uniqueCategories,
  uniqueUnits,
} from '@/features/store/types/store.types'
import { useCampuses } from '@/features/lookups/useLookups'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

const STORE_TABS = ['items', 'transactions', 'report'] as const
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
        description="Main-store receipts, transfers to campuses, daily usage, and the weekly campus sheet."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="report">Weekly report</TabsTrigger>
        </TabsList>
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

function ItemsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useStoreItems()
  const { createItem } = useStoreMutations()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)

  const units = uniqueUnits(list.data ?? [])
  const categories = uniqueCategories(list.data ?? [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((item) => {
      if (!needle) return true
      return [item.name, item.category, item.unit?.name].join(' ').toLowerCase().includes(needle)
    })
  }, [list.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSubmit = (body: StoreItemWritePayload) => {
    createItem.mutate(body, { onSuccess: () => setOpen(false) })
  }

  const columns: Array<DataColumn<StoreItem>> = [
    {
      id: 'name',
      header: 'Item',
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    { id: 'category', header: 'Category', cell: (row) => displayValue(row.category) },
    { id: 'unit', header: 'Unit', cell: (row) => displayValue(row.unit?.name) },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  const isEmpty = !list.isLoading && (list.data?.length ?? 0) === 0
  const noMatches = !list.isLoading && !isEmpty && filtered.length === 0

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Items can be listed and added. The backend has no update or delete for store items, and no units
        endpoint — `POST /api/store/items/units` is documented but not implemented.
      </p>
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
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            Add item
          </Button>
        ) : null}
      </div>

      {isEmpty ? (
        <EmptyState
          title="No store items yet"
          description="Define items such as exercise books before recording stock movement."
          {...(canWrite ? { actionLabel: 'Add item', onAction: () => setOpen(true) } : {})}
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
            <div className="flex flex-col gap-1">
              <p className="type-heading">{row.name}</p>
              <p className="type-caption text-muted-foreground">
                {[row.category, row.unit?.name].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          )}
        />
      )}

      <StoreItemDialog
        open={open}
        onOpenChange={setOpen}
        units={units}
        categories={categories}
        isSaving={createItem.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function TransactionsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const items = useStoreItems()
  const logs = useStoreLogs()
  const campuses = useCampuses()
  const termList = useAcademicTermList()
  const { createLog, updateLog, deleteLog } = useStoreMutations()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [campusFilter, setCampusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<StockLog | null>(null)
  const [pendingDelete, setPendingDelete] = useState<StockLog | null>(null)

  const terms = termList.data ?? []

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (logs.data ?? []).filter((log) => {
      if (typeFilter !== 'all' && log.type !== typeFilter) return false
      if (campusFilter === 'main' && log.campus) return false
      if (campusFilter !== 'all' && campusFilter !== 'main' && String(log.campus?.id ?? '') !== campusFilter) {
        return false
      }
      if (!needle) return true
      const haystack = [
        log.item?.name,
        log.item?.category,
        log.campus?.name,
        termLabel(log.term),
        transactionTypeLabel(log.type),
        log.recordedBy,
        log.logDate,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [campusFilter, logs.data, query, typeFilter])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (log: StockLog) => {
    setEditing(log)
    setOpen(true)
  }

  const handleCreate = (body: StockLogCreatePayload) => {
    createLog.mutate(body, { onSuccess: () => setOpen(false) })
  }

  const handleUpdate = (body: StockLogUpdatePayload) => {
    if (!editing) return
    updateLog.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) })
  }

  const columns: Array<DataColumn<StockLog>> = [
    {
      id: 'date',
      header: 'Date',
      cell: (row) => formatDate(row.logDate),
    },
    {
      id: 'type',
      header: 'Type',
      cell: (row) => <Badge variant={typeBadgeVariant(row.type)}>{transactionTypeLabel(row.type)}</Badge>,
    },
    {
      id: 'item',
      header: 'Item',
      cell: (row) => (
        <span>
          <span className="block font-medium">{displayValue(row.item?.name)}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.item?.unit?.name)}</span>
        </span>
      ),
    },
    {
      id: 'campus',
      header: 'Campus',
      cell: (row) => row.campus?.name ?? 'Main store',
    },
    {
      id: 'qty',
      header: 'Qty',
      cell: (row) => formatStoreQty(row.quantity),
    },
    {
      id: 'term',
      header: 'Term',
      cell: (row) => termLabel(row.term),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (row) =>
        canWrite ? (
          <span className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" aria-label={`Correct log ${row.id}`} onClick={() => openEdit(row)}>
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete log ${row.id}`}
              onClick={() => setPendingDelete(row)}
            >
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
  const canCreate = canWrite && (items.data?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Additions go to the main store. Transfers move stock to a campus. Consumption is daily campus usage. Balance
        B/F is the term opening. Corrections only change quantity, date, and receipt.
      </p>
      <div className="flex flex-col gap-3">
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
            <Button className="w-full sm:w-auto" onClick={openCreate} disabled={!canCreate}>
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
        <div className="max-w-sm">
          <SelectField
            label="Campus"
            value={campusFilter === 'all' ? '' : campusFilter}
            onChange={(value) => {
              setCampusFilter(value || 'all')
              setPage(1)
            }}
            options={[
              { value: 'main', label: 'Main store' },
              ...(campuses.data ?? []).map((campus) => ({ value: String(campus.id), label: campus.name })),
            ]}
            emptyLabel="All locations"
            placeholder="All locations"
          />
        </div>
      </div>

      {canWrite && !canCreate && !items.isLoading ? (
        <p className="type-caption text-muted-foreground">Add a store item before recording transactions.</p>
      ) : null}

      {isEmpty ? (
        <EmptyState
          title="No stock transactions yet"
          description="Record an addition at the main store, then transfer stock to a campus."
          {...(canCreate ? { actionLabel: 'Record transaction', onAction: openCreate } : {})}
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
                    {formatDate(row.logDate)} · {row.campus?.name ?? 'Main store'}
                  </p>
                </div>
                <Badge variant={typeBadgeVariant(row.type)}>{transactionTypeLabel(row.type)}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                <div>
                  <dt>Quantity</dt>
                  <dd className="font-medium text-foreground">{formatStoreQty(row.quantity)}</dd>
                </div>
                <div>
                  <dt>Term</dt>
                  <dd className="font-medium text-foreground">{termLabel(row.term)}</dd>
                </div>
                <div className="col-span-2">
                  <dt>Recorded by</dt>
                  <dd className="font-medium text-foreground">{displayValue(row.recordedBy)}</dd>
                </div>
              </dl>
            </div>
          )}
        />
      )}

      <StoreLogDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        items={items.data ?? []}
        campuses={campuses.data ?? []}
        terms={terms}
        termsLoading={termList.isLoading}
        isSaving={createLog.isPending || updateLog.isPending}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Delete stock log?"
        description={
          pendingDelete
            ? `This will remove the ${transactionTypeLabel(pendingDelete.type).toLowerCase()} of ${formatStoreQty(pendingDelete.quantity)} for ${pendingDelete.item?.name ?? 'this item'}.`
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
  const campuses = useCampuses()
  const termList = useAcademicTermList()
  const week = mondayToFriday()
  const [campusId, setCampusId] = useState('')
  const [termId, setTermId] = useState('')
  const [startDate, setStartDate] = useState(week.startDate)
  const [endDate, setEndDate] = useState(week.endDate)
  const [hideZero, setHideZero] = useState(false)

  const terms = termList.data ?? []

  useEffect(() => {
    if (!campusId && campuses.data?.[0]) setCampusId(String(campuses.data[0].id))
  }, [campusId, campuses.data])

  useEffect(() => {
    if (!termId) setTermId(defaultTermId(terms))
  }, [termId, terms])

  const rows = useMemo(() => {
    const campus = Number(campusId)
    const term = Number(termId)
    if (!campus || !term || !startDate || !endDate) return []
    return computeCampusWeekReport({
      items: items.data ?? [],
      logs: logs.data ?? [],
      campusId: campus,
      termId: term,
      startDate,
      endDate,
    })
  }, [campusId, endDate, items.data, logs.data, startDate, termId])

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
  const ready = Boolean(Number(campusId) && Number(termId) && startDate && endDate)

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
        The weekly campus sheet is calculated here from all stock logs. The filtered logs endpoint only returns the
        selected week, which is not enough for Balance B/F. Main-store additions are not treated as campus stock.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Campus"
          value={campusId}
          onChange={setCampusId}
          options={(campuses.data ?? []).map((campus) => ({ value: String(campus.id), label: campus.name }))}
          placeholder="Select campus"
          allowEmpty={false}
        />
        <SelectField
          label="Term"
          value={termId}
          onChange={setTermId}
          options={terms.map((term) => ({ value: String(term.id), label: termLabel(term) }))}
          placeholder={termList.isLoading ? 'Loading terms…' : 'Select term'}
          hint="Loaded from the academic calendar."
          allowEmpty={false}
          disabled={termList.isLoading}
        />
        {terms.length === 0 && !termList.isLoading ? (
          <TextField
            label="Term ID"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={termId}
            onChange={(event) => setTermId(event.target.value)}
            hint="No terms in the academic calendar yet. Add them under System → Calendar, or enter the numeric term id."
          />
        ) : null}
        <TextField
          label="Week start"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <TextField
          label="Week end"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="All items" active={!hideZero} onClick={() => setHideZero(false)} />
        <FilterChip label="With movement" active={hideZero} onClick={() => setHideZero(true)} />
      </div>

      {!ready ? (
        <EmptyState title="Choose campus and term" description="Select a campus and term to build the weekly sheet." />
      ) : (items.data?.length ?? 0) === 0 && !items.isLoading ? (
        <EmptyState title="No store items" description="Add items before generating a campus sheet." />
      ) : visible.length === 0 && !items.isLoading && !logs.isLoading ? (
        <EmptyState
          title="No rows to show"
          description={hideZero ? 'Nothing moved at this campus in the selected week.' : 'No store items found.'}
        />
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
            <div className="flex flex-col gap-3">
              <div>
                <p className="type-heading">{row.itemName}</p>
                <p className="type-caption text-muted-foreground">{displayValue(row.unitName)}</p>
              </div>
              <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                <div>
                  <dt>Balance B/F</dt>
                  <dd className="font-medium text-foreground">{formatStoreQty(row.balanceBf)}</dd>
                </div>
                <div>
                  <dt>Received</dt>
                  <dd className="font-medium text-foreground">{formatStoreQty(row.additionalStock)}</dd>
                </div>
                <div>
                  <dt>Total stock</dt>
                  <dd className="font-medium text-foreground">{formatStoreQty(row.totalStock)}</dd>
                </div>
                <div>
                  <dt>Week release</dt>
                  <dd className="font-medium text-foreground">{formatStoreQty(row.weekRelease)}</dd>
                </div>
              </dl>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {days.map((day) => (
                  <div key={day} className="rounded-lg border border-border px-2 py-1.5">
                    <p className="type-caption text-muted-foreground">{weekdayLabel(day)}</p>
                    <p className="type-label font-medium">{formatStoreQty(row.byDate[day] ?? 0)}</p>
                  </div>
                ))}
              </div>
              <p
                className={cn(
                  'type-label',
                  row.closingBalance < 0 ? 'text-destructive' : 'text-foreground',
                )}
              >
                Closing {formatStoreQty(row.closingBalance)}
              </p>
            </div>
          )}
        />
      )}
    </div>
  )
}
