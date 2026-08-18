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
  campuses: () => api.get<Campus[]>(endpoints.campuses).then((r) => r.data ?? []),
  departments: () => api.get<Department[]>(endpoints.departments).then((r) => r.data ?? []),
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
}
