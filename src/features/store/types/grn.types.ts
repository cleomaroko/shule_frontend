import type { PurchaseOrder } from '@/features/finance/types/finance.types'
import type { Staff } from '@/features/staff/types/staff.types'
import type { StoreLocation } from '@/features/store/types/store.types'

/** `com.lyrt.shule.store.GrnItem` */
export interface GrnItem {
  description?: string | null
  quantityOrdered?: number | null
  quantityReceived?: number | null
}

/** `com.lyrt.shule.store.Grn` */
export interface Grn {
  id: number
  grnNumber?: string | null
  dateReceived?: string | null
  purchaseOrder?: Pick<PurchaseOrder, 'id' | 'poNumber'> | null
  destinationStore?: Pick<StoreLocation, 'id' | 'name'> | null
  deliveredBy?: string | null
  releasedBy?: string | null
  receivedBy?: Pick<Staff, 'id' | 'firstName' | 'secondName' | 'lastName'> | null
  recordedBy?: string | null
  remarks?: string | null
  items?: GrnItem[] | null
}

/** POST `/api/store/grn` — controller sets grnNumber and recordedBy. */
export interface CreateGrnPayload {
  purchaseOrder: { id: number }
  destinationStore: { id: number }
  dateReceived?: string
  deliveredBy?: string
  releasedBy?: string
  receivedBy?: { id: number }
  remarks?: string
  items: Array<{
    description: string
    quantityOrdered: number
    quantityReceived: number
  }>
}

export function grnHasShortage(item: GrnItem): boolean {
  const ordered = item.quantityOrdered ?? 0
  const received = item.quantityReceived ?? 0
  return received < ordered
}
