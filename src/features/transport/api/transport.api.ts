import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  BusStop,
  BusStopWritePayload,
  ExternalHire,
  ExternalHireWritePayload,
  TransportAssignment,
  TransportAssignmentQuery,
  TransportAssignmentWritePayload,
  Vehicle,
  VehicleLog,
  VehicleLogQuery,
  VehicleLogWritePayload,
  VehicleServiceType,
  VehicleWritePayload,
} from '@/features/transport/types/transport.types'

function compactLogQuery(params?: VehicleLogQuery): Record<string, string | number> | undefined {
  if (!params) return undefined
  const out: Record<string, string | number> = {}
  if (params.logType) out.logType = params.logType
  if (params.vehicleId) out.vehicleId = params.vehicleId
  if (params.driverId) out.driverId = params.driverId
  if (params.serviceTypeId) out.serviceTypeId = params.serviceTypeId
  if (params.start) out.start = params.start
  if (params.end) out.end = params.end
  return Object.keys(out).length ? out : undefined
}

export const transportApi = {
  listVehicles: () => api.get<Vehicle[]>(endpoints.transport.vehicles).then((r) => r.data ?? []),
  createVehicle: (body: VehicleWritePayload) =>
    api.post<Vehicle>(endpoints.transport.vehicles, body).then((r) => r.data as Vehicle),
  deleteVehicle: (id: number) => api.delete(endpoints.transport.vehicleById(id)).then(() => undefined),

  listLogs: (params?: VehicleLogQuery) =>
    api.get<VehicleLog[]>(endpoints.transport.logs, { params: compactLogQuery(params) }).then((r) => r.data ?? []),
  createLog: (body: VehicleLogWritePayload) =>
    api.post<VehicleLog>(endpoints.transport.logs, body).then((r) => r.data as VehicleLog),
  deleteLog: (id: number) => api.delete(endpoints.transport.logById(id)).then(() => undefined),

  listStops: () => api.get<BusStop[]>(endpoints.transport.stops).then((r) => r.data ?? []),
  createStop: (body: BusStopWritePayload) =>
    api.post<BusStop>(endpoints.transport.stops, body).then((r) => r.data as BusStop),

  listServiceTypes: () => api.getList<VehicleServiceType>(endpoints.transport.serviceTypes),
  createServiceType: (body: { name: string }) =>
    api.post<VehicleServiceType>(endpoints.transport.serviceTypes, body).then((r) => r.data as VehicleServiceType),

  listHires: () => api.getList<ExternalHire>(endpoints.transport.hires),
  createHire: (body: ExternalHireWritePayload) =>
    api.post<ExternalHire>(endpoints.transport.hires, body).then((r) => r.data as ExternalHire),

  listAssignments: (params: TransportAssignmentQuery) =>
    api.getList<TransportAssignment>(endpoints.transport.assignments, { params }),
  createAssignment: (body: TransportAssignmentWritePayload) =>
    api
      .post<TransportAssignment>(endpoints.transport.assignments, body)
      .then((r) => r.data as TransportAssignment),
  deleteAssignment: (id: number) =>
    api.delete(endpoints.transport.assignmentById(id)).then(() => undefined),
}
