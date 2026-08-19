import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  Campus,
  Department,
  HouseOption,
  NamedLookup,
  SchoolClassOption,
  StreamOption,
  ZoneOption,
} from '@/features/lookups/lookups.types'

/**
 * Lookup fetchers.
 *
 * Campuses and departments wrap results in `ApiResponse`. Titles, genders,
 * pickers, etc. return a raw JSON array — see `LookupController` / `PickerController`.
 */
export const lookupsApi = {
  campuses: () => api.get<Campus[]>(endpoints.campuses.list).then((r) => r.data ?? []),
  departments: () => api.get<Department[]>(endpoints.departments.list).then((r) => r.data ?? []),
  titles: () => api.getList<NamedLookup>(endpoints.lookups.titles),
  genders: () => api.getList<NamedLookup>(endpoints.lookups.genders),
  maritalStatuses: () => api.getList<NamedLookup>(endpoints.lookups.maritalStatuses),
  banks: () => api.getList<NamedLookup>(endpoints.lookups.banks),
  employmentStatuses: () => api.getList<NamedLookup>(endpoints.lookups.employmentStatuses),
  taxExemptReasons: () => api.getList<NamedLookup>(endpoints.lookups.taxExemptReasons),
  counties: () => api.getList<NamedLookup>(endpoints.pickers.counties),
  classes: () => api.getList<SchoolClassOption>(endpoints.pickers.classes),
  streams: () => api.getList<StreamOption>(endpoints.pickers.streams),
  zones: () => api.getList<ZoneOption>(endpoints.pickers.zones),
  houses: () => api.getList<HouseOption>(endpoints.pickers.houses),

  createCampus(body: { name: string; location?: string }): Promise<Campus> {
    return api.post<Campus>(endpoints.campuses.list, body).then((r) => r.data as Campus)
  },
  updateCampus(id: number, body: { name: string; location?: string | null }): Promise<Campus> {
    return api.put<Campus>(endpoints.campuses.byId(id), body).then((r) => r.data as Campus)
  },
  deleteCampus(id: number): Promise<void> {
    return api.delete(endpoints.campuses.byId(id)).then(() => undefined)
  },
  createDepartment(body: { name: string }): Promise<Department> {
    return api.post<Department>(endpoints.departments.list, body).then((r) => r.data as Department)
  },
  deleteDepartment(id: number): Promise<void> {
    return api.delete(endpoints.departments.byId(id)).then(() => undefined)
  },
  addNamed(path: string, name: string): Promise<NamedLookup> {
    return api.post<NamedLookup>(path, { name }).then((r) => r.data as NamedLookup)
  },
}
