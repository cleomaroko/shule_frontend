import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { transportApi } from '@/features/transport/api/transport.api'
import type {
  BusStopWritePayload,
  ConsumptionQuery,
  ExternalHireWritePayload,
  TransportAssignmentQuery,
  TransportAssignmentWritePayload,
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

export function useHireList() {
  return useQuery({
    queryKey: queryKeys.transport.hires,
    queryFn: transportApi.listHires,
  })
}

export function useConsumptionReport(params: ConsumptionQuery) {
  return useQuery({
    queryKey: queryKeys.transport.consumption(params),
    queryFn: () => transportApi.consumption(params),
  })
}

export function useTransportAssignmentList(params: TransportAssignmentQuery | undefined) {
  return useQuery({
    queryKey: params
      ? queryKeys.transport.assignments(params)
      : (['transport', 'assignments', 'idle'] as const),
    queryFn: () => transportApi.listAssignments(params as TransportAssignmentQuery),
    enabled: Boolean(params),
  })
}

export function useTransportMutations() {
  const queryClient = useQueryClient()

  const invalidateVehicles = () => queryClient.invalidateQueries({ queryKey: queryKeys.transport.vehicles })
  const invalidateLogs = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transport.logs }),
      queryClient.invalidateQueries({ queryKey: ['transport', 'consumption'] }),
    ])
  }
  const invalidateStops = () => queryClient.invalidateQueries({ queryKey: queryKeys.transport.stops })
  const invalidateServiceTypes = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.transport.serviceTypes })
  const invalidateHires = () => queryClient.invalidateQueries({ queryKey: queryKeys.transport.hires })
  const invalidateAssignments = () =>
    queryClient.invalidateQueries({ queryKey: ['transport', 'assignments'] })

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

  const createServiceType = useMutation({
    mutationFn: (body: { name: string }) => transportApi.createServiceType(body),
    onSuccess: async () => {
      await invalidateServiceTypes()
      toast.success('Service type added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const deleteServiceType = useMutation({
    mutationFn: (id: number) => transportApi.deleteServiceType(id),
    onSuccess: async () => {
      await invalidateServiceTypes()
      toast.success('Service type removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete service type failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createHire = useMutation({
    mutationFn: (body: ExternalHireWritePayload) => transportApi.createHire(body),
    onSuccess: async () => {
      await invalidateHires()
      toast.success('External hire recorded.')
    },
    onError: (error: unknown) => {
      logger.error('Create external hire failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateHire = useMutation({
    mutationFn: ({ id, body }: { id: number; body: ExternalHireWritePayload }) =>
      transportApi.updateHire(id, body),
    onSuccess: async () => {
      await invalidateHires()
      toast.success('External hire updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update external hire failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteHire = useMutation({
    mutationFn: (id: number) => transportApi.deleteHire(id),
    onSuccess: async () => {
      await invalidateHires()
      toast.success('External hire removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete external hire failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createAssignment = useMutation({
    mutationFn: (body: TransportAssignmentWritePayload) => transportApi.createAssignment(body),
    onSuccess: async () => {
      await invalidateAssignments()
      toast.success('Learner assigned to the register.')
    },
    onError: (error: unknown) => {
      logger.error('Create transport assignment failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteAssignment = useMutation({
    mutationFn: (id: number) => transportApi.deleteAssignment(id),
    onSuccess: async () => {
      await invalidateAssignments()
      toast.success('Learner removed from the register.')
    },
    onError: (error: unknown) => {
      logger.error('Delete transport assignment failed', error)
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
    deleteStop,
    createServiceType,
    deleteServiceType,
    createHire,
    updateHire,
    deleteHire,
    createAssignment,
    deleteAssignment,
  }
}
