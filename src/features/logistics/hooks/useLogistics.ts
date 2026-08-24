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

  const invalidateZones = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.logistics.zones }),
      queryClient.invalidateQueries({ queryKey: queryKeys.lookups.zones }),
    ])
  }

  const invalidateHouses = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.logistics.houses }),
      queryClient.invalidateQueries({ queryKey: queryKeys.lookups.houses }),
    ])
  }

  const createZone = useMutation({
    mutationFn: (body: { zoneName: string }) => logisticsApi.createZone(body),
    onSuccess: async () => {
      await invalidateZones()
      toast.success('Transport zone added.')
    },
    onError: (error: unknown) => {
      logger.error('Create zone failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateZone = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { zoneName: string } }) =>
      logisticsApi.updateZone(id, body),
    onSuccess: async () => {
      await invalidateZones()
      toast.success('Transport zone updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update zone failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteZone = useMutation({
    mutationFn: (id: number) => logisticsApi.deleteZone(id),
    onSuccess: async () => {
      await invalidateZones()
      toast.success('Transport zone deleted.')
    },
    onError: (error: unknown) => {
      logger.error('Delete zone failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createHouse = useMutation({
    mutationFn: (body: { houseName: string }) => logisticsApi.createHouse(body),
    onSuccess: async () => {
      await invalidateHouses()
      toast.success('House added.')
    },
    onError: (error: unknown) => {
      logger.error('Create house failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateHouse = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { houseName: string } }) =>
      logisticsApi.updateHouse(id, body),
    onSuccess: async () => {
      await invalidateHouses()
      toast.success('House updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update house failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteHouse = useMutation({
    mutationFn: (id: number) => logisticsApi.deleteHouse(id),
    onSuccess: async () => {
      await invalidateHouses()
      toast.success('House removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete house failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { createZone, updateZone, deleteZone, createHouse, updateHouse, deleteHouse }
}
