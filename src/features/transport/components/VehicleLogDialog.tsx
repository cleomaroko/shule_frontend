import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Staff } from '@/features/staff/types/staff.types'
import {
  VEHICLE_LOG_TYPES,
  vehicleLogTypeLabel,
  type Vehicle,
  type VehicleLog,
  type VehicleLogWritePayload,
} from '@/features/transport/types/transport.types'
import { formatPersonName } from '@/lib/format'

export interface VehicleLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: VehicleLog | null
  vehicles: Vehicle[]
  drivers: Staff[]
  isSaving: boolean
  onSubmit: (body: VehicleLogWritePayload) => void
}

interface FormState {
  vehicleId: string
  driverId: string
  logType: string
  mileageBefore: string
  mileageAfter: string
  fuelQuantityLitres: string
  fuelCost: string
}

function emptyForm(vehicles: Vehicle[]): FormState {
  return {
    vehicleId: vehicles[0] ? String(vehicles[0].id) : '',
    driverId: '',
    logType: 'REFUELING',
    mileageBefore: '',
    mileageAfter: '',
    fuelQuantityLitres: '',
    fuelCost: '',
  }
}

function formFromLog(log: VehicleLog): FormState {
  return {
    vehicleId: log.vehicle?.id ? String(log.vehicle.id) : '',
    driverId: log.driver?.id ? String(log.driver.id) : '',
    logType: log.logType || 'REFUELING',
    mileageBefore: log.mileageBefore == null ? '' : String(log.mileageBefore),
    mileageAfter: log.mileageAfter == null ? '' : String(log.mileageAfter),
    fuelQuantityLitres: log.fuelQuantityLitres == null ? '' : String(log.fuelQuantityLitres),
    fuelCost: log.fuelCost == null ? '' : String(log.fuelCost),
  }
}

function optionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function VehicleLogDialog({
  open,
  onOpenChange,
  editing,
  vehicles,
  drivers,
  isSaving,
  onSubmit,
}: VehicleLogDialogProps): ReactNode {
  const [form, setForm] = useState<FormState>(() => emptyForm(vehicles))
  const isRefuel = form.logType === 'REFUELING'

  useEffect(() => {
    if (!open) return
    setForm(editing ? formFromLog(editing) : emptyForm(vehicles))
  }, [editing, open, vehicles])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const vehicleId = Number(form.vehicleId)
    if (!vehicleId || !form.logType) return
    const body: VehicleLogWritePayload = {
      vehicle: { id: vehicleId },
      logType: form.logType,
      mileageBefore: optionalNumber(form.mileageBefore),
      mileageAfter: optionalNumber(form.mileageAfter),
      fuelQuantityLitres: optionalNumber(form.fuelQuantityLitres),
      fuelCost: optionalNumber(form.fuelCost),
    }
    const driverId = Number(form.driverId)
    if (driverId) body.driver = { id: driverId }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>{editing ? 'Edit vehicle log' : 'Record vehicle log'}</DialogTitle>
            <DialogDescription>
              {isRefuel
                ? 'Refueling stores litres and cost. Efficiency is (mileage after − before) ÷ litres.'
                : 'Trips and services record mileage. Fuel fields are optional.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            <SelectField
              label="Vehicle"
              value={form.vehicleId}
              onChange={(value) => setForm((current) => ({ ...current, vehicleId: value }))}
              options={vehicles.map((vehicle) => ({
                value: String(vehicle.id),
                label: [vehicle.numberPlate, vehicle.makeModel].filter(Boolean).join(' · '),
              }))}
              placeholder="Select vehicle"
              allowEmpty={false}
            />
            <SelectField
              label="Driver"
              value={form.driverId}
              onChange={(value) => setForm((current) => ({ ...current, driverId: value }))}
              options={drivers.map((staff) => ({
                value: String(staff.id),
                label: [formatPersonName(staff), staff.staffNumber].filter(Boolean).join(' · '),
              }))}
              placeholder="Select driver"
              emptyLabel="Not set"
            />
            <SelectField
              label="Log type"
              value={form.logType}
              onChange={(value) => setForm((current) => ({ ...current, logType: value || 'REFUELING' }))}
              options={VEHICLE_LOG_TYPES.map((type) => ({
                value: type,
                label: vehicleLogTypeLabel(type),
              }))}
              allowEmpty={false}
            />
            <TextField
              label="Mileage before"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={form.mileageBefore}
              onChange={(event) => setForm((current) => ({ ...current, mileageBefore: event.target.value }))}
            />
            <TextField
              label="Mileage after"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={form.mileageAfter}
              onChange={(event) => setForm((current) => ({ ...current, mileageAfter: event.target.value }))}
            />
            <TextField
              label="Fuel quantity (litres)"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.fuelQuantityLitres}
              onChange={(event) => setForm((current) => ({ ...current, fuelQuantityLitres: event.target.value }))}
              hint={isRefuel ? 'Used with mileage to compute km per litre.' : undefined}
            />
            <TextField
              label="Fuel cost"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.fuelCost}
              onChange={(event) => setForm((current) => ({ ...current, fuelCost: event.target.value }))}
            />
          </div>
          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              {editing ? 'Save log' : 'Record log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
