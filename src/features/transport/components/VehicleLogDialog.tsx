import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
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
  type VehicleLogWritePayload,
  type VehicleServiceType,
} from '@/features/transport/types/transport.types'
import { formatPersonName } from '@/lib/format'

export interface VehicleLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: Vehicle[]
  drivers: Staff[]
  serviceTypes: VehicleServiceType[]
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
  serviceTypeId: string
  serviceCost: string
  serviceDate: string
  mileageAtService: string
  nextServiceDate: string
  serviceReport: string
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
    serviceTypeId: '',
    serviceCost: '',
    serviceDate: '',
    mileageAtService: '',
    nextServiceDate: '',
    serviceReport: '',
  }
}

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function VehicleLogDialog({
  open,
  onOpenChange,
  vehicles,
  drivers,
  serviceTypes,
  isSaving,
  onSubmit,
}: VehicleLogDialogProps): ReactNode {
  const [form, setForm] = useState<FormState>(() => emptyForm(vehicles))
  const isService = form.logType === 'SERVICE'
  const isRefuel = form.logType === 'REFUELING'

  useEffect(() => {
    if (!open) return
    setForm(emptyForm(vehicles))
  }, [open, vehicles])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const vehicleId = Number(form.vehicleId)
    if (!vehicleId || !form.logType) return
    const body: VehicleLogWritePayload = {
      vehicle: { id: vehicleId },
      logType: form.logType,
    }
    const driverId = Number(form.driverId)
    if (driverId) body.driver = { id: driverId }

    if (isService) {
      const serviceTypeId = Number(form.serviceTypeId)
      if (serviceTypeId) body.serviceType = { id: serviceTypeId }
      const serviceCost = optionalNumber(form.serviceCost)
      if (serviceCost !== undefined) body.serviceCost = serviceCost
      if (form.serviceDate.trim()) body.serviceDate = form.serviceDate.trim()
      const mileageAtService = optionalNumber(form.mileageAtService)
      if (mileageAtService !== undefined) body.mileageAtService = mileageAtService
      if (form.nextServiceDate.trim()) body.nextServiceDate = form.nextServiceDate.trim()
      if (form.serviceReport.trim()) body.serviceReport = form.serviceReport.trim()
    } else {
      const mileageBefore = optionalNumber(form.mileageBefore)
      if (mileageBefore !== undefined) body.mileageBefore = mileageBefore
      const mileageAfter = optionalNumber(form.mileageAfter)
      if (mileageAfter !== undefined) body.mileageAfter = mileageAfter
      const litres = optionalNumber(form.fuelQuantityLitres)
      if (litres !== undefined) body.fuelQuantityLitres = litres
      const cost = optionalNumber(form.fuelCost)
      if (cost !== undefined) body.fuelCost = cost
    }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>Record vehicle log</DialogTitle>
            <DialogDescription>
              {isService
                ? 'Service records use service type, cost, dates, and a report. Serviced-by is snapshotted from the signed-in user.'
                : isRefuel
                  ? 'Refueling stores litres and cost. Efficiency is (mileage after − before) ÷ litres.'
                  : 'Trips record mileage. Fuel fields are optional.'}
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
              label="Log type"
              value={form.logType}
              onChange={(value) => setForm((current) => ({ ...current, logType: value || 'REFUELING' }))}
              options={VEHICLE_LOG_TYPES.map((type) => ({
                value: type,
                label: vehicleLogTypeLabel(type),
              }))}
              allowEmpty={false}
            />
            {!isService ? (
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
            ) : null}
            {isService ? (
              <>
                <SelectField
                  label="Service type"
                  value={form.serviceTypeId}
                  onChange={(value) => setForm((current) => ({ ...current, serviceTypeId: value }))}
                  options={serviceTypes.map((item) => ({ value: String(item.id), label: item.name }))}
                  placeholder={serviceTypes.length ? 'Select type' : 'No service types available'}
                  emptyMessage="No service types available"
                  emptyLabel="Not set"
                />
                <TextField
                  label="Service date"
                  type="date"
                  value={form.serviceDate}
                  onChange={(event) => setForm((current) => ({ ...current, serviceDate: event.target.value }))}
                />
                <TextField
                  label="Mileage at service"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  value={form.mileageAtService}
                  onChange={(event) => setForm((current) => ({ ...current, mileageAtService: event.target.value }))}
                />
                <TextField
                  label="Service cost"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.serviceCost}
                  onChange={(event) => setForm((current) => ({ ...current, serviceCost: event.target.value }))}
                />
                <TextField
                  label="Next service date"
                  type="date"
                  value={form.nextServiceDate}
                  onChange={(event) => setForm((current) => ({ ...current, nextServiceDate: event.target.value }))}
                />
                <TextareaField
                  label="Service report"
                  value={form.serviceReport}
                  onChange={(event) => setForm((current) => ({ ...current, serviceReport: event.target.value }))}
                  rows={3}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              Record log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
