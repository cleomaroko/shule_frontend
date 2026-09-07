import { useMemo, useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip } from '@/components/data/FilterBar'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy, currentMonthRange } from '@/features/reports/lib/summaries'
import { useHireList, useVehicleList, useVehicleLogList } from '@/features/transport/hooks/useTransport'
import {
  VEHICLE_LOG_TYPES,
  formatEfficiency,
  formatFuelLevel,
  formatKm,
  formatLitres,
  formatMoneyKes,
  vehicleLogTypeLabel,
  type ExternalHire,
  type VehicleLog,
  type VehicleLogQuery,
} from '@/features/transport/types/transport.types'
import { displayValue, formatDate, formatDateTime, formatPersonName } from '@/lib/format'

const PAGE_SIZE = 12

function logBadgeVariant(type: string | null | undefined) {
  switch (type) {
    case 'REFUELING':
      return 'success' as const
    case 'TRIP':
      return 'primary' as const
    case 'SERVICE':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

function asNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function TransportReportsPanel(): ReactNode {
  const month = currentMonthRange()
  const vehicles = useVehicleList()
  const hires = useHireList()
  const [logType, setLogType] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [start, setStart] = useState(month.start)
  const [end, setEnd] = useState(month.end)
  const [page, setPage] = useState(1)
  const [hirePage, setHirePage] = useState(1)

  const query = useMemo<VehicleLogQuery | undefined>(() => {
    const params: VehicleLogQuery = {}
    if (logType) params.logType = logType
    if (Number(vehicleId)) params.vehicleId = Number(vehicleId)
    if (start && end) {
      params.start = start
      params.end = end
    }
    return Object.keys(params).length ? params : undefined
  }, [end, logType, start, vehicleId])

  const logs = useVehicleLogList(query)
  const rows = logs.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totals = useMemo(() => {
    const fuelCost = rows.reduce((sum, row) => sum + asNumber(row.fuelCost), 0)
    const litres = rows.reduce((sum, row) => sum + asNumber(row.fuelQuantityLitres), 0)
    const serviceCost = rows.reduce((sum, row) => sum + asNumber(row.serviceCost), 0)
    const efficiencies = rows
      .map((row) => row.efficiency)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0)
    const meanEff =
      efficiencies.length === 0
        ? null
        : efficiencies.reduce((sum, value) => sum + value, 0) / efficiencies.length
    return { fuelCost, litres, serviceCost, meanEff, efficiencyCount: efficiencies.length }
  }, [rows])

  const hireRows = hires.data ?? []
  const hireTotals = useMemo(() => {
    const total = hireRows.reduce((sum, row) => sum + asNumber(row.totalCost), 0)
    const fuel = hireRows.reduce((sum, row) => sum + asNumber(row.fuelCosts), 0)
    const wages = hireRows.reduce((sum, row) => sum + asNumber(row.chargesWages), 0)
    return { total, fuel, wages }
  }, [hireRows])

  const hireColumns: Array<DataColumn<ExternalHire>> = [
    { id: 'date', header: 'Date', cell: (row) => formatDate(row.hireDate) },
    { id: 'replaced', header: 'Replaced', cell: (row) => displayValue(row.vehicleBeingReplaced?.numberPlate) },
    { id: 'hired', header: 'Hired plate', cell: (row) => displayValue(row.hiredVehiclePlate) },
    { id: 'total', header: 'Total', cell: (row) => formatMoneyKes(row.totalCost) },
  ]

  const columns: Array<DataColumn<VehicleLog>> = [
    { id: 'vehicle', header: 'Vehicle', cell: (row) => displayValue(row.vehicle?.numberPlate) },
    {
      id: 'type',
      header: 'Type',
      cell: (row) => <Badge variant={logBadgeVariant(row.logType)}>{vehicleLogTypeLabel(row.logType)}</Badge>,
    },
    {
      id: 'driver',
      header: 'Driver',
      cell: (row) => (row.driver ? formatPersonName(row.driver) : '—'),
    },
    {
      id: 'fuel',
      header: 'Detail',
      cell: (row) =>
        row.logType === 'TRIP'
          ? `${formatFuelLevel(row.fuelLevelBefore)} → ${formatFuelLevel(row.fuelLevelAfter)}`
          : formatLitres(row.fuelQuantityLitres),
    },
    {
      id: 'cost',
      header: 'Cost',
      cell: (row) => formatMoneyKes(row.logType === 'SERVICE' ? row.serviceCost : row.fuelCost),
    },
    { id: 'eff', header: 'km/L', cell: (row) => formatEfficiency(row.efficiency) },
    { id: 'when', header: 'Recorded', cell: (row) => formatDateTime(row.createdAt) },
  ]

  if (logs.isError) {
    return <ErrorState message={toUserMessage(logs.error)} onRetry={() => void logs.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Fleet logs"
        note="GET /api/transport/logs. Date filters apply only when both From and To are set, and they match createdAt. Efficiency is calculated by the backend."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Log type"
            value={logType}
            onChange={(value) => {
              setLogType(value)
              setPage(1)
            }}
            options={VEHICLE_LOG_TYPES.map((type) => ({ value: type, label: vehicleLogTypeLabel(type) }))}
            emptyLabel="All types"
          />
          <SelectField
            label="Vehicle"
            value={vehicleId}
            onChange={(value) => {
              setVehicleId(value)
              setPage(1)
            }}
            options={(vehicles.data ?? []).map((row) => ({
              value: String(row.id),
              label: row.numberPlate,
            }))}
            emptyLabel="All vehicles"
          />
          <TextField
            label="From"
            type="date"
            value={start}
            onChange={(event) => {
              setStart(event.target.value)
              setPage(1)
            }}
          />
          <TextField
            label="To"
            type="date"
            value={end}
            onChange={(event) => {
              setEnd(event.target.value)
              setPage(1)
            }}
            hint="Both dates must be set for the backend date filter."
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="All types"
            active={logType === ''}
            onClick={() => {
              setLogType('')
              setPage(1)
            }}
          />
          {VEHICLE_LOG_TYPES.map((type) => (
            <FilterChip
              key={type}
              label={vehicleLogTypeLabel(type)}
              active={logType === type}
              onClick={() => {
                setLogType(type)
                setPage(1)
              }}
            />
          ))}
        </div>
        <StatGrid
          items={[
            { label: 'Log rows', value: rows.length.toLocaleString(), hint: 'Matching the filters above' },
            { label: 'Fuel cost', value: formatMoneyKes(totals.fuelCost), hint: 'Sum of fuelCost' },
            { label: 'Litres', value: formatLitres(totals.litres), hint: 'Sum of fuelQuantityLitres' },
            { label: 'Service cost', value: formatMoneyKes(totals.serviceCost), hint: 'Sum of serviceCost' },
            {
              label: 'Average km/L',
              value: formatEfficiency(totals.meanEff),
              hint:
                totals.efficiencyCount === 0
                  ? 'No efficiency values on these rows'
                  : `From ${totals.efficiencyCount.toLocaleString()} rows with efficiency`,
            },
          ]}
          loading={logs.isLoading}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="By log type"
            rows={countBy(rows, (row) => vehicleLogTypeLabel(row.logType))}
            empty="No logs in this range."
            loading={logs.isLoading}
          />
          <BreakdownCard
            title="By vehicle"
            rows={countBy(rows, (row) => row.vehicle?.numberPlate)}
            empty="No logs in this range."
            loading={logs.isLoading}
          />
          <BreakdownCard
            title="By service type"
            rows={countBy(
              rows.filter((row) => row.logType === 'SERVICE'),
              (row) => row.serviceType?.name,
            )}
            empty="No service logs in this range."
            loading={logs.isLoading}
          />
        </div>
      </ReportSection>

      <ReportSection title="Matching logs">
        {rows.length === 0 && !logs.isLoading ? (
          <EmptyState
            title="No matching logs"
            description="Record fuel, trips, or service, or widen the date range."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={paged}
            getRowId={(row) => row.id}
            isLoading={logs.isLoading}
            page={page}
            pageSize={PAGE_SIZE}
            total={rows.length}
            onPageChange={setPage}
            mobileCard={(row) => (
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-heading truncate">{displayValue(row.vehicle?.numberPlate)}</p>
                    <p className="type-caption text-muted-foreground">{formatDateTime(row.createdAt)}</p>
                  </div>
                  <Badge variant={logBadgeVariant(row.logType)}>{vehicleLogTypeLabel(row.logType)}</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                  <div>
                    <dt>Driver</dt>
                    <dd className="font-medium text-foreground">
                      {row.driver ? formatPersonName(row.driver) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>{row.logType === 'TRIP' ? 'Tank' : 'Litres'}</dt>
                    <dd className="font-medium text-foreground">
                      {row.logType === 'TRIP'
                        ? `${formatFuelLevel(row.fuelLevelBefore)} → ${formatFuelLevel(row.fuelLevelAfter)}`
                        : formatLitres(row.fuelQuantityLitres)}
                    </dd>
                  </div>
                  <div>
                    <dt>Cost</dt>
                    <dd className="font-medium text-foreground">
                      {formatMoneyKes(row.logType === 'SERVICE' ? row.serviceCost : row.fuelCost)}
                    </dd>
                  </div>
                  <div>
                    <dt>km/L</dt>
                    <dd className="font-medium text-foreground">{formatEfficiency(row.efficiency)}</dd>
                  </div>
                </dl>
              </div>
            )}
          />
        )}
      </ReportSection>

      <ReportSection
        title="External hires"
        note="GET /api/transport/hires. Totals are summed in the browser from fuelCosts, chargesWages, and totalCost."
      >
        {hires.isError ? (
          <ErrorState message={toUserMessage(hires.error)} onRetry={() => void hires.refetch()} />
        ) : (
          <>
            <StatGrid
              items={[
                { label: 'Hire records', value: hireRows.length.toLocaleString() },
                { label: 'Fuel costs', value: formatMoneyKes(hireTotals.fuel) },
                { label: 'Wages', value: formatMoneyKes(hireTotals.wages) },
                { label: 'Total cost', value: formatMoneyKes(hireTotals.total) },
              ]}
              loading={hires.isLoading}
            />
            {hireRows.length === 0 && !hires.isLoading ? (
              <EmptyState title="No external hires" description="Record a hired vehicle on the Transport page." />
            ) : (
              <DataTable
                columns={hireColumns}
                rows={hireRows.slice((hirePage - 1) * PAGE_SIZE, hirePage * PAGE_SIZE)}
                getRowId={(row) => row.id}
                isLoading={hires.isLoading}
                page={hirePage}
                pageSize={PAGE_SIZE}
                total={hireRows.length}
                onPageChange={setHirePage}
                mobileCard={(row) => (
                  <div className="flex flex-col gap-2">
                    <p className="type-heading">{displayValue(row.hiredVehiclePlate)}</p>
                    <p className="type-caption text-muted-foreground">
                      Replaced {displayValue(row.vehicleBeingReplaced?.numberPlate)} · {formatDate(row.hireDate)}
                    </p>
                    <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                      <div>
                        <dt>Distance</dt>
                        <dd className="font-medium text-foreground">{formatKm(row.distanceCovered)}</dd>
                      </div>
                      <div>
                        <dt>Total</dt>
                        <dd className="font-medium text-foreground">{formatMoneyKes(row.totalCost)}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              />
            )}
          </>
        )}
      </ReportSection>
    </div>
  )
}
