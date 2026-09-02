import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { transportApi } from '@/features/transport/api/transport.api'
import type {
  BusStopWritePayload,
  VehicleLogQuery,
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

export function useVehicleLogList(params?: VehicleLogQuery) {
  return useQuery({
    queryKey: [...queryKeys.transport.logs, params ?? {}] as const,
    queryFn: () => transportApi.listLogs(params),
  })
}

export function useBusStopList() {
  return useQuery({
    queryKey: queryKeys.transport.stops,
    queryFn: transportApi.listStops,
  })
}

export function useVehicleServiceTypeList() {
  return useQuery({
    queryKey: queryKeys.transport.serviceTypes,
    queryFn: transportApi.listServiceTypes,
  })
}

export function useTransportMutations() {
  const queryClient = useQueryClient()

  const invalidateVehicles = () => queryClient.invalidateQueries({ queryKey: queryKeys.transport.vehicles })
  const invalidateLogs = () => queryClient.invalidateQueries({ queryKey: queryKeys.transport.logs })
  const invalidateStops = () => queryClient.invalidateQueries({ queryKey: queryKeys.transport.stops })
  const invalidateServiceTypes = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.transport.serviceTypes })

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

  const createServiceType = useMutation({
    mutationFn: (body: { name: string }) => transportApi.createServiceType(body),
    onSuccess: async () => {
      await invalidateServiceTypes()
      toast.success('Service type added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  return {
    createVehicle,
    deleteVehicle,
    createLog,
    deleteLog,
    createStop,
    createServiceType,
  }
}
