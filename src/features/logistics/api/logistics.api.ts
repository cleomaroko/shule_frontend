import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { House, TransportZone } from '@/features/logistics/types/logistics.types'

export const logisticsApi = {
  listZones: () => api.getList<TransportZone>(endpoints.logistics.zones),
  createZone: (body: { zoneName: string }) =>
    api.post<TransportZone>(endpoints.logistics.zones, body).then((r) => r.data),
  updateZone: (id: number, body: { zoneName: string }) =>
    api.put<TransportZone>(endpoints.logistics.zoneById(id), body).then((r) => r.data),
  deleteZone: (id: number) => api.delete(endpoints.logistics.zoneById(id)).then(() => undefined),
  listHouses: () => api.getList<House>(endpoints.logistics.houses),
  createHouse: (body: { houseName: string }) =>
    api.post<House>(endpoints.logistics.houses, body).then((r) => r.data),
  updateHouse: (id: number, body: { houseName: string }) =>
    api.put<House>(endpoints.logistics.houseById(id), body).then((r) => r.data),
  deleteHouse: (id: number) => api.delete(endpoints.logistics.houseById(id)).then(() => undefined),
}
