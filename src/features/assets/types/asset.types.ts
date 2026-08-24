import type { Campus, Department } from '@/features/lookups/lookups.types'

/** `com.lyrt.shule.asset.AssetCategory` */
export interface AssetCategory {
  id: number
  name: string
}

/** Nested staff on an asset. Password must never be rendered or posted back. */
export interface AssetAssignee {
  id: number
  firstName: string | null
  secondName: string | null
  lastName: string | null
  staffNumber: string | null
}

/**
 * Asset as returned by `GET /api/assets`.
 * Source: `com.lyrt.shule.asset.Asset`.
 *
 * Lombok `boolean isDepreciable` may serialize as `isDepreciable` or `depreciable`.
 */
export interface Asset {
  id: number
  assetTagId: string
  description: string | null
  brand: string | null
  model: string | null
  serialNumber: string | null
  category: AssetCategory | null
  campus: Campus | null
  department: Department | null
  assignedTo: AssetAssignee | null
  purchaseDate: string | null
  costPrice: number | null
  assetCondition: string | null
  status: string | null
  isDepreciable?: boolean
  depreciable?: boolean
  assetLifeMonths: number | null
  salvageValue: number | null
  comments: string | null
  googleDrivePhotoLink: string | null
}

export interface AssetRelationRef {
  id: number
}

export interface AssetWritePayload {
  assetTagId?: string
  description?: string
  brand?: string
  model?: string
  serialNumber?: string
  category?: AssetRelationRef
  campus?: AssetRelationRef
  department?: AssetRelationRef
  assignedTo?: AssetRelationRef
  purchaseDate?: string
  costPrice?: number
  assetCondition?: string
  status?: string
  isDepreciable: boolean
  depreciable: boolean
  assetLifeMonths?: number
  salvageValue?: number
  comments?: string
  googleDrivePhotoLink?: string
}

export function assetIsDepreciable(asset: Pick<Asset, 'isDepreciable' | 'depreciable'>): boolean {
  return asset.isDepreciable === true || asset.depreciable === true
}

export function formatAssetMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount)) return String(value)
  return amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
