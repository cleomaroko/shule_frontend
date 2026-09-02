import type { Campus, Department } from '@/features/lookups/lookups.types'
import type { Learner } from '@/features/learners/types/learner.types'
import type { Staff } from '@/features/staff/types/staff.types'
import type { Supplier } from '@/features/suppliers/types/supplier.types'

/** Seeded units (`DataInitializer`). No list-units API. */
export interface ItemUnit {
  id: number
  name: string
}

export interface InventoryCategory {
  id: number
  name: string
  code: string | null
  parentCategory?: InventoryCategory | null
}

/**
 * `com.lyrt.shule.store.Store`
 * Lombok `boolean isMainStore` may serialize as `mainStore`.
 */
export interface StoreLocation {
  id: number
  name: string
  code: string | null
  isMainStore?: boolean
  mainStore?: boolean
  campus: Campus | null
  defaultRequisitionLimit: number | null
  defaultDispensingLimit: number | null
}

export interface StoreLocationWritePayload {
  name: string
  code?: string
  isMainStore: boolean
  mainStore: boolean
  campus?: { id: number }
  defaultRequisitionLimit?: number
  defaultDispensingLimit?: number
}

export interface InventoryCategoryWritePayload {
  name: string
  code?: string
  parentCategory?: { id: number }
}

export interface StoreItem {
  id: number
  name: string
  itemCode?: string | null
  price?: number | null
  category?: InventoryCategory | null
  unit?: ItemUnit | null
}

export interface StoreItemWritePayload {
  name: string
  itemCode?: string
  price?: number
  category?: { id: number }
  unit?: { id: number }
}

export interface AcademicYearRef {
  id: number
  name?: string | null
}

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
  sourceStore?: StoreLocation | null
  destinationStore?: StoreLocation | null
  item?: StoreItem | null
  term?: TermRef | null
  quantity?: number | null
  type?: TransactionType | null
  issuedToStaff?: Pick<Staff, 'id' | 'firstName' | 'secondName' | 'lastName'> | null
  issuedToLearner?: Pick<Learner, 'id' | 'firstName' | 'middleName' | 'lastName'> | null
  issuedToDept?: Department | null
  supplier?: Pick<Supplier, 'id' | 'name'> | null
  logDate?: string | null
  systemTimestamp?: string | null
  recordedBy?: string | null
  receiptLink?: string | null
}

export interface StockLogCreatePayload {
  item: { id: number }
  sourceStore: { id: number }
  destinationStore?: { id: number }
  term?: { id: number }
  quantity: number
  type: TransactionType
  logDate: string
  supplier?: { id: number }
  issuedToStaff?: { id: number }
  issuedToLearner?: { id: number }
  issuedToDept?: { id: number }
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

export function storeIsMain(store: Pick<StoreLocation, 'isMainStore' | 'mainStore'> | null | undefined): boolean {
  return store?.isMainStore === true || store?.mainStore === true
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

/** Seeded in `DataInitializer` when the units table is empty. No list-units API. */
export const SEEDED_ITEM_UNITS: ItemUnit[] = [
  { id: 1, name: 'Kg' },
  { id: 2, name: 'Pcs' },
  { id: 3, name: 'Liters' },
  { id: 4, name: 'Bales' },
]

export function uniqueUnits(items: StoreItem[]): ItemUnit[] {
  const map = new Map<number, ItemUnit>()
  for (const item of items) {
    if (item.unit?.id) map.set(item.unit.id, item.unit)
  }
  if (map.size === 0) {
    for (const unit of SEEDED_ITEM_UNITS) map.set(unit.id, unit)
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
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

export function issuedToLabel(log: StockLog): string {
  if (log.issuedToStaff) {
    return [log.issuedToStaff.firstName, log.issuedToStaff.lastName].filter(Boolean).join(' ')
  }
  if (log.issuedToLearner) {
    return [log.issuedToLearner.firstName, log.issuedToLearner.lastName].filter(Boolean).join(' ')
  }
  if (log.issuedToDept?.name) return log.issuedToDept.name
  if (log.supplier?.name) return log.supplier.name
  return '—'
}
