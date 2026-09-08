import type { Campus, Department } from '@/features/lookups/lookups.types'
import type { Learner } from '@/features/learners/types/learner.types'
import type { Staff } from '@/features/staff/types/staff.types'
import type { Supplier } from '@/features/suppliers/types/supplier.types'

/** `com.lyrt.shule.store.ItemUnit` — `GET /api/store/units`. */
export interface ItemUnit {
  id: number
  name: string
}

export interface ItemUnitWritePayload {
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

export const TRANSFER_STATUSES = ['PENDING', 'RECEIVED'] as const
export type TransferStatus = (typeof TRANSFER_STATUSES)[number]

export const BATCH_STATUSES = ['AVAILABLE', 'EXPIRED', 'CONSUMED'] as const
export type BatchStatus = (typeof BATCH_STATUSES)[number]

export interface ExpiryBatchInput {
  quantity: number
  expiryDate: string
}

export interface ItemBatch {
  id: number
  item?: StoreItem | null
  store?: StoreLocation | null
  quantity?: number | null
  expiryDate?: string | null
  addedDate?: string | null
  status?: string | null
}

export interface ExpiryReportQuery {
  itemId?: number
  storeId?: number
  status?: string
}

export interface StockLog {
  id: number
  sourceStore?: StoreLocation | null
  destinationStore?: StoreLocation | null
  item?: StoreItem | null
  term?: TermRef | null
  expiryDate?: string | null
  status?: TransferStatus | null
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
  /** ADDITION only. Read by `StoreController.recordTransaction`. */
  expiryBatches?: ExpiryBatchInput[]
}

/** `PUT /api/store/logs/{id}` copies quantity only. */
export interface StockLogUpdatePayload {
  quantity: number
}

export interface StoreReportRow {
  itemId: number
  itemName: string
  unitName: string
  categoryName: string
  parentCategoryName: string
  balanceBf: number
  additionalStock: number
  totalStock: number
  byDate: Record<string, number>
  weekRelease: number
  closingBalance: number
  weeklyLogs: StockLog[]
  item?: StoreItem | null
}

/**
 * Aggregated weekly row returned by some deployments of `GET /api/store/stock-take`.
 * Local `StoreController` still returns `StockLog[]`; production may return these instead.
 */
export interface StockTakeReportRow {
  item?: (StoreItem & { itemName?: string | null }) | null
  openingBalance?: number | null
  received?: number | null
  additionalStock?: number | null
  totalStock?: number | null
  weekRelease?: number | null
  closingBalance?: number | null
  dailyUsage?: Record<string, number> | null
  weeklyLogs?: StockLog[] | null
}

export type StockTakePayload = StockTakeReportRow | StockLog

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

export function transferStatusLabel(status: TransferStatus | null | undefined): string {
  switch (status) {
    case 'PENDING':
      return 'Pending receipt'
    case 'RECEIVED':
      return 'Received'
    default:
      return '—'
  }
}

export function isPendingTransfer(log: Pick<StockLog, 'type' | 'status'>): boolean {
  return log.type === 'TRANSFER' && log.status === 'PENDING'
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
