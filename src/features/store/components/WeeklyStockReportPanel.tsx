import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip } from '@/components/data/FilterBar'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { useAcademicTermList } from '@/features/academic/hooks/useAcademic'
import { useStoreItems, useStoreLocations, useStoreStockTake } from '@/features/store/hooks/useStore'
import {
  computeStoreWeekReport,
  datesInRange,
  mondayToFriday,
  weekdayLabel,
} from '@/features/store/lib/store-report'
import {
  defaultTermId,
  formatStoreQty,
  termLabel,
  type StoreReportRow,
} from '@/features/store/types/store.types'
import { displayValue } from '@/lib/format'

/**
 * Weekly stock-take sheet from `GET /api/store/stock-take`.
 * Shared by Store Management and Reports so the received/released rules stay identical.
 */
export function WeeklyStockReportPanel(): ReactNode {
  const items = useStoreItems()
  const stores = useStoreLocations()
  const termList = useAcademicTermList()
  const week = mondayToFriday()
  const [storeId, setStoreId] = useState('')
  const [termId, setTermId] = useState('')
  const [startDate, setStartDate] = useState(week.startDate)
  const [endDate, setEndDate] = useState(week.endDate)
  const [hideZero, setHideZero] = useState(false)
  const terms = termList.data ?? []
  const selectedTerm = terms.find((term) => String(term.id) === termId)
  const rangeStart =
    selectedTerm?.startDate && selectedTerm.startDate < startDate ? selectedTerm.startDate : startDate
  const stockTakeParams =
    Number(storeId) && Number(termId) && rangeStart && endDate
      ? { storeId: Number(storeId), termId: Number(termId), startDate: rangeStart, endDate }
      : null
  const stockTake = useStoreStockTake(stockTakeParams)

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
      logs: stockTake.data ?? [],
      storeId: store,
      termId: term,
      startDate,
      endDate,
    })
  }, [endDate, items.data, startDate, stockTake.data, storeId, termId])

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
  if (stockTake.isError) {
    return <ErrorState message={toUserMessage(stockTake.error)} onRetry={() => void stockTake.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Built from GET /api/store/stock-take. Received includes supplier additions and incoming transfers that have
        been confirmed. Pending transfers count as released from the source only. Week release includes consumption
        and stock sent to another store. Only logs tagged with the selected term are included.
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
        <EmptyState title="Choose store and term" description="Select a store and term to build the weekly sheet." />
      ) : visible.length === 0 && !items.isLoading && !stockTake.isLoading ? (
        <EmptyState title="No rows to show" description="Add items or record stock for this store." />
      ) : (
        <DataTable
          columns={columns}
          rows={visible}
          getRowId={(row) => row.itemId}
          isLoading={items.isLoading || stockTake.isLoading}
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
                <div className="col-span-2">
                  <dt>Closing</dt>
                  <dd className="font-medium text-foreground">{formatStoreQty(row.closingBalance)}</dd>
                </div>
              </dl>
              <div>
                <p className="type-caption mb-1.5 font-medium text-muted-foreground">Daily consumption</p>
                <dl className="grid grid-cols-3 gap-2 type-caption text-muted-foreground">
                  {days.map((day) => (
                    <div key={day}>
                      <dt>{weekdayLabel(day)}</dt>
                      <dd className="font-medium text-foreground">{formatStoreQty(row.byDate[day] ?? 0)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        />
      )}
    </div>
  )
}
