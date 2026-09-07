import type { TransportZone } from '@/features/logistics/types/logistics.types'
import type { Learner } from '@/features/learners/types/learner.types'
import type { Staff } from '@/features/staff/types/staff.types'

export const VEHICLE_TYPES = ['BUS', 'VAN', 'GENERATOR'] as const
export const FUEL_TYPES = ['Petrol', 'Diesel'] as const
export const VEHICLE_STATUSES = ['ACTIVE', 'UNDER_REPAIR', 'DISPOSED'] as const
export const VEHICLE_LOG_TYPES = ['REFUELING', 'TRIP', 'SERVICE'] as const
export const TRIP_TYPES = ['MORNING', 'MORNING_2ND', 'AFTERNOON'] as const
export type TripType = (typeof TRIP_TYPES)[number]

export type VehicleType = (typeof VEHICLE_TYPES)[number]
export type FuelType = (typeof FUEL_TYPES)[number]
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]
export type VehicleLogType = (typeof VEHICLE_LOG_TYPES)[number]

export interface VehicleServiceType {
  id: number
  name: string
}

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
  logType?: string | null
  mileageBefore?: number | null
  mileageAfter?: number | null
  fuelQuantityLitres?: number | null
  fuelCost?: number | null
  serviceType?: VehicleServiceType | null
  serviceCost?: number | null
  serviceDate?: string | null
  mileageAtService?: number | null
  nextServiceDate?: string | null
  servicedByName?: string | null
  serviceReport?: string | null
  createdAt?: string | null
  /** Trip tank readings. Backend stores a 0–1 fraction. */
  fuelLevelBefore?: number | null
  fuelLevelAfter?: number | null
  /** Jackson getter on VehicleLog. Display only — never POST. */
  efficiency?: number | null
}

export interface VehicleLogWritePayload {
  vehicle: { id: number }
  driver?: { id: number }
  logType: string
  mileageBefore?: number | null
  mileageAfter?: number | null
  fuelQuantityLitres?: number | null
  fuelCost?: number | null
  fuelLevelBefore?: number | null
  fuelLevelAfter?: number | null
  serviceType?: { id: number }
  serviceCost?: number | null
  serviceDate?: string | null
  mileageAtService?: number | null
  nextServiceDate?: string | null
  serviceReport?: string | null
}

export interface VehicleLogQuery {
  logType?: string
  vehicleId?: number
  driverId?: number
  serviceTypeId?: number
  start?: string
  end?: string
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

export interface ExternalHire {
  id: number
  vehicleBeingReplaced?: Vehicle | null
  hiredVehiclePlate?: string | null
  numberOfTrips?: number | null
  distanceCovered?: number | null
  fuelCosts?: number | null
  chargesWages?: number | null
  totalCost?: number | null
  hireDate?: string | null
  comment?: string | null
}

export interface ExternalHireWritePayload {
  vehicleBeingReplaced: { id: number }
  hiredVehiclePlate: string
  numberOfTrips?: number | null
  distanceCovered?: number | null
  fuelCosts: number
  chargesWages: number
  hireDate: string
  comment?: string
}

export interface TransportAssignment {
  id: number
  learner?: Pick<Learner, 'id' | 'firstName' | 'middleName' | 'lastName' | 'admissionNumber'> | null
  vehicle?: Vehicle | null
  stop?: BusStop | null
  tripType?: string | null
  term?: string | null
  active?: boolean
  isActive?: boolean
}

export interface TransportAssignmentWritePayload {
  learner: { id: number }
  vehicle: { id: number }
  stop: { id: number }
  tripType: string
  term: string
}

export interface TransportAssignmentQuery {
  vehicleId: number
  tripType: string
  term: string
}

export function assignmentIsActive(row: TransportAssignment): boolean {
  return row.active !== false && row.isActive !== false
}

/** Persistable term string matching the controller example (`Term 3 2026`). */
export function transportTermKey(term: {
  name?: string | null
  academicYear?: { name?: string | null } | null
}): string {
  const name = term.name?.trim() ?? ''
  const year = term.academicYear?.name?.trim() ?? ''
  return [name, year].filter(Boolean).join(' ')
}

export function tripTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case 'MORNING':
      return 'Morning'
    case 'MORNING_2ND':
      return 'Morning 2nd'
    case 'AFTERNOON':
      return 'Afternoon'
    default:
      return type?.trim() || '—'
  }
}

/** Display a 0–1 tank fraction as a percent. Values above 1 are shown as entered. */
export function formatFuelLevel(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  if (value >= 0 && value <= 1) return `${Math.round(value * 100)}%`
  return String(value)
}

export function formatMoneyKes(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `KES ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}
