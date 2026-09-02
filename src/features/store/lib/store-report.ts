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

function isIncomingTransfer(log: StockLog, storeId: number): boolean {
  return log.type === 'TRANSFER' && log.destinationStore?.id === storeId
}

function isOutgoingFromStore(log: StockLog, storeId: number): boolean {
  return log.sourceStore?.id === storeId
}

/**
 * Weekly sheet for a store.
 *
 * Balance B/F and consumption use this store as `sourceStore`. Additional stock
 * is incoming `TRANSFER` where this store is `destinationStore`, plus `ADDITION`
 * recorded against this store.
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
    const itemLogs = args.logs.filter((log) => log.item?.id === item.id)
    const storeLogs = itemLogs.filter(
      (log) => isOutgoingFromStore(log, args.storeId) || isIncomingTransfer(log, args.storeId),
    )
    const termBf = storeLogs.find(
      (log) => log.type === 'BALANCE_BF' && log.term?.id === args.termId && isOutgoingFromStore(log, args.storeId),
    )

    let balanceBf = 0
    if (termBf) {
      balanceBf = logQuantity(termBf)
      const bfDate = termBf.logDate ?? ''
      for (const log of storeLogs) {
        if (log.id === termBf.id) continue
        if (!isBefore(log.logDate, args.startDate)) continue
        if (bfDate && !isOnOrAfter(log.logDate, bfDate)) continue
        if (log.type === 'ADDITION' && isOutgoingFromStore(log, args.storeId)) balanceBf += logQuantity(log)
        if (isIncomingTransfer(log, args.storeId)) balanceBf += logQuantity(log)
        if (log.type === 'CONSUMPTION' && isOutgoingFromStore(log, args.storeId)) balanceBf -= logQuantity(log)
        if (log.type === 'TRANSFER' && isOutgoingFromStore(log, args.storeId)) balanceBf -= logQuantity(log)
      }
    } else {
      for (const log of storeLogs) {
        if (!isBefore(log.logDate, args.startDate)) continue
        if (log.type === 'BALANCE_BF' && isOutgoingFromStore(log, args.storeId)) balanceBf += logQuantity(log)
        if (log.type === 'ADDITION' && isOutgoingFromStore(log, args.storeId)) balanceBf += logQuantity(log)
        if (isIncomingTransfer(log, args.storeId)) balanceBf += logQuantity(log)
        if (log.type === 'CONSUMPTION' && isOutgoingFromStore(log, args.storeId)) balanceBf -= logQuantity(log)
        if (log.type === 'TRANSFER' && isOutgoingFromStore(log, args.storeId)) balanceBf -= logQuantity(log)
      }
    }

    const weekLogs = storeLogs.filter((log) => inRange(log.logDate, args.startDate, args.endDate))
    const additionalStock = weekLogs
      .filter(
        (log) =>
          isIncomingTransfer(log, args.storeId) ||
          (log.type === 'ADDITION' && isOutgoingFromStore(log, args.storeId)),
      )
      .reduce((sum, log) => sum + logQuantity(log), 0)

    const byDate: Record<string, number> = {}
    for (const day of days) byDate[day] = 0
    for (const log of weekLogs) {
      if (log.type !== 'CONSUMPTION' || !isOutgoingFromStore(log, args.storeId)) continue
      if (!log.logDate || !(log.logDate in byDate)) continue
      byDate[log.logDate] = (byDate[log.logDate] ?? 0) + logQuantity(log)
    }

    const weekRelease = days.reduce((sum, day) => sum + (byDate[day] ?? 0), 0)
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
