import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { House, TransportZone } from '@/features/logistics/types/logistics.types'

export const logisticsApi = {
  listZones: () => api.getList<TransportZone>(endpoints.logistics.zones),
  createZone: (body: { zoneName: string }) =>
    api.post<TransportZone>(endpoints.logistics.zones, body).then((r) => r.data),
  listHouses: () => api.getList<House>(endpoints.logistics.houses),
  createHouse: (body: { houseName: string }) =>
    api.post<House>(endpoints.logistics.houses, body).then((r) => r.data),
}
