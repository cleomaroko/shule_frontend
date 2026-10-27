import { useMemo, useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { formatCalendarDate } from '@/lib/format'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { useConsumptionReport, useVehicleList } from '@/features/transport/hooks/useTransport'
import {
  formatEfficiency,
  formatKm,
  formatLitres,
  formatMoneyKes,
  type ConsumptionQuery,
  type VehicleConsumptionRow,
} from '@/features/transport/types/transport.types'

function differenceClass(value: number): string {
  if (value > 0) return 'font-medium text-destructive'
  if (value < 0) return 'font-medium text-emerald-700 dark:text-emerald-400'
  return 'font-medium text-foreground'
}

function formatDifference(value: number): string {
  const amount = formatMoneyKes(Math.abs(value))
  if (value > 0) return `+${amount}`
  if (value < 0) return `−${amount}`
  return amount
}

export function ConsumptionPanel(): ReactNode {
  const vehicles = useVehicleList()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [periodLabel, setPeriodLabel] = useState('')

  const query = useMemo<ConsumptionQuery>(() => {
    const next: ConsumptionQuery = {}
    if (start) next.start = start
    if (end) next.end = end
    const id = Number(vehicleId)
    if (id) next.vehicleId = id
    const label = periodLabel.trim()
    if (label) next.periodLabel = label
    return next
  }, [start, end, vehicleId, periodLabel])

  const report = useConsumptionReport(query)
  const data = report.data
  const rows = data?.vehicles ?? []

  if (report.isError) {
    return <ErrorState message={toUserMessage(report.error)} onRetry={() => void report.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Fuel and repair cost for the selected dates, compared with the previous period of the same length. Leave
        both dates empty to use the current Monday–Saturday week.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TextField
          label="Start date"
          type="date"
          value={start}
          onChange={(event) => setStart(event.target.value)}
        />
        <TextField
          label="End date"
          type="date"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
        />
        <SelectField
          label="Vehicle"
          value={vehicleId}
          onChange={setVehicleId}
          options={(vehicles.data ?? []).map((vehicle) => ({
            value: String(vehicle.id),
            label: [vehicle.numberPlate, vehicle.makeModel].filter(Boolean).join(' · '),
          }))}
          placeholder="All vehicles"
          emptyLabel="All vehicles"
        />
        <TextField
          label="Period label"
          value={periodLabel}
          onChange={(event) => setPeriodLabel(event.target.value)}
          placeholder="Week of 27 Oct"
          hint="Optional title sent with the report."
        />
      </div>

      {data ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-subtle">
          <p className="type-heading">{data.periodTitle || 'Consumption'}</p>
          <p className="type-caption mt-1 text-muted-foreground">
            {formatCalendarDate(data.startDate)} – {formatCalendarDate(data.endDate)}
            {' · previous '}
            {formatCalendarDate(data.previousStartDate)} – {formatCalendarDate(data.previousEndDate)}
          </p>
        </div>
      ) : null}

      {report.isLoading ? (
        <p className="type-caption text-muted-foreground">Loading consumption…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No consumption rows"
          description="No vehicles matched this period. Add a vehicle or widen the dates."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-subtle md:block">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  {['Vehicle', 'Fuel', 'Repairs', 'Previous fuel', 'Change', 'Km', 'Litres', 'km/L', 'Prev km', 'Prev km/L'].map(
                    (header) => (
                      <th
                        key={header}
                        className="type-caption px-3 py-3 font-semibold tracking-wide text-muted-foreground uppercase"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.vehicleId} className="border-b border-border last:border-0">
                    <td className="type-body px-3 py-3">
                      <span className="block font-medium">{row.numberPlate}</span>
                      <span className="type-caption text-muted-foreground">{row.makeModel || '—'}</span>
                    </td>
                    <td className="type-body px-3 py-3">{formatMoneyKes(row.fuelCost)}</td>
                    <td className="type-body px-3 py-3">{formatMoneyKes(row.repairsCost)}</td>
                    <td className="type-body px-3 py-3">{formatMoneyKes(row.previousFuelCost)}</td>
                    <td className={`type-body px-3 py-3 ${differenceClass(row.costDifference)}`}>
                      {formatDifference(row.costDifference)}
                    </td>
                    <td className="type-body px-3 py-3">{formatKm(row.totalKmsCovered)}</td>
                    <td className="type-body px-3 py-3">{formatLitres(row.totalLitres)}</td>
                    <td className="type-body px-3 py-3">{formatEfficiency(row.efficiencyKmPerLitre)}</td>
                    <td className="type-body px-3 py-3">{formatKm(row.previousTotalKm)}</td>
                    <td className="type-body px-3 py-3">{formatEfficiency(row.previousKmPerLitre)}</td>
                  </tr>
                ))}
              </tbody>
              {data?.totals ? (
                <tfoot>
                  <tr className="border-t border-border bg-muted/40 font-semibold">
                    <td className="type-body px-3 py-3">Total</td>
                    <td className="type-body px-3 py-3">{formatMoneyKes(data.totals.totalFuelCost)}</td>
                    <td className="type-body px-3 py-3">{formatMoneyKes(data.totals.totalRepairsCost)}</td>
                    <td className="type-body px-3 py-3">{formatMoneyKes(data.totals.totalPreviousFuelCost)}</td>
                    <td className={`type-body px-3 py-3 ${differenceClass(data.totals.totalCostDifference)}`}>
                      {formatDifference(data.totals.totalCostDifference)}
                    </td>
                    <td className="type-body px-3 py-3">{formatKm(data.totals.totalKmsCovered)}</td>
                    <td className="type-body px-3 py-3">{formatLitres(data.totals.totalLitres)}</td>
                    <td className="type-body px-3 py-3">{formatEfficiency(data.totals.averageEfficiencyKmPerLitre)}</td>
                    <td className="type-body px-3 py-3">{formatKm(data.totals.totalPreviousKmsCovered)}</td>
                    <td className="type-body px-3 py-3">
                      {formatEfficiency(data.totals.previousAverageEfficiencyKmPerLitre)}
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <ConsumptionCard key={row.vehicleId} row={row} />
            ))}
            {data?.totals ? (
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="type-heading">Total</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                  <Stat label="Fuel" value={formatMoneyKes(data.totals.totalFuelCost)} />
                  <Stat label="Repairs" value={formatMoneyKes(data.totals.totalRepairsCost)} />
                  <Stat label="Previous fuel" value={formatMoneyKes(data.totals.totalPreviousFuelCost)} />
                  <div>
                    <dt>Change</dt>
                    <dd className={differenceClass(data.totals.totalCostDifference)}>
                      {formatDifference(data.totals.totalCostDifference)}
                    </dd>
                  </div>
                  <Stat label="Km" value={formatKm(data.totals.totalKmsCovered)} />
                  <Stat label="Litres" value={formatLitres(data.totals.totalLitres)} />
                  <Stat label="km/L" value={formatEfficiency(data.totals.averageEfficiencyKmPerLitre)} />
                  <Stat label="Previous km/L" value={formatEfficiency(data.totals.previousAverageEfficiencyKmPerLitre)} />
                </dl>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

function ConsumptionCard({ row }: { row: VehicleConsumptionRow }): ReactNode {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
      <p className="type-heading">{row.numberPlate}</p>
      <p className="type-caption text-muted-foreground">{row.makeModel || '—'}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 type-caption text-muted-foreground">
        <Stat label="Fuel" value={formatMoneyKes(row.fuelCost)} />
        <Stat label="Repairs" value={formatMoneyKes(row.repairsCost)} />
        <Stat label="Previous fuel" value={formatMoneyKes(row.previousFuelCost)} />
        <div>
          <dt>Change</dt>
          <dd className={differenceClass(row.costDifference)}>{formatDifference(row.costDifference)}</dd>
        </div>
        <Stat label="Km" value={formatKm(row.totalKmsCovered)} />
        <Stat label="Litres" value={formatLitres(row.totalLitres)} />
        <Stat label="km/L" value={formatEfficiency(row.efficiencyKmPerLitre)} />
        <Stat label="Previous km" value={formatKm(row.previousTotalKm)} />
      </dl>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}
