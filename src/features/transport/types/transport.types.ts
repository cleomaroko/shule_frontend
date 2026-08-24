import type { TransportZone } from '@/features/logistics/types/logistics.types'
import type { Staff } from '@/features/staff/types/staff.types'

export const VEHICLE_TYPES = ['BUS', 'VAN', 'GENERATOR'] as const
export const FUEL_TYPES = ['Petrol', 'Diesel'] as const
export const VEHICLE_STATUSES = ['ACTIVE', 'UNDER_REPAIR', 'DISPOSED'] as const
export const VEHICLE_LOG_TYPES = ['REFUELING', 'TRIP', 'SERVICE'] as const

export type VehicleType = (typeof VEHICLE_TYPES)[number]
export type FuelType = (typeof FUEL_TYPES)[number]
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]
export type VehicleLogType = (typeof VEHICLE_LOG_TYPES)[number]

export interface Vehicle {
  id: number
  numberPlate: string
  vehicleType: string | null
  capacity: number | null
  makeModel: string | null
  dateAcquired: string | null
  fuelType: string | null
  status: string | null
}

export interface VehicleWritePayload {
  numberPlate: string
  vehicleType?: string
  capacity?: number | null
  makeModel?: string | null
  dateAcquired?: string | null
  fuelType?: string | null
  status?: string
}

export type LogDriver = Pick<Staff, 'id' | 'firstName' | 'secondName' | 'lastName' | 'staffNumber'>

export interface VehicleLog {
  id: number
  vehicle?: Vehicle | null
  driver?: LogDriver | null
  mileageBefore?: number | null
  mileageAfter?: number | null
  fuelQuantityLitres?: number | null
  fuelCost?: number | null
  logType?: string | null
  logTimestamp?: string | null
  /** Jackson getter on VehicleLog. Display only — never POST/PUT. */
  efficiency?: number | null
}

export interface VehicleLogWritePayload {
  vehicle: { id: number }
  driver?: { id: number }
  mileageBefore?: number | null
  mileageAfter?: number | null
  fuelQuantityLitres?: number | null
  fuelCost?: number | null
  logType: string
}

export interface BusStop {
  id: number
  stopName: string | null
  stopCode: string | null
  zone?: TransportZone | null
}

export interface BusStopWritePayload {
  stopName: string
  stopCode?: string | null
  zone?: { id: number }
}

export function vehicleTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case 'BUS':
      return 'Bus'
    case 'VAN':
      return 'Van'
    case 'GENERATOR':
      return 'Generator'
    default:
      return type?.trim() || '—'
  }
}

export function vehicleLogTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case 'REFUELING':
      return 'Refueling'
    case 'TRIP':
      return 'Trip'
    case 'SERVICE':
      return 'Service'
    default:
      return type?.trim() || '—'
  }
}

export function formatLitres(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} L`
}

export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
}

export function formatEfficiency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} km/L`
}

export function formatMoneyKes(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `KES ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}
