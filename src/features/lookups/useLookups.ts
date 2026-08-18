import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { queryKeys } from '@/api/endpoints'
import { lookupsApi } from '@/features/lookups/lookups.api'
import type {
  Campus,
  Department,
  HouseOption,
  NamedLookup,
  SchoolClassOption,
  StreamOption,
  ZoneOption,
} from '@/features/lookups/lookups.types'

const LOOKUP_STALE_MS = 10 * 60 * 1000

function useLookupQuery<T>(key: readonly unknown[], queryFn: () => Promise<T[]>): UseQueryResult<T[]> {
  return useQuery({
    queryKey: key,
    queryFn,
    staleTime: LOOKUP_STALE_MS,
    placeholderData: (previous) => previous,
  })
}

export function useCampuses(): UseQueryResult<Campus[]> {
  return useLookupQuery(queryKeys.lookups.campuses, lookupsApi.campuses)
}

export function useDepartments(): UseQueryResult<Department[]> {
  return useLookupQuery(queryKeys.lookups.departments, lookupsApi.departments)
}

export function useTitles(): UseQueryResult<NamedLookup[]> {
  return useLookupQuery(queryKeys.lookups.titles, lookupsApi.titles)
}

export function useGenders(): UseQueryResult<NamedLookup[]> {
  return useLookupQuery(queryKeys.lookups.genders, lookupsApi.genders)
}

export function useMaritalStatuses(): UseQueryResult<NamedLookup[]> {
  return useLookupQuery(queryKeys.lookups.maritalStatuses, lookupsApi.maritalStatuses)
}

export function useBanks(): UseQueryResult<NamedLookup[]> {
  return useLookupQuery(queryKeys.lookups.banks, lookupsApi.banks)
}

export function useEmploymentStatuses(): UseQueryResult<NamedLookup[]> {
  return useLookupQuery(queryKeys.lookups.employmentStatuses, lookupsApi.employmentStatuses)
}

export function useTaxExemptReasons(): UseQueryResult<NamedLookup[]> {
  return useLookupQuery(queryKeys.lookups.taxExemptReasons, lookupsApi.taxExemptReasons)
}

export function useCounties(): UseQueryResult<NamedLookup[]> {
  return useLookupQuery(queryKeys.lookups.counties, lookupsApi.counties)
}

export function useSchoolClasses(): UseQueryResult<SchoolClassOption[]> {
  return useLookupQuery(queryKeys.lookups.classes, lookupsApi.classes)
}

export function useStreams(): UseQueryResult<StreamOption[]> {
  return useLookupQuery(queryKeys.lookups.streams, lookupsApi.streams)
}

export function useZones(): UseQueryResult<ZoneOption[]> {
  return useLookupQuery(queryKeys.lookups.zones, lookupsApi.zones)
}

export function useHouses(): UseQueryResult<HouseOption[]> {
  return useLookupQuery(queryKeys.lookups.houses, lookupsApi.houses)
}

export function namesOf(items: NamedLookup[] | undefined): string[] {
  return (items ?? []).map((item) => item.name).filter(Boolean)
}
