import type { StockLog, StoreItem, StoreReportRow } from '@/features/store/types/store.types'
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
  if (log.type === 'TRANSFER' && log.destinationStore?.id === storeId) return true
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
