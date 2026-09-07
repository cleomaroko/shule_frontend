import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

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
import { academicTermLabel, type AcademicTerm } from '@/features/academic/types/academic.types'
import type { Learner } from '@/features/learners/types/learner.types'
import {
  TRIP_TYPES,
  transportTermKey,
  tripTypeLabel,
  type BusStop,
  type TransportAssignmentWritePayload,
  type Vehicle,
} from '@/features/transport/types/transport.types'
import { formatPersonName } from '@/lib/format'

export interface AssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  learners: Learner[]
  vehicles: Vehicle[]
  stops: BusStop[]
  terms: AcademicTerm[]
  defaultVehicleId?: string
  defaultTripType?: string
  defaultTerm?: string
  isSaving: boolean
  onSubmit: (body: TransportAssignmentWritePayload) => void
}

interface FormState {
  learnerQuery: string
  learnerId: string
  vehicleId: string
  stopId: string
  tripType: string
  term: string
}

export function AssignmentDialog({
  open,
  onOpenChange,
  learners,
  vehicles,
  stops,
  terms,
  defaultVehicleId = '',
  defaultTripType = 'MORNING',
  defaultTerm = '',
  isSaving,
  onSubmit,
}: AssignmentDialogProps): ReactNode {
  const [form, setForm] = useState<FormState>(() => ({
    learnerQuery: '',
    learnerId: '',
    vehicleId: defaultVehicleId,
    stopId: '',
    tripType: defaultTripType,
    term: defaultTerm,
  }))

  useEffect(() => {
    if (!open) return
    setForm({
      learnerQuery: '',
      learnerId: '',
      vehicleId: defaultVehicleId || (vehicles[0] ? String(vehicles[0].id) : ''),
      stopId: '',
      tripType: defaultTripType || 'MORNING',
      term: defaultTerm,
    })
  }, [defaultTerm, defaultTripType, defaultVehicleId, open, vehicles])

  const filteredLearners = useMemo(() => {
    const needle = form.learnerQuery.trim().toLowerCase()
    const list = learners.filter((learner) => {
      if (!needle) return true
      return [learner.firstName, learner.middleName, learner.lastName, learner.admissionNumber]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
    return list.slice(0, 80)
  }, [form.learnerQuery, learners])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const learnerId = Number(form.learnerId)
    const vehicleId = Number(form.vehicleId)
    const stopId = Number(form.stopId)
    const tripType = form.tripType.trim()
    const term = form.term.trim()
    if (!learnerId || !vehicleId || !stopId || !tripType || !term) return
    onSubmit({
      learner: { id: learnerId },
      vehicle: { id: vehicleId },
      stop: { id: stopId },
      tripType,
      term,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>Assign learner</DialogTitle>
            <DialogDescription>
              Adds a learner to a vehicle, stop, and trip for one academic term.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            <TextField
              label="Search learners"
              value={form.learnerQuery}
              onChange={(event) =>
                setForm((current) => ({ ...current, learnerQuery: event.target.value, learnerId: '' }))
              }
              placeholder="Name or admission number"
            />
            <SelectField
              label="Learner"
              value={form.learnerId}
              onChange={(value) => setForm((current) => ({ ...current, learnerId: value }))}
              options={filteredLearners.map((learner) => ({
                value: String(learner.id),
                label: [formatPersonName(learner), learner.admissionNumber].filter(Boolean).join(' · '),
              }))}
              placeholder="Select learner"
              emptyMessage="No matching learners"
              allowEmpty={false}
            />
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
              label="Bus stop"
              value={form.stopId}
              onChange={(value) => setForm((current) => ({ ...current, stopId: value }))}
              options={stops.map((stop) => ({
                value: String(stop.id),
                label: [stop.stopName, stop.stopCode].filter(Boolean).join(' · '),
              }))}
              placeholder={stops.length ? 'Select stop' : 'No stops available'}
              emptyMessage="Add a bus stop first"
              allowEmpty={false}
            />
            <SelectField
              label="Trip"
              value={form.tripType}
              onChange={(value) => setForm((current) => ({ ...current, tripType: value || 'MORNING' }))}
              options={TRIP_TYPES.map((type) => ({ value: type, label: tripTypeLabel(type) }))}
              allowEmpty={false}
            />
            <SelectField
              label="Term"
              value={form.term}
              onChange={(value) => setForm((current) => ({ ...current, term: value }))}
              options={terms
                .map((term) => ({
                  value: transportTermKey(term),
                  label: academicTermLabel(term),
                }))
                .filter((option) => option.value)}
              placeholder={terms.length ? 'Select term' : 'No terms available'}
              emptyMessage="Add an academic term first"
              allowEmpty={false}
            />
          </div>
          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              Assign learner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
