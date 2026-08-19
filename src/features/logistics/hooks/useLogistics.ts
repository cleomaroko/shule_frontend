import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { logisticsApi } from '@/features/logistics/api/logistics.api'
import { logger } from '@/lib/logger'

export function useZoneList() {
  return useQuery({
    queryKey: queryKeys.logistics.zones,
    queryFn: logisticsApi.listZones,
  })
}

export function useHouseList() {
  return useQuery({
    queryKey: queryKeys.logistics.houses,
    queryFn: logisticsApi.listHouses,
  })
}

export function useLogisticsMutations() {
  const queryClient = useQueryClient()

  const createZone = useMutation({
    mutationFn: (body: { zoneName: string }) => logisticsApi.createZone(body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.logistics.zones }),
        queryClient.invalidateQueries({ queryKey: queryKeys.lookups.zones }),
      ])
      toast.success('Transport zone added.')
    },
    onError: (error: unknown) => {
      logger.error('Create zone failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createHouse = useMutation({
    mutationFn: (body: { houseName: string }) => logisticsApi.createHouse(body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.logistics.houses }),
        queryClient.invalidateQueries({ queryKey: queryKeys.lookups.houses }),
      ])
      toast.success('House added.')
    },
    onError: (error: unknown) => {
      logger.error('Create house failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { createZone, createHouse }
}
