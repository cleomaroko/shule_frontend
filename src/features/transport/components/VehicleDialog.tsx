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
import {
  FUEL_TYPES,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  vehicleTypeLabel,
  type VehicleWritePayload,
} from '@/features/transport/types/transport.types'

export interface VehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (body: VehicleWritePayload) => void
}

interface FormState {
  numberPlate: string
  vehicleType: string
  capacity: string
  makeModel: string
  dateAcquired: string
  fuelType: string
  status: string
}

function emptyForm(): FormState {
  return {
    numberPlate: '',
    vehicleType: 'BUS',
    capacity: '',
    makeModel: '',
    dateAcquired: '',
    fuelType: 'Diesel',
    status: 'ACTIVE',
  }
}

export function VehicleDialog({
  open,
  onOpenChange,
  isSaving,
  onSubmit,
}: VehicleDialogProps): ReactNode {
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm())
  }, [open])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const numberPlate = form.numberPlate.trim()
    if (!numberPlate) return
    const capacity = form.capacity.trim() ? Number(form.capacity) : null
    if (capacity !== null && !Number.isFinite(capacity)) return
    const body: VehicleWritePayload = {
      numberPlate,
      vehicleType: form.vehicleType,
      capacity,
      makeModel: form.makeModel.trim() || null,
      dateAcquired: form.dateAcquired.trim() || null,
      fuelType: form.fuelType,
      status: form.status,
    }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>Add vehicle</DialogTitle>
            <DialogDescription>
              Number plates must be unique. Vehicles can be added or removed; the backend has no update endpoint.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            <TextField
              label="Number plate"
              value={form.numberPlate}
              onChange={(event) => setForm((current) => ({ ...current, numberPlate: event.target.value }))}
              placeholder="KDA 123A"
              required
            />
            <SelectField
              label="Type"
              value={form.vehicleType}
              onChange={(value) => setForm((current) => ({ ...current, vehicleType: value || 'BUS' }))}
              options={VEHICLE_TYPES.map((type) => ({ value: type, label: vehicleTypeLabel(type) }))}
              allowEmpty={false}
            />
            <TextField
              label="Make / model"
              value={form.makeModel}
              onChange={(event) => setForm((current) => ({ ...current, makeModel: event.target.value }))}
              placeholder="Isuzu NQR"
            />
            <TextField
              label="Capacity"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={form.capacity}
              onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))}
              hint="Seats for a bus or van. Optional for a generator."
            />
            <TextField
              label="Date acquired"
              type="date"
              value={form.dateAcquired}
              onChange={(event) => setForm((current) => ({ ...current, dateAcquired: event.target.value }))}
            />
            <SelectField
              label="Fuel type"
              value={form.fuelType}
              onChange={(value) => setForm((current) => ({ ...current, fuelType: value || 'Diesel' }))}
              options={FUEL_TYPES.map((type) => ({ value: type, label: type }))}
              allowEmpty={false}
            />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(value) => setForm((current) => ({ ...current, status: value || 'ACTIVE' }))}
              options={VEHICLE_STATUSES.map((status) => ({
                value: status,
                label: status.replace('_', ' '),
              }))}
              allowEmpty={false}
            />
          </div>
          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              Add vehicle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
