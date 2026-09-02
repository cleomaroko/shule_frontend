import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, StatusBadge, type DataColumn } from '@/components/data/DataTable'
import { NamedLookupManager } from '@/components/data/NamedLookupManager'
import { FilterChip, SearchField } from '@/components/data/FilterBar'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useZoneList } from '@/features/logistics/hooks/useLogistics'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { BusStopDialog } from '@/features/transport/components/BusStopDialog'
import { VehicleDialog } from '@/features/transport/components/VehicleDialog'
import { VehicleLogDialog } from '@/features/transport/components/VehicleLogDialog'
import {
  useBusStopList,
  useTransportMutations,
  useVehicleList,
  useVehicleLogList,
  useVehicleServiceTypeList,
} from '@/features/transport/hooks/useTransport'
import type {
  BusStop,
  BusStopWritePayload,
  Vehicle,
  VehicleLog,
  VehicleLogWritePayload,
  VehicleWritePayload,
} from '@/features/transport/types/transport.types'
import {
  VEHICLE_LOG_TYPES,
  VEHICLE_STATUSES,
  formatEfficiency,
  formatKm,
  formatLitres,
  formatMoneyKes,
  vehicleLogTypeLabel,
  vehicleTypeLabel,
} from '@/features/transport/types/transport.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDate, formatDateTime, formatPersonName } from '@/lib/format'

const PAGE_SIZE = 10

const TABS = ['fleet', 'logs', 'stops', 'service-types'] as const
type TransportTab = (typeof TABS)[number]

function tabFromParam(value: string | null): TransportTab {
  return TABS.includes(value as TransportTab) ? (value as TransportTab) : 'fleet'
}

function logBadgeVariant(type: string | null | undefined) {
  switch (type) {
    case 'REFUELING':
      return 'success' as const
    case 'TRIP':
      return 'primary' as const
    default:
      return 'warning' as const
  }
}

export function TransportPage(): ReactNode {
  useDocumentTitle('Transport')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'transport:write')
  const [params, setParams] = useSearchParams()
  const tab = tabFromParam(params.get('tab'))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transport"
        description="Fleet, fuel and mileage logs, service records, and bus stops used on school routes."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="stops">Bus stops</TabsTrigger>
          <TabsTrigger value="service-types">Service types</TabsTrigger>
        </TabsList>
        <TabsContent value="fleet">
          <FleetPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="logs">
          <LogsPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="stops">
          <StopsPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="service-types">
          <ServiceTypesPanel canWrite={canWrite} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FleetPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useVehicleList()
  const { createVehicle, deleteVehicle } = useTransportMutations()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((vehicle) => {
      if (status !== 'all' && (vehicle.status ?? '') !== status) return false
      if (!needle) return true
      return [vehicle.numberPlate, vehicle.vehicleType, vehicle.makeModel, vehicle.fuelType, vehicle.status]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [list.data, query, status])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setOpen(true)
  }

  const handleSubmit = (body: VehicleWritePayload) => {
    createVehicle.mutate(body, { onSuccess: () => setOpen(false) })
  }

  const columns: Array<DataColumn<Vehicle>> = [
    {
      id: 'plate',
      header: 'Vehicle',
      cell: (row) => (
        <span>
          <span className="block font-medium">{row.numberPlate}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.makeModel)}</span>
        </span>
      ),
    },
    { id: 'type', header: 'Type', cell: (row) => vehicleTypeLabel(row.vehicleType) },
    { id: 'capacity', header: 'Capacity', cell: (row) => displayValue(row.capacity) },
    { id: 'fuel', header: 'Fuel', cell: (row) => displayValue(row.fuelType) },
    { id: 'acquired', header: 'Acquired', cell: (row) => formatDate(row.dateAcquired) },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) =>
        canWrite ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${row.numberPlate}`}
            onClick={() => setPendingDelete(row)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : null,
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  const isEmpty = !list.isLoading && (list.data?.length ?? 0) === 0
  const noMatches = !list.isLoading && !isEmpty && filtered.length === 0

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Buses, vans, and generators. A vehicle with fuel or trip logs cannot be deleted until those logs are removed.
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchField
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Search fleet…"
          />
          {canWrite ? (
            <Button className="w-full sm:w-auto" onClick={openCreate}>
              <Plus aria-hidden="true" />
              Add vehicle
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="All statuses"
            active={status === 'all'}
            onClick={() => {
              setStatus('all')
              setPage(1)
            }}
          />
          {VEHICLE_STATUSES.map((value) => (
            <FilterChip
              key={value}
              label={value.replace('_', ' ')}
              active={status === value}
              onClick={() => {
                setStatus(value)
                setPage(1)
              }}
            />
          ))}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          title="No vehicles yet"
          description="Add a bus or van before recording fuel and mileage."
          {...(canWrite ? { actionLabel: 'Add vehicle', onAction: openCreate } : {})}
        />
      ) : noMatches ? (
        <EmptyState title="No matching vehicles" description="Try a different search or status." />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="type-heading truncate">{row.numberPlate}</p>
                  <p className="type-caption text-muted-foreground">
                    {[vehicleTypeLabel(row.vehicleType), row.makeModel].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>
              <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                <div>
                  <dt>Capacity</dt>
                  <dd className="font-medium text-foreground">{displayValue(row.capacity)}</dd>
                </div>
                <div>
                  <dt>Fuel</dt>
                  <dd className="font-medium text-foreground">{displayValue(row.fuelType)}</dd>
                </div>
                <div className="col-span-2">
                  <dt>Acquired</dt>
                  <dd className="font-medium text-foreground">{formatDate(row.dateAcquired)}</dd>
                </div>
              </dl>
            </div>
          )}
        />
      )}

      <VehicleDialog
        open={open}
        onOpenChange={setOpen}
        isSaving={createVehicle.isPending}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Delete vehicle?"
        description={
          pendingDelete
            ? `This will remove ${pendingDelete.numberPlate} from the fleet if it has no logs.`
            : ''
        }
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteVehicle.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteVehicle.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function LogsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const logs = useVehicleLogList({
    ...(typeFilter !== 'all' ? { logType: typeFilter } : {}),
    ...(start && end ? { start, end } : {}),
  })
  const vehicles = useVehicleList()
  const staff = useStaffList()
  const serviceTypes = useVehicleServiceTypeList()
  const { createLog, deleteLog } = useTransportMutations()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<VehicleLog | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (logs.data ?? []).filter((log) => {
      if (typeFilter !== 'all' && log.logType !== typeFilter) return false
      if (!needle) return true
      return [
        log.vehicle?.numberPlate,
        log.vehicle?.makeModel,
        log.driver?.firstName,
        log.driver?.lastName,
        log.logType,
        vehicleLogTypeLabel(log.logType),
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [logs.data, query, typeFilter])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const canCreate = canWrite && (vehicles.data?.length ?? 0) > 0

  const openCreate = () => {
    setOpen(true)
  }

  const handleSubmit = (body: VehicleLogWritePayload) => {
    createLog.mutate(body, { onSuccess: () => setOpen(false) })
  }

  const columns: Array<DataColumn<VehicleLog>> = [
    { id: 'when', header: 'Recorded', cell: (row) => formatDateTime(row.createdAt) },
    {
      id: 'type',
      header: 'Type',
      cell: (row) => <Badge variant={logBadgeVariant(row.logType)}>{vehicleLogTypeLabel(row.logType)}</Badge>,
    },
    {
      id: 'vehicle',
      header: 'Vehicle',
      cell: (row) => displayValue(row.vehicle?.numberPlate),
    },
    {
      id: 'driver',
      header: 'Driver',
      cell: (row) => (row.driver ? formatPersonName(row.driver) : '—'),
    },
    {
      id: 'mileage',
      header: 'Mileage',
      cell: (row) =>
        formatKm(row.logType === 'SERVICE' ? row.mileageAtService : (row.mileageAfter ?? row.mileageBefore)),
    },
    {
      id: 'detail',
      header: 'Detail',
      cell: (row) =>
        row.logType === 'SERVICE' ? displayValue(row.serviceType?.name) : formatLitres(row.fuelQuantityLitres),
    },
    {
      id: 'cost',
      header: 'Cost',
      cell: (row) => formatMoneyKes(row.logType === 'SERVICE' ? row.serviceCost : row.fuelCost),
    },
    { id: 'eff', header: 'km/L', cell: (row) => formatEfficiency(row.efficiency) },
    {
      id: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) =>
        canWrite ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete log ${row.id}`}
            onClick={() => setPendingDelete(row)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : null,
    },
  ]

  if (logs.isError) {
    return <ErrorState message={toUserMessage(logs.error)} onRetry={() => void logs.refetch()} />
  }

  const isEmpty = !logs.isLoading && (logs.data?.length ?? 0) === 0
  const noMatches = !logs.isLoading && !isEmpty && filtered.length === 0

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Refueling, trips, and service. Efficiency comes from the backend: (mileage after − before) ÷ litres.
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchField
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Search logs…"
          />
          {canWrite ? (
            <Button className="w-full sm:w-auto" onClick={openCreate} disabled={!canCreate}>
              <Plus aria-hidden="true" />
              Record log
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="All types"
            active={typeFilter === 'all'}
            onClick={() => {
              setTypeFilter('all')
              setPage(1)
            }}
          />
          {VEHICLE_LOG_TYPES.map((type) => (
            <FilterChip
              key={type}
              label={vehicleLogTypeLabel(type)}
              active={typeFilter === type}
              onClick={() => {
                setTypeFilter(type)
                setPage(1)
              }}
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
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
            hint="Both dates are sent together to GET /api/transport/logs."
          />
        </div>
      </div>

      {canWrite && !canCreate && !vehicles.isLoading ? (
        <p className="type-caption text-muted-foreground">Add a vehicle before recording logs.</p>
      ) : null}

      {isEmpty ? (
        <EmptyState
          title="No vehicle logs yet"
          description="Record a refuel or trip against a fleet vehicle."
          {...(canCreate ? { actionLabel: 'Record log', onAction: openCreate } : {})}
        />
      ) : noMatches ? (
        <EmptyState title="No matching logs" description="Try a different search or type." />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={logs.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
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
                  <dt>Mileage</dt>
                  <dd className="font-medium text-foreground">
                    {formatKm(row.logType === 'SERVICE' ? row.mileageAtService : (row.mileageAfter ?? row.mileageBefore))}
                  </dd>
                </div>
                <div>
                  <dt>{row.logType === 'SERVICE' ? 'Service' : 'Fuel'}</dt>
                  <dd className="font-medium text-foreground">
                    {row.logType === 'SERVICE'
                      ? displayValue(row.serviceType?.name)
                      : formatLitres(row.fuelQuantityLitres)}
                  </dd>
                </div>
                <div>
                  <dt>Cost</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoneyKes(row.logType === 'SERVICE' ? row.serviceCost : row.fuelCost)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt>Efficiency</dt>
                  <dd className="font-medium text-foreground">{formatEfficiency(row.efficiency)}</dd>
                </div>
              </dl>
            </div>
          )}
        />
      )}

      <VehicleLogDialog
        open={open}
        onOpenChange={setOpen}
        vehicles={vehicles.data ?? []}
        drivers={staff.data ?? []}
        serviceTypes={serviceTypes.data ?? []}
        isSaving={createLog.isPending}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Delete vehicle log?"
        description={
          pendingDelete
            ? `This will remove the ${vehicleLogTypeLabel(pendingDelete.logType).toLowerCase()} record for ${pendingDelete.vehicle?.numberPlate ?? 'this vehicle'}.`
            : ''
        }
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteLog.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteLog.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function StopsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useBusStopList()
  const zones = useZoneList()
  const { createStop } = useTransportMutations()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((stop) => {
      if (!needle) return true
      return [stop.stopName, stop.stopCode, stop.zone?.zoneName].join(' ').toLowerCase().includes(needle)
    })
  }, [list.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setOpen(true)
  }

  const handleSubmit = (body: BusStopWritePayload) => {
    createStop.mutate(body, { onSuccess: () => setOpen(false) })
  }

  const columns: Array<DataColumn<BusStop>> = [
    {
      id: 'name',
      header: 'Stop',
      cell: (row) => <span className="font-medium">{displayValue(row.stopName)}</span>,
    },
    { id: 'code', header: 'Code', cell: (row) => displayValue(row.stopCode) },
    { id: 'zone', header: 'Zone', cell: (row) => displayValue(row.zone?.zoneName) },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  const isEmpty = !list.isLoading && (list.data?.length ?? 0) === 0
  const noMatches = !list.isLoading && !isEmpty && filtered.length === 0

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Stops are linked to a transport zone. They can be added; the backend has no update or delete for stops.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          placeholder="Search stops…"
        />
        {canWrite ? (
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus aria-hidden="true" />
            Add stop
          </Button>
        ) : null}
      </div>

      {isEmpty ? (
        <EmptyState
          title="No bus stops yet"
          description="Add a stop such as Zimmerman and attach it to a zone."
          {...(canWrite ? { actionLabel: 'Add stop', onAction: openCreate } : {})}
        />
      ) : noMatches ? (
        <EmptyState title="No matching stops" description="Try a different search." />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div className="flex flex-col gap-1">
              <p className="type-heading">{displayValue(row.stopName)}</p>
              <p className="type-caption text-muted-foreground">
                {[row.stopCode, row.zone?.zoneName].filter(Boolean).join(' · ') || 'No zone'}
              </p>
            </div>
          )}
        />
      )}

      <BusStopDialog
        open={open}
        onOpenChange={setOpen}
        zones={zones.data ?? []}
        isSaving={createStop.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function ServiceTypesPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useVehicleServiceTypeList()
  const { createServiceType } = useTransportMutations()

  return (
    <NamedLookupManager
      title="Service type"
      description="Used on SERVICE vehicle logs, for example Oil change or Brake pads."
      emptyTitle="No service types yet"
      emptyDescription="Add types before recording a service log."
      items={list.data}
      isLoading={list.isLoading}
      isError={list.isError}
      errorMessage={toUserMessage(list.error)}
      onRetry={() => void list.refetch()}
      canWrite={canWrite}
      isSaving={createServiceType.isPending}
      onCreate={(name) => createServiceType.mutate({ name })}
    />
  )
}
