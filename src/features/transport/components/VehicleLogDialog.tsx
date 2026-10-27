import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

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
  formatEfficiency,
  formatKm,
  vehicleLogTypeLabel,
  type Vehicle,
  type VehicleLog,
  type VehicleLogWritePayload,
  type VehicleServiceType,
} from '@/features/transport/types/transport.types'
import { formatPersonName, todayIso } from '@/lib/format'

export interface VehicleLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: Vehicle[]
  drivers: Staff[]
  serviceTypes: VehicleServiceType[]
  editing?: VehicleLog | null
  isSaving: boolean
  onSubmit: (body: VehicleLogWritePayload) => void
}

interface FormState {
  vehicleId: string
  driverId: string
  logType: string
  logDate: string
  mileageBefore: string
  mileageAfter: string
  fuelQuantityLitres: string
  fuelCost: string
  fuelLevelBefore: string
  fuelLevelAfter: string
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
    logDate: todayIso(),
    mileageBefore: '',
    mileageAfter: '',
    fuelQuantityLitres: '',
    fuelCost: '',
    fuelLevelBefore: '',
    fuelLevelAfter: '',
    serviceTypeId: '',
    serviceCost: '',
    serviceDate: '',
    mileageAtService: '',
    nextServiceDate: '',
    serviceReport: '',
  }
}

function num(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value)
}

function fractionToPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  if (value >= 0 && value <= 1) return String(Math.round(value * 100))
  return String(value)
}

function formFromLog(log: VehicleLog, vehicles: Vehicle[]): FormState {
  const base = emptyForm(vehicles)
  return {
    ...base,
    vehicleId: log.vehicle?.id ? String(log.vehicle.id) : base.vehicleId,
    driverId: log.driver?.id ? String(log.driver.id) : '',
    logType: log.logType || 'REFUELING',
    logDate: log.logDate?.slice(0, 10) || log.serviceDate?.slice(0, 10) || todayIso(),
    mileageBefore: num(log.mileageBefore),
    mileageAfter: num(log.mileageAfter ?? log.mileageAtFueling),
    fuelQuantityLitres: num(log.fuelQuantityLitres),
    fuelCost: num(log.fuelCost),
    fuelLevelBefore: fractionToPercent(log.fuelLevelBefore),
    fuelLevelAfter: fractionToPercent(log.fuelLevelAfter),
    serviceTypeId: log.serviceType?.id ? String(log.serviceType.id) : '',
    serviceCost: num(log.serviceCost),
    serviceDate: log.serviceDate?.slice(0, 10) ?? '',
    mileageAtService: num(log.mileageAtService),
    nextServiceDate: log.nextServiceDate?.slice(0, 10) ?? '',
    serviceReport: log.serviceReport ?? '',
  }
}

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Converts a 0–100 tank percent to the 0–1 fraction the backend stores. */
function percentToFraction(value: string): number | undefined {
  const parsed = optionalNumber(value)
  if (parsed === undefined) return undefined
  if (parsed < 0 || parsed > 100) return undefined
  return parsed / 100
}

function isLikelyDriver(staff: Staff): boolean {
  const haystack = `${staff.department ?? ''} ${staff.systemRole ?? ''}`.toLowerCase()
  return haystack.includes('driver') || haystack.includes('transport')
}

export function VehicleLogDialog({
  open,
  onOpenChange,
  vehicles,
  drivers,
  serviceTypes,
  editing = null,
  isSaving,
  onSubmit,
}: VehicleLogDialogProps): ReactNode {
  const [form, setForm] = useState<FormState>(() => emptyForm(vehicles))
  const isService = form.logType === 'SERVICE'
  const isRefuel = form.logType === 'REFUELING'
  const isTrip = form.logType === 'TRIP'

  const hasDriverMatch = drivers.some(isLikelyDriver)

  const selectableDrivers = useMemo(() => {
    const matched = drivers.filter(isLikelyDriver)
    const base = matched.length > 0 ? matched : drivers
    const currentId = editing?.driver?.id
    if (!currentId || base.some((staff) => staff.id === currentId)) return base
    const current = drivers.find((staff) => staff.id === currentId)
    return current ? [current, ...base] : base
  }, [drivers, editing])

  useEffect(() => {
    if (!open) return
    setForm(editing ? formFromLog(editing, vehicles) : emptyForm(vehicles))
  }, [open, vehicles, editing])

  const before = optionalNumber(form.mileageBefore)
  const after = optionalNumber(form.mileageAfter)
  const litres = optionalNumber(form.fuelQuantityLitres)
  const previewDistance =
    before !== undefined && after !== undefined && after >= before ? after - before : null
  const previewEfficiency =
    previewDistance !== null && litres !== undefined && litres > 0 ? previewDistance / litres : null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const vehicleId = Number(form.vehicleId)
    if (!vehicleId || !form.logType) return

    const body: VehicleLogWritePayload = {
      vehicle: { id: vehicleId },
      logType: form.logType,
      logDate: form.logDate.trim() || todayIso(),
    }

    if (editing) {
      body.mileageBefore = editing.mileageBefore ?? null
      body.mileageAfter = editing.mileageAfter ?? null
      body.mileageAtFueling = editing.mileageAtFueling ?? null
      body.distanceCovered = editing.distanceCovered ?? null
      body.fuelQuantityLitres = editing.fuelQuantityLitres ?? null
      body.fuelCost = editing.fuelCost ?? null
      body.serviceCost = editing.serviceCost ?? null
      body.serviceDate = editing.serviceDate ?? null
      body.nextServiceDate = editing.nextServiceDate ?? null
      body.serviceReport = editing.serviceReport ?? null
      body.serviceType = editing.serviceType?.id ? { id: editing.serviceType.id } : null
      if (editing.driver?.id) body.driver = { id: editing.driver.id }
    }

    const driverId = Number(form.driverId)
    if (!isService && driverId) body.driver = { id: driverId }

    if (isService) {
      const serviceCost = optionalNumber(form.serviceCost)
      if (serviceCost === undefined || serviceCost <= 0) return
      body.serviceCost = serviceCost
      const serviceTypeId = Number(form.serviceTypeId)
      body.serviceType = serviceTypeId ? { id: serviceTypeId } : null
      body.serviceDate = form.serviceDate.trim() || null
      body.nextServiceDate = form.nextServiceDate.trim() || null
      body.serviceReport = form.serviceReport.trim() || null
      const mileageAtService = optionalNumber(form.mileageAtService)
      if (!editing && mileageAtService !== undefined) body.mileageAtService = mileageAtService
    } else if (isRefuel) {
      const quantity = optionalNumber(form.fuelQuantityLitres)
      const cost = optionalNumber(form.fuelCost)
      if (quantity === undefined || cost === undefined) return
      body.fuelQuantityLitres = quantity
      body.fuelCost = cost
      body.mileageBefore = before ?? null
      body.mileageAfter = after ?? null
      if (previewDistance !== null) {
        body.distanceCovered = previewDistance
        body.mileageAtFueling = after ?? null
      } else if (after !== undefined) {
        body.mileageAtFueling = after
        body.distanceCovered = null
      } else {
        body.mileageAtFueling = null
        body.distanceCovered = null
      }
    } else {
      body.mileageBefore = before ?? null
      body.mileageAfter = after ?? null
      body.distanceCovered = previewDistance
      const quantity = optionalNumber(form.fuelQuantityLitres)
      const cost = optionalNumber(form.fuelCost)
      body.fuelQuantityLitres = quantity ?? null
      body.fuelCost = cost ?? null
      if (!editing && isTrip) {
        const levelBefore = percentToFraction(form.fuelLevelBefore)
        if (levelBefore !== undefined) body.fuelLevelBefore = levelBefore
        const levelAfter = percentToFraction(form.fuelLevelAfter)
        if (levelAfter !== undefined) body.fuelLevelAfter = levelAfter
      }
    }

    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>{editing ? 'Update vehicle log' : 'Record vehicle log'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Saving replaces mileage, fuel, cost, and service details on this log. The vehicle, tank levels, and mileage at service stay as first recorded.'
                : isService
                  ? 'Service records need a cost above zero. The log date is the day the work was done.'
                  : isRefuel
                    ? 'Refueling needs litres, cost, and the log date. Distance is mileage after minus mileage before.'
                    : 'Trips record the log date, mileage, and tank level. Levels are stored as a 0–1 fraction.'}
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
              disabled={Boolean(editing)}
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
              label="Log date"
              type="date"
              value={form.logDate}
              onChange={(event) => setForm((current) => ({ ...current, logDate: event.target.value }))}
              required
              hint="The day of the refuel, trip, or service. This is separate from when the row is saved."
            />
            {!isService ? (
              <SelectField
                label="Driver"
                value={form.driverId}
                onChange={(value) => setForm((current) => ({ ...current, driverId: value }))}
                options={selectableDrivers.map((staff) => ({
                  value: String(staff.id),
                  label: [formatPersonName(staff), staff.staffNumber].filter(Boolean).join(' · '),
                }))}
                placeholder="Select driver"
                emptyLabel="Not set"
                hint={
                  hasDriverMatch
                    ? 'Staff whose department or role mentions driver or transport.'
                    : 'No staff department or role mentions driver or transport, so the full staff list is shown.'
                }
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
                  hint="Leave blank to use the log date."
                />
                <TextField
                  label="Mileage at service"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  value={form.mileageAtService}
                  onChange={(event) => setForm((current) => ({ ...current, mileageAtService: event.target.value }))}
                  disabled={Boolean(editing)}
                  hint={editing ? 'An update does not change this reading.' : undefined}
                />
                <TextField
                  label="Service cost"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={form.serviceCost}
                  onChange={(event) => setForm((current) => ({ ...current, serviceCost: event.target.value }))}
                  required
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
            ) : isRefuel ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
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
                    hint="Also stored as the pump reading."
                  />
                </div>
                <div className="grid gap-3 rounded-xl border border-border bg-muted/40 p-3 sm:grid-cols-2">
                  <div>
                    <p className="type-caption text-muted-foreground">Distance</p>
                    <p className="type-label mt-1">
                      {previewDistance === null
                        ? after !== undefined
                          ? 'From the previous odometer on save'
                          : '—'
                        : formatKm(previewDistance)}
                    </p>
                  </div>
                  <div>
                    <p className="type-caption text-muted-foreground">Efficiency</p>
                    <p className="type-label mt-1">{formatEfficiency(previewEfficiency)}</p>
                  </div>
                </div>
                <TextField
                  label="Fuel quantity (litres)"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.fuelQuantityLitres}
                  onChange={(event) => setForm((current) => ({ ...current, fuelQuantityLitres: event.target.value }))}
                  required
                />
                <TextField
                  label="Fuel cost"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.fuelCost}
                  onChange={(event) => setForm((current) => ({ ...current, fuelCost: event.target.value }))}
                  required
                />
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
                <p className="type-caption text-muted-foreground">
                  Distance preview: {previewDistance === null ? '—' : formatKm(previewDistance)}
                  {litres ? ` · ${formatEfficiency(previewEfficiency)}` : ''}
                </p>
                {isTrip ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Fuel level before (%)"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="1"
                      value={form.fuelLevelBefore}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, fuelLevelBefore: event.target.value }))
                      }
                      disabled={Boolean(editing)}
                      hint={editing ? 'An update does not change tank level.' : '0–100. Sent as a 0–1 fraction.'}
                    />
                    <TextField
                      label="Fuel level after (%)"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="1"
                      value={form.fuelLevelAfter}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, fuelLevelAfter: event.target.value }))
                      }
                      disabled={Boolean(editing)}
                    />
                  </div>
                ) : null}
                <TextField
                  label="Fuel quantity (litres)"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.fuelQuantityLitres}
                  onChange={(event) => setForm((current) => ({ ...current, fuelQuantityLitres: event.target.value }))}
                  hint="Optional. Needed if you want km/L."
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
              {editing ? 'Save changes' : 'Record log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
