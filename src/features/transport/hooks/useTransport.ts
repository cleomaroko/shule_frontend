import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { transportApi } from '@/features/transport/api/transport.api'
import type {
  BusStopWritePayload,
  VehicleLogWritePayload,
  VehicleWritePayload,
} from '@/features/transport/types/transport.types'
import { logger } from '@/lib/logger'

export function useVehicleList() {
  return useQuery({
    queryKey: queryKeys.transport.vehicles,
    queryFn: transportApi.listVehicles,
  })
}

export function useVehicleLogList() {
  return useQuery({
    queryKey: queryKeys.transport.logs,
    queryFn: transportApi.listLogs,
  })
}

export function useBusStopList() {
  return useQuery({
    queryKey: queryKeys.transport.stops,
    queryFn: transportApi.listStops,
  })
}

export function useTransportMutations() {
  const queryClient = useQueryClient()

  const invalidateVehicles = () => queryClient.invalidateQueries({ queryKey: queryKeys.transport.vehicles })
  const invalidateLogs = () => queryClient.invalidateQueries({ queryKey: queryKeys.transport.logs })
  const invalidateStops = () => queryClient.invalidateQueries({ queryKey: queryKeys.transport.stops })

  const createVehicle = useMutation({
    mutationFn: (body: VehicleWritePayload) => transportApi.createVehicle(body),
    onSuccess: async () => {
      await invalidateVehicles()
      toast.success('Vehicle added to the fleet.')
    },
    onError: (error: unknown) => {
      logger.error('Create vehicle failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateVehicle = useMutation({
    mutationFn: ({ id, body }: { id: number; body: VehicleWritePayload }) =>
      transportApi.updateVehicle(id, body),
    onSuccess: async () => {
      await invalidateVehicles()
      toast.success('Vehicle updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update vehicle failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteVehicle = useMutation({
    mutationFn: (id: number) => transportApi.deleteVehicle(id),
    onSuccess: async () => {
      await invalidateVehicles()
      toast.success('Vehicle removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete vehicle failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createLog = useMutation({
    mutationFn: (body: VehicleLogWritePayload) => transportApi.createLog(body),
    onSuccess: async () => {
      await invalidateLogs()
      toast.success('Vehicle log recorded.')
    },
    onError: (error: unknown) => {
      logger.error('Create vehicle log failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateLog = useMutation({
    mutationFn: ({ id, body }: { id: number; body: VehicleLogWritePayload }) =>
      transportApi.updateLog(id, body),
    onSuccess: async () => {
      await invalidateLogs()
      toast.success('Vehicle log updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update vehicle log failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteLog = useMutation({
    mutationFn: (id: number) => transportApi.deleteLog(id),
    onSuccess: async () => {
      await invalidateLogs()
      toast.success('Vehicle log removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete vehicle log failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createStop = useMutation({
    mutationFn: (body: BusStopWritePayload) => transportApi.createStop(body),
    onSuccess: async () => {
      await invalidateStops()
      toast.success('Bus stop added.')
    },
    onError: (error: unknown) => {
      logger.error('Create bus stop failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateStop = useMutation({
    mutationFn: ({ id, body }: { id: number; body: BusStopWritePayload }) =>
      transportApi.updateStop(id, body),
    onSuccess: async () => {
      await invalidateStops()
      toast.success('Bus stop updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update bus stop failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteStop = useMutation({
    mutationFn: (id: number) => transportApi.deleteStop(id),
    onSuccess: async () => {
      await invalidateStops()
      toast.success('Bus stop removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete bus stop failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return {
    createVehicle,
    updateVehicle,
    deleteVehicle,
    createLog,
    updateLog,
    deleteLog,
    createStop,
    updateStop,
    deleteStop,
  }
}
