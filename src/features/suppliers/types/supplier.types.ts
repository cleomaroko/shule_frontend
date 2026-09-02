import type { NamedLookup } from '@/features/lookups/lookups.types'

export interface SupplierBusinessType {
  id: number
  name: string
}

/**
 * `com.lyrt.shule.supplier.Supplier`
 * Lombok `boolean isActive` may serialize as `active`.
 */
export interface Supplier {
  id: number
  supplierCode: string | null
  name: string
  businessType: SupplierBusinessType | null
  physicalAddress: string | null
  postalAddress: string | null
  emailAddress: string | null
  phoneNumber: string | null
  bank: NamedLookup | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  mpesaNumber: string | null
  comments: string | null
  isActive?: boolean
  active?: boolean
}

export interface SupplierWritePayload {
  name: string
  supplierCode?: string
  businessType?: { id: number }
  physicalAddress?: string | null
  postalAddress?: string | null
  emailAddress?: string | null
  phoneNumber?: string | null
  bank?: { id: number }
  bankAccountName?: string | null
  bankAccountNumber?: string | null
  mpesaNumber?: string | null
  comments?: string | null
  isActive: boolean
  active: boolean
}

export const CONTRACT_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED'] as const
export type ContractStatus = (typeof CONTRACT_STATUSES)[number]

export interface SupplierContract {
  id: number
  supplier?: Supplier | null
  description: string | null
  startDate: string | null
  endDate: string | null
  status: string | null
  comments: string | null
  /** Jackson getter `isExpired()`. Display only. */
  expired?: boolean
}

export interface SupplierContractWritePayload {
  supplier: { id: number }
  description: string
  startDate: string
  endDate: string
  status: string
  comments?: string
}

export function supplierIsActive(supplier: Pick<Supplier, 'isActive' | 'active'>): boolean {
  if (supplier.isActive === false || supplier.active === false) return false
  return supplier.isActive === true || supplier.active === true || (supplier.isActive == null && supplier.active == null)
}

export function contractIsExpired(contract: SupplierContract, todayIso: string): boolean {
  if (contract.expired === true) return true
  if (!contract.endDate) return false
  return contract.endDate < todayIso
}
