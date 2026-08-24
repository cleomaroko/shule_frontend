import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  BusStop,
  BusStopWritePayload,
  Vehicle,
  VehicleLog,
  VehicleLogWritePayload,
  VehicleWritePayload,
} from '@/features/transport/types/transport.types'

export const transportApi = {
  listVehicles: () => api.get<Vehicle[]>(endpoints.transport.vehicles).then((r) => r.data ?? []),
  createVehicle: (body: VehicleWritePayload) =>
    api.post<Vehicle>(endpoints.transport.vehicles, body).then((r) => r.data as Vehicle),
  updateVehicle: (id: number, body: VehicleWritePayload) =>
    api.put<Vehicle>(endpoints.transport.vehicleById(id), body).then((r) => r.data as Vehicle),
  deleteVehicle: (id: number) => api.delete(endpoints.transport.vehicleById(id)).then(() => undefined),

  listLogs: () => api.get<VehicleLog[]>(endpoints.transport.logs).then((r) => r.data ?? []),
  createLog: (body: VehicleLogWritePayload) =>
    api.post<VehicleLog>(endpoints.transport.logs, body).then((r) => r.data as VehicleLog),
  updateLog: (id: number, body: VehicleLogWritePayload) =>
    api.put<VehicleLog>(endpoints.transport.logById(id), body).then((r) => r.data as VehicleLog),
  deleteLog: (id: number) => api.delete(endpoints.transport.logById(id)).then(() => undefined),

  listStops: () => api.getList<BusStop>(endpoints.transport.stops),
  createStop: (body: BusStopWritePayload) =>
    api.post<BusStop>(endpoints.transport.stops, body).then((r) => r.data as BusStop),
  updateStop: (id: number, body: BusStopWritePayload) =>
    api.put<BusStop>(endpoints.transport.stopById(id), body).then((r) => r.data as BusStop),
  deleteStop: (id: number) => api.delete(endpoints.transport.stopById(id)).then(() => undefined),
}
