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
import {
  formatMoneyKes,
  type ExternalHireWritePayload,
  type Vehicle,
} from '@/features/transport/types/transport.types'

export interface HireDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: Vehicle[]
  isSaving: boolean
  onSubmit: (body: ExternalHireWritePayload) => void
}

interface FormState {
  vehicleId: string
  hiredVehiclePlate: string
  numberOfTrips: string
  distanceCovered: string
  fuelCosts: string
  chargesWages: string
  hireDate: string
  comment: string
}

function todayIso(): string {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function emptyForm(vehicles: Vehicle[]): FormState {
  return {
    vehicleId: vehicles[0] ? String(vehicles[0].id) : '',
    hiredVehiclePlate: '',
    numberOfTrips: '',
    distanceCovered: '',
    fuelCosts: '',
    chargesWages: '',
    hireDate: todayIso(),
    comment: '',
  }
}

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function HireDialog({
  open,
  onOpenChange,
  vehicles,
  isSaving,
  onSubmit,
}: HireDialogProps): ReactNode {
  const [form, setForm] = useState<FormState>(() => emptyForm(vehicles))
  const fuelCosts = optionalNumber(form.fuelCosts)
  const chargesWages = optionalNumber(form.chargesWages)
  const previewTotal =
    fuelCosts !== undefined && chargesWages !== undefined ? fuelCosts + chargesWages : null

  useEffect(() => {
    if (!open) return
    setForm(emptyForm(vehicles))
  }, [open, vehicles])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const vehicle = vehicles.find((item) => String(item.id) === form.vehicleId)
    const plate = form.hiredVehiclePlate.trim()
    if (!vehicle || !plate || fuelCosts === undefined || chargesWages === undefined || !form.hireDate) {
      return
    }
    const body: ExternalHireWritePayload = {
      vehicleBeingReplaced: { id: vehicle.id },
      hiredVehiclePlate: plate,
      fuelCosts,
      chargesWages,
      hireDate: form.hireDate,
    }
    const trips = optionalNumber(form.numberOfTrips)
    if (trips !== undefined) body.numberOfTrips = trips
    const distance = optionalNumber(form.distanceCovered)
    if (distance !== undefined) body.distanceCovered = distance
    if (form.comment.trim()) body.comment = form.comment.trim()
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>Record external hire</DialogTitle>
            <DialogDescription>
              Used when an outside bus or van covers a school vehicle. Total cost is fuel plus wages.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            <SelectField
              label="Vehicle being replaced"
              value={form.vehicleId}
              onChange={(value) => setForm((current) => ({ ...current, vehicleId: value }))}
              options={vehicles.map((vehicle) => ({
                value: String(vehicle.id),
                label: [vehicle.numberPlate, vehicle.makeModel].filter(Boolean).join(' · '),
              }))}
              placeholder="Select vehicle"
              allowEmpty={false}
            />
            <TextField
              label="Hired vehicle plate"
              value={form.hiredVehiclePlate}
              onChange={(event) =>
                setForm((current) => ({ ...current, hiredVehiclePlate: event.target.value }))
              }
              placeholder="KCQ 123X"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Number of trips"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.numberOfTrips}
                onChange={(event) =>
                  setForm((current) => ({ ...current, numberOfTrips: event.target.value }))
                }
              />
              <TextField
                label="Distance covered (km)"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={form.distanceCovered}
                onChange={(event) =>
                  setForm((current) => ({ ...current, distanceCovered: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Fuel costs"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.fuelCosts}
                onChange={(event) => setForm((current) => ({ ...current, fuelCosts: event.target.value }))}
                required
              />
              <TextField
                label="Charges / wages"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.chargesWages}
                onChange={(event) =>
                  setForm((current) => ({ ...current, chargesWages: event.target.value }))
                }
                required
              />
            </div>
            <TextField
              label="Hire date"
              type="date"
              value={form.hireDate}
              onChange={(event) => setForm((current) => ({ ...current, hireDate: event.target.value }))}
              required
            />
            <TextareaField
              label="Comment"
              value={form.comment}
              onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
              rows={3}
              placeholder="Morning route replacement"
            />
            <p className="type-caption text-muted-foreground">
              Total (computed): {previewTotal === null ? '—' : formatMoneyKes(previewTotal)}
            </p>
          </div>
          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              Record hire
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
