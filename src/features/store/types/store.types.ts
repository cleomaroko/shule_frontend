import type { Campus } from '@/features/lookups/lookups.types'

/** Seeded units (`DataInitializer`): Kg, Pcs, Liters, Bales. No list-units API. */
export interface ItemUnit {
  id: number
  name: string
}

export interface StoreItem {
  id: number
  name: string
  category?: string | null
  unit?: ItemUnit | null
}

export interface StoreItemWritePayload {
  name: string
  category: string
  unit: { id: number }
}

export interface AcademicYearRef {
  id: number
  name?: string | null
}

/** Nested term on a stock log. List via `GET /api/academic/terms`. Jackson may emit `current`. */
export interface TermRef {
  id: number
  name?: string | null
  academicYear?: AcademicYearRef | null
  current?: boolean
  isCurrent?: boolean
}

export const TRANSACTION_TYPES = ['ADDITION', 'TRANSFER', 'CONSUMPTION', 'BALANCE_BF'] as const

export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export interface StockLog {
  id: number
  item?: StoreItem | null
  campus?: Campus | null
  term?: TermRef | null
  quantity?: number | null
  type?: TransactionType | null
  logDate?: string | null
  systemTimestamp?: string | null
  recordedBy?: string | null
  receiptLink?: string | null
}

export interface StockLogCreatePayload {
  item: { id: number }
  campus?: { id: number }
  term: { id: number }
  quantity: number
  type: TransactionType
  logDate: string
  receiptLink?: string
}

/** `PUT /api/store/logs/{id}` copies only these three fields. */
export interface StockLogUpdatePayload {
  quantity: number
  logDate: string
  receiptLink?: string | null
}

export interface StoreReportRow {
  itemId: number
  itemName: string
  unitName: string
  balanceBf: number
  additionalStock: number
  totalStock: number
  byDate: Record<string, number>
  weekRelease: number
  closingBalance: number
}

export function transactionTypeLabel(type: TransactionType | null | undefined): string {
  switch (type) {
    case 'ADDITION':
      return 'Addition'
    case 'TRANSFER':
      return 'Transfer'
    case 'CONSUMPTION':
      return 'Consumption'
    case 'BALANCE_BF':
      return 'Balance B/F'
    default:
      return '—'
  }
}

export function termLabel(term: TermRef | null | undefined): string {
  if (!term) return '—'
  const year = term.academicYear?.name
  const name = term.name?.trim()
  if (name && year) return `${name} · ${year}`
  if (name) return name
  return `Term ${term.id}`
}

export function formatStoreQty(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function uniqueUnits(items: StoreItem[]): ItemUnit[] {
  const map = new Map<number, ItemUnit>()
  for (const item of items) {
    if (item.unit?.id) map.set(item.unit.id, item.unit)
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function uniqueCategories(items: StoreItem[]): string[] {
  const values = new Set<string>()
  for (const item of items) {
    const category = item.category?.trim()
    if (category) values.add(category)
  }
  return [...values].sort((a, b) => a.localeCompare(b))
}

export function defaultTermId(terms: TermRef[]): string {
  const current = terms.find((term) => term.current === true || term.isCurrent === true)
  const picked = current ?? terms[0]
  return picked ? String(picked.id) : ''
}

export function logQuantity(log: StockLog): number {
  if (typeof log.quantity === 'number' && Number.isFinite(log.quantity)) return log.quantity
  const parsed = Number(log.quantity)
  return Number.isFinite(parsed) ? parsed : 0
}
