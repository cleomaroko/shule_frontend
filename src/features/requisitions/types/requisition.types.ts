import type { Campus, Department } from '@/features/lookups/lookups.types'
import type { Staff } from '@/features/staff/types/staff.types'
import type { ItemUnit, StoreItem, StoreLocation } from '@/features/store/types/store.types'
import type { Supplier } from '@/features/suppliers/types/supplier.types'

/** `com.lyrt.shule.requisition.Requisition.RequisitionType` */
export const REQUISITION_TYPES = [
  'INTERNAL_STORE_TRANSFER',
  'STORE_ISSUANCE',
  'PURCHASE_SUPPLIER',
  'SERVICE_EXPENSE',
  'MIXED_CAMPUS_EVENT',
] as const

export type RequisitionType = (typeof REQUISITION_TYPES)[number]

/** `com.lyrt.shule.requisition.Requisition.RequisitionStatus` */
export const REQUISITION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'REVIEWED',
  'APPROVED',
  'RECEIVED',
  'REJECTED',
] as const

export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number]

/** `com.lyrt.shule.requisition.RequisitionItem.FulfillmentSource` */
export const FULFILLMENT_SOURCES = ['STORE_INVENTORY', 'DIRECT_PURCHASE', 'SERVICE'] as const

export type FulfillmentSource = (typeof FULFILLMENT_SOURCES)[number]

/** `com.lyrt.shule.requisition.CostCenter` */
export interface CostCenter {
  id: number
  name: string
}

export type StaffRef = Pick<Staff, 'id' | 'firstName' | 'secondName' | 'lastName' | 'workEmail'>

export interface RequisitionItem {
  id: number
  storeItem?: Pick<StoreItem, 'id' | 'name'> | null
  description?: string | null
  quantity?: number | null
  unit?: Pick<ItemUnit, 'id' | 'name'> | null
  unitPrice?: number | string | null
  totalPrice?: number | string | null
  fulfillmentSource?: FulfillmentSource | null
}

/** `com.lyrt.shule.requisition.Requisition` */
export interface Requisition {
  id: number
  requisitionNumber?: string | null
  requisitionDate?: string | null
  type?: RequisitionType | null
  status?: RequisitionStatus | null
  campus?: Campus | null
  department?: Department | null
  costCenter?: CostCenter | null
  sourceStore?: Pick<StoreLocation, 'id' | 'name'> | null
  destinationStore?: Pick<StoreLocation, 'id' | 'name'> | null
  supplier?: Pick<Supplier, 'id' | 'name'> | null
  items?: RequisitionItem[] | null
  totalEstimatedAmount?: number | string | null
  approvedAmount?: number | string | null
  documentUrl?: string | null
  purpose?: string | null
  rejectionReason?: string | null
  createdBy?: StaffRef | null
  createdAt?: string | null
  reviewedBy?: StaffRef | null
  reviewedAt?: string | null
  reviewComment?: string | null
  approvedBy?: StaffRef | null
  approvedAt?: string | null
  approvalComment?: string | null
  receivedBy?: StaffRef | null
  receivedAt?: string | null
}

/** `com.lyrt.shule.requisition.CreateRequisitionRequest` */
export interface CreateRequisitionPayload {
  requisitionDate?: string
  type: RequisitionType
  campusId?: number
  departmentId?: number
  costCenterId?: number
  sourceStoreId?: number
  destinationStoreId?: number
  supplierId?: number
  purpose: string
  documentUrl?: string
  items: CreateRequisitionItemPayload[]
}

export interface CreateRequisitionItemPayload {
  storeItemId?: number
  description: string
  quantity: number
  unitId?: number
  unitPrice?: number
  fulfillmentSource?: FulfillmentSource
}

/** `com.lyrt.shule.requisition.WorkflowActionRequest` */
export interface WorkflowActionPayload {
  comment?: string
  approvedAmount?: number
  reason?: string
}

/** Query params for `GET /api/requisitions` and `GET /api/requisitions/reports/summary`. */
export interface RequisitionQuery {
  status?: RequisitionStatus
  type?: RequisitionType
  campusId?: number
  departmentId?: number
  costCenterId?: number
  staffId?: number
  startDate?: string
  endDate?: string
}

/** `com.lyrt.shule.requisition.RequisitionReportSummary` */
export interface RequisitionReportSummary {
  totalRequisitions?: number | null
  grandTotalEstimated?: number | string | null
  grandTotalApproved?: number | string | null
  costByCostCenter?: Record<string, number | string> | null
  costByCampus?: Record<string, number | string> | null
  requisitions?: Requisition[] | null
}

export function requisitionTypeLabel(type: RequisitionType | null | undefined): string {
  switch (type) {
    case 'INTERNAL_STORE_TRANSFER':
      return 'Internal store transfer'
    case 'STORE_ISSUANCE':
      return 'Store issuance'
    case 'PURCHASE_SUPPLIER':
      return 'Purchase (supplier)'
    case 'SERVICE_EXPENSE':
      return 'Service / expense'
    case 'MIXED_CAMPUS_EVENT':
      return 'Mixed campus event'
    default:
      return '—'
  }
}

export function requisitionStatusLabel(status: RequisitionStatus | null | undefined): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft'
    case 'SUBMITTED':
      return 'Submitted'
    case 'REVIEWED':
      return 'Reviewed'
    case 'APPROVED':
      return 'Approved'
    case 'RECEIVED':
      return 'Received'
    case 'REJECTED':
      return 'Rejected'
    default:
      return '—'
  }
}

export function fulfillmentLabel(source: FulfillmentSource | null | undefined): string {
  switch (source) {
    case 'STORE_INVENTORY':
      return 'Store inventory'
    case 'DIRECT_PURCHASE':
      return 'Direct purchase'
    case 'SERVICE':
      return 'Service'
    default:
      return '—'
  }
}

export function defaultFulfillment(type: RequisitionType): FulfillmentSource {
  switch (type) {
    case 'INTERNAL_STORE_TRANSFER':
    case 'STORE_ISSUANCE':
    case 'MIXED_CAMPUS_EVENT':
      return 'STORE_INVENTORY'
    case 'SERVICE_EXPENSE':
      return 'SERVICE'
    default:
      return 'DIRECT_PURCHASE'
  }
}

export function asMoney(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function formatKes(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const amount = asMoney(value)
  if (!Number.isFinite(amount)) return '—'
  return `KES ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export function statusBadgeVariant(status: RequisitionStatus | null | undefined) {
  switch (status) {
    case 'APPROVED':
    case 'RECEIVED':
      return 'success' as const
    case 'REVIEWED':
      return 'warning' as const
    case 'REJECTED':
      return 'destructive' as const
    case 'SUBMITTED':
      return 'primary' as const
    default:
      return 'neutral' as const
  }
}

export function todayIso(from = new Date()): string {
  const month = String(from.getMonth() + 1).padStart(2, '0')
  const day = String(from.getDate()).padStart(2, '0')
  return `${from.getFullYear()}-${month}-${day}`
}
