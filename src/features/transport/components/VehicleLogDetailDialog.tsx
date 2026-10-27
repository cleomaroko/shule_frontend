import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
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
  formatEfficiency,
  formatFuelLevel,
  formatKm,
  formatLitres,
  formatMoneyKes,
  vehicleLogTypeLabel,
  vehicleTypeLabel,
  type VehicleLog,
} from '@/features/transport/types/transport.types'
import { displayValue, formatCalendarDate, formatDate, formatDateTime, formatPersonName } from '@/lib/format'

export interface VehicleLogDetailDialogProps {
  log: VehicleLog | null
  onOpenChange: (open: boolean) => void
  onEdit?: (log: VehicleLog) => void
}

export function VehicleLogDetailDialog({
  log,
  onOpenChange,
  onEdit,
}: VehicleLogDetailDialogProps): ReactNode {
  const type = log?.logType
  const isService = type === 'SERVICE'
  const isRefuel = type === 'REFUELING'
  const isTrip = type === 'TRIP'

  return (
    <Dialog open={log !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {displayValue(log?.vehicle?.numberPlate)}
            {log ? <Badge variant={logBadge(type)}>{vehicleLogTypeLabel(type)}</Badge> : null}
          </DialogTitle>
          <DialogDescription>
            {log
              ? `${formatCalendarDate(log.logDate)} · saved ${formatDateTime(log.createdAt)}`
              : 'Vehicle log'}
          </DialogDescription>
        </DialogHeader>
        {log ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
            <section>
              <h3 className="type-caption mb-2 font-medium text-muted-foreground">Vehicle</h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 type-caption text-muted-foreground">
                <Detail label="Plate" value={displayValue(log.vehicle?.numberPlate)} />
                <Detail label="Type" value={vehicleTypeLabel(log.vehicle?.vehicleType)} />
                <Detail label="Make and model" value={displayValue(log.vehicle?.makeModel)} />
                <Detail label="Capacity" value={displayValue(log.vehicle?.capacity)} />
                <Detail label="Fuel" value={displayValue(log.vehicle?.fuelType)} />
                <Detail label="Status" value={displayValue(log.vehicle?.status)} />
              </dl>
            </section>

            {log.driver ? (
              <section className="mt-5">
                <h3 className="type-caption mb-2 font-medium text-muted-foreground">Driver</h3>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 type-caption text-muted-foreground">
                  <Detail label="Name" value={formatPersonName(log.driver)} />
                  <Detail label="Phone" value={displayValue(log.driver.phone)} />
                  <Detail label="Staff number" value={displayValue(log.driver.staffNumber)} />
                  <Detail label="Work email" value={displayValue(log.driver.workEmail)} />
                </dl>
              </section>
            ) : null}

            <section className="mt-5">
              <h3 className="type-caption mb-2 font-medium text-muted-foreground">
                {isService ? 'Service' : isTrip ? 'Trip' : 'Refueling'}
              </h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 type-caption text-muted-foreground">
                <Detail label="Log date" value={formatCalendarDate(log.logDate)} />
                <Detail label="Recorded by" value={displayValue(log.recordedBy)} />
                {isRefuel ? (
                  <>
                    <Detail label="Mileage before" value={formatKm(log.mileageBefore)} />
                    <Detail label="Mileage after" value={formatKm(log.mileageAfter ?? log.mileageAtFueling)} />
                    <Detail label="Distance" value={formatKm(log.distanceCovered)} />
                    <Detail label="Quantity" value={formatLitres(log.fuelQuantityLitres)} />
                    <Detail label="Cost" value={formatMoneyKes(log.fuelCost)} />
                    <Detail label="Efficiency" value={formatEfficiency(log.efficiency)} />
                  </>
                ) : null}
                {isTrip ? (
                  <>
                    <Detail label="Mileage before" value={formatKm(log.mileageBefore)} />
                    <Detail label="Mileage after" value={formatKm(log.mileageAfter)} />
                    <Detail label="Distance" value={formatKm(log.distanceCovered)} />
                    <Detail label="Tank before" value={formatFuelLevel(log.fuelLevelBefore)} />
                    <Detail label="Tank after" value={formatFuelLevel(log.fuelLevelAfter)} />
                    <Detail label="Quantity" value={formatLitres(log.fuelQuantityLitres)} />
                    <Detail label="Cost" value={formatMoneyKes(log.fuelCost)} />
                    <Detail label="Efficiency" value={formatEfficiency(log.efficiency)} />
                  </>
                ) : null}
                {isService ? (
                  <>
                    <Detail label="Service type" value={displayValue(log.serviceType?.name)} />
                    <Detail label="Cost" value={formatMoneyKes(log.serviceCost)} />
                    <Detail label="Service date" value={formatDate(log.serviceDate)} />
                    <Detail label="Mileage" value={formatKm(log.mileageAtService)} />
                    <Detail label="Next service" value={formatDate(log.nextServiceDate)} />
                    <Detail label="Serviced by" value={displayValue(log.servicedByName)} />
                  </>
                ) : null}
              </dl>
              {isService ? (
                <div className="mt-4">
                  <p className="type-caption font-medium text-muted-foreground">Report</p>
                  <p className="type-body mt-1 whitespace-pre-wrap">{displayValue(log.serviceReport)}</p>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
        <DialogFooter className="border-t border-border px-5 py-4 sm:px-6">
          {log && onEdit ? (
            <Button type="button" variant="secondary" onClick={() => onEdit(log)}>
              Edit
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Detail({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="min-w-0">
      <dt>{label}</dt>
      <dd className="font-medium break-words text-foreground">{value}</dd>
    </div>
  )
}

function logBadge(type: string | null | undefined) {
  switch (type) {
    case 'REFUELING':
      return 'success' as const
    case 'TRIP':
      return 'primary' as const
    default:
      return 'warning' as const
  }
}
