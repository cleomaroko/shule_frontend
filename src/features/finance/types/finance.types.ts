import type { Requisition } from '@/features/requisitions/types/requisition.types'
import type { Staff } from '@/features/staff/types/staff.types'
import type { Supplier } from '@/features/suppliers/types/supplier.types'

/** `com.lyrt.shule.finance.PurchaseOrder.status` */
export const PO_STATUSES = [
  'DRAFT',
  'PENDING_FINANCE_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SENT_TO_SUPPLIER',
] as const
export type PurchaseOrderStatus = (typeof PO_STATUSES)[number]

/** `com.lyrt.shule.finance.Invoice.status` */
export const INVOICE_STATUSES = ['UNPAID', 'PARTIALLY_PAID', 'PAID'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const PO_PAYMENT_METHODS = ['Bank Transfer', 'Mpesa', 'Cash', 'Cheque'] as const

/** `com.lyrt.shule.finance.PurchaseOrder` */
export interface PurchaseOrder {
  id: number
  poNumber?: string | null
  requisition?: Pick<Requisition, 'id' | 'requisitionNumber' | 'approvedAmount' | 'totalEstimatedAmount' | 'status'> | null
  supplier?: Pick<Supplier, 'id' | 'name'> | null
  status?: string | null
  paymentMethod?: string | null
  comments?: string | null
  approvedBy?: Pick<Staff, 'id' | 'firstName' | 'lastName'> | null
  approvedAt?: string | null
  createdAt?: string | null
}

/** POST `/api/finance` — controller overwrites poNumber and status. */
export interface CreatePurchaseOrderPayload {
  requisition: { id: number }
  supplier: { id: number }
  comments?: string
  paymentMethod?: string
}

/** `com.lyrt.shule.finance.Invoice` */
export interface Invoice {
  id: number
  purchaseOrder?: Pick<PurchaseOrder, 'id' | 'poNumber' | 'status'> | null
  invoiceNumber?: string | null
  totalAmount?: number | string | null
  amountPaid?: number | string | null
  dueDate?: string | null
  status?: string | null
  documentLink?: string | null
}

/** POST `/api/finance/invoices` — controller forces UNPAID. */
export interface CaptureInvoicePayload {
  purchaseOrder: { id: number }
  invoiceNumber: string
  totalAmount: number
  dueDate?: string
  documentLink?: string
}

/** GET `/api/finance/reports/summary` data map */
export interface FinanceSummary {
  totalApprovedCommitments?: number | string | null
  totalCashOutflow?: number | string | null
  pendingPayments?: number | string | null
}

export function poStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'PENDING_FINANCE_APPROVAL':
      return 'Pending finance approval'
    case 'APPROVED':
      return 'Approved'
    case 'REJECTED':
      return 'Rejected'
    case 'SENT_TO_SUPPLIER':
      return 'Sent to supplier'
    case 'DRAFT':
      return 'Draft'
    default:
      return status?.trim() || '—'
  }
}

export function invoiceStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'UNPAID':
      return 'Unpaid'
    case 'PARTIALLY_PAID':
      return 'Partially paid'
    case 'PAID':
      return 'Paid'
    default:
      return status?.trim() || '—'
  }
}

export function invoiceBadgeVariant(status: string | null | undefined) {
  switch (status) {
    case 'PAID':
      return 'success' as const
    case 'PARTIALLY_PAID':
      return 'warning' as const
    case 'UNPAID':
      return 'destructive' as const
    default:
      return 'neutral' as const
  }
}

export function poBadgeVariant(status: string | null | undefined) {
  switch (status) {
    case 'APPROVED':
      return 'success' as const
    case 'PENDING_FINANCE_APPROVAL':
      return 'warning' as const
    case 'REJECTED':
      return 'destructive' as const
    default:
      return 'neutral' as const
  }
}
