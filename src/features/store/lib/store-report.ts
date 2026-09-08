import type {
  StockLog,
  StockTakePayload,
  StockTakeReportRow,
  StoreItem,
  StoreReportRow,
} from '@/features/store/types/store.types'
import { logQuantity } from '@/features/store/types/store.types'

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function mondayToFriday(from = new Date()): { startDate: string; endDate: string } {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const weekday = date.getDay()
  const toMonday = weekday === 0 ? -6 : 1 - weekday
  const monday = new Date(date)
  monday.setDate(date.getDate() + toMonday)
  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  return { startDate: toIsoDate(monday), endDate: toIsoDate(saturday) }
}

export function datesInRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate || startDate > endDate) return []
  const out: string[] = []
  const cursor = new Date(`${startDate}T00:00:00`)
  const last = new Date(`${endDate}T00:00:00`)
  while (cursor <= last) {
    out.push(toIsoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

export function weekdayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
}

function isBefore(date: string | null | undefined, boundary: string): boolean {
  return Boolean(date) && date! < boundary
}

function isOnOrAfter(date: string | null | undefined, boundary: string): boolean {
  return Boolean(date) && date! >= boundary
}

function inRange(date: string | null | undefined, startDate: string, endDate: string): boolean {
  return Boolean(date) && date! >= startDate && date! <= endDate
}

/** Supplier receipt into this store. */
export function isReceivedLog(log: StockLog, storeId: number): boolean {
  if (log.type === 'ADDITION' && log.sourceStore?.id === storeId) return true
  if (log.type === 'TRANSFER' && log.destinationStore?.id === storeId && log.status !== 'PENDING') return true
  return false
}

/** Consumption or transfer leaving this store. */
export function isReleasedLog(log: StockLog, storeId: number): boolean {
  if (log.type === 'CONSUMPTION' && log.sourceStore?.id === storeId) return true
  if (log.type === 'TRANSFER' && log.sourceStore?.id === storeId) return true
  return false
}

function involvesStore(log: StockLog, storeId: number): boolean {
  return log.sourceStore?.id === storeId || log.destinationStore?.id === storeId
}

/**
 * Weekly sheet from `GET /api/store/stock-take`.
 *
 * Received = ADDITION + incoming TRANSFER (this store is destination).
 * Released = CONSUMPTION + outgoing TRANSFER (this store is source).
 * Daily columns are consumption only. Week release includes outgoing transfers.
 */
export function computeStoreWeekReport(args: {
  items: StoreItem[]
  logs: StockLog[]
  storeId: number
  termId: number
  startDate: string
  endDate: string
}): StoreReportRow[] {
  const days = datesInRange(args.startDate, args.endDate)

  return args.items.map((item) => {
    const storeLogs = args.logs.filter((log) => log.item?.id === item.id && involvesStore(log, args.storeId))
    const termBf = storeLogs.find(
      (log) => log.type === 'BALANCE_BF' && log.term?.id === args.termId && log.sourceStore?.id === args.storeId,
    )

    let balanceBf = 0
    if (termBf) {
      balanceBf = logQuantity(termBf)
      const bfDate = termBf.logDate ?? ''
      for (const log of storeLogs) {
        if (log.id === termBf.id) continue
        if (!isBefore(log.logDate, args.startDate)) continue
        if (bfDate && !isOnOrAfter(log.logDate, bfDate)) continue
        if (isReceivedLog(log, args.storeId)) balanceBf += logQuantity(log)
        if (isReleasedLog(log, args.storeId)) balanceBf -= logQuantity(log)
      }
    } else {
      for (const log of storeLogs) {
        if (!isBefore(log.logDate, args.startDate)) continue
        if (log.type === 'BALANCE_BF' && log.sourceStore?.id === args.storeId) balanceBf += logQuantity(log)
        if (isReceivedLog(log, args.storeId)) balanceBf += logQuantity(log)
        if (isReleasedLog(log, args.storeId)) balanceBf -= logQuantity(log)
      }
    }

    const weekLogs = storeLogs.filter((log) => inRange(log.logDate, args.startDate, args.endDate))
    const additionalStock = weekLogs
      .filter((log) => isReceivedLog(log, args.storeId))
      .reduce((sum, log) => sum + logQuantity(log), 0)

    const byDate: Record<string, number> = {}
    for (const day of days) byDate[day] = 0
    for (const log of weekLogs) {
      if (log.type !== 'CONSUMPTION' || log.sourceStore?.id !== args.storeId) continue
      if (!log.logDate || !(log.logDate in byDate)) continue
      byDate[log.logDate] = (byDate[log.logDate] ?? 0) + logQuantity(log)
    }

    const weekRelease = weekLogs
      .filter((log) => isReleasedLog(log, args.storeId))
      .reduce((sum, log) => sum + logQuantity(log), 0)
    const totalStock = balanceBf + additionalStock

    return {
      itemId: item.id,
      itemName: item.name,
      unitName: item.unit?.name ?? '',
      balanceBf,
      additionalStock,
      totalStock,
      byDate,
      weekRelease,
      closingBalance: totalStock - weekRelease,
    }
  })
}

function asQty(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function isStockTakeReportRow(row: unknown): row is StockTakeReportRow {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return false
  const candidate = row as Record<string, unknown>
  return (
    'openingBalance' in candidate ||
    'received' in candidate ||
    'dailyUsage' in candidate ||
    'weeklyLogs' in candidate ||
    ('totalStock' in candidate && !('type' in candidate) && !('logDate' in candidate))
  )
}

function itemNameFrom(item: StockTakeReportRow['item'], fallbackId: number): string {
  const name = item?.name?.trim() || item?.itemName?.trim()
  return name || `Item ${fallbackId}`
}

function dailyUsageToByDate(
  dailyUsage: Record<string, number> | null | undefined,
  days: string[],
): Record<string, number> {
  const byDate: Record<string, number> = {}
  for (const day of days) byDate[day] = 0
  if (!dailyUsage) return byDate

  for (const [key, raw] of Object.entries(dailyUsage)) {
    const qty = asQty(raw)
    const iso = key.slice(0, 10)
    if (iso in byDate) {
      byDate[iso] = (byDate[iso] ?? 0) + qty
      continue
    }
    const needle = key.trim().toUpperCase().slice(0, 3)
    const match = days.find((day) => weekdayLabel(day).toUpperCase().startsWith(needle))
    if (match) byDate[match] = (byDate[match] ?? 0) + qty
  }
  return byDate
}

function byDateFromLogs(logs: StockLog[], storeId: number, days: string[]): Record<string, number> {
  const byDate: Record<string, number> = {}
  for (const day of days) byDate[day] = 0
  for (const log of logs) {
    if (log.type !== 'CONSUMPTION' || log.sourceStore?.id !== storeId) continue
    const day = log.logDate?.slice(0, 10)
    if (!day || !(day in byDate)) continue
    byDate[day] = (byDate[day] ?? 0) + logQuantity(log)
  }
  return byDate
}

function mapAggregatedRow(
  row: StockTakeReportRow,
  days: string[],
  storeId: number,
  fallback?: StoreItem,
): StoreReportRow | null {
  const itemId = row.item?.id ?? fallback?.id
  if (!itemId) return null
  const logs = row.weeklyLogs ?? []
  const received = asQty(row.received ?? row.additionalStock)
  const balanceBf = asQty(row.openingBalance)
  const weekRelease = asQty(row.weekRelease)
  const totalStock = row.totalStock != null ? asQty(row.totalStock) : balanceBf + received
  const closingBalance = row.closingBalance != null ? asQty(row.closingBalance) : totalStock - weekRelease
  const usageEmpty = !row.dailyUsage || Object.keys(row.dailyUsage).length === 0
  const byDate = usageEmpty
    ? byDateFromLogs(logs, storeId, days)
    : dailyUsageToByDate(row.dailyUsage, days)

  return {
    itemId,
    itemName: itemNameFrom(row.item, itemId) || fallback?.name || `Item ${itemId}`,
    unitName: row.item?.unit?.name ?? fallback?.unit?.name ?? '',
    balanceBf,
    additionalStock: received,
    totalStock,
    byDate,
    weekRelease,
    closingBalance,
  }
}

/**
 * Builds the weekly sheet from `GET /api/store/stock-take`.
 *
 * Production may return aggregated rows (`received`, `openingBalance`, …).
 * `StoreController` in this repo still returns `StockLog[]` for the same route.
 */
export function rowsFromStockTake(args: {
  items: StoreItem[]
  payload: StockTakePayload[]
  storeId: number
  termId: number
  startDate: string
  endDate: string
}): StoreReportRow[] {
  const { items, payload, storeId, termId, startDate, endDate } = args
  const days = datesInRange(startDate, endDate)

  if (payload.some(isStockTakeReportRow)) {
    const byItem = new Map<number, StoreReportRow>()
    for (const row of payload) {
      if (!isStockTakeReportRow(row)) continue
      const mapped = mapAggregatedRow(row, days, storeId)
      if (mapped) byItem.set(mapped.itemId, mapped)
    }

    const seen = new Set<number>()
    const out: StoreReportRow[] = items.map((item) => {
      seen.add(item.id)
      return (
        byItem.get(item.id) ?? {
          itemId: item.id,
          itemName: item.name,
          unitName: item.unit?.name ?? '',
          balanceBf: 0,
          additionalStock: 0,
          totalStock: 0,
          byDate: Object.fromEntries(days.map((day) => [day, 0])),
          weekRelease: 0,
          closingBalance: 0,
        }
      )
    })
    for (const [id, row] of byItem) {
      if (!seen.has(id)) out.push(row)
    }
    return out
  }

  return computeStoreWeekReport({
    items,
    logs: payload as StockLog[],
    storeId,
    termId,
    startDate,
    endDate,
  })
}
