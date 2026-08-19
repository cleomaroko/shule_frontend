import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { lookupsApi } from '@/features/lookups/lookups.api'
import { systemApi } from '@/features/system/api/system.api'
import { logger } from '@/lib/logger'

export function useAuditLogs(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.system.logs,
    queryFn: systemApi.logs,
    enabled,
  })
}

export function useEmailUsage(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.system.emailUsage,
    queryFn: systemApi.emailUsage,
    enabled,
  })
}

export function useSystemMutations() {
  const queryClient = useQueryClient()

  const reset = useMutation({
    mutationFn: systemApi.resetToDefaults,
    onSuccess: async (message) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.system.logs }),
        queryClient.invalidateQueries({ queryKey: queryKeys.lookups.campuses }),
        queryClient.invalidateQueries({ queryKey: queryKeys.lookups.departments }),
      ])
      toast.success(message || 'System defaults restored.')
    },
    onError: (error: unknown) => {
      logger.error('System reset failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createCampus = useMutation({
    mutationFn: (body: { name: string; location?: string }) => lookupsApi.createCampus(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lookups.campuses })
      toast.success('Campus created.')
    },
    onError: (error: unknown) => {
      logger.error('Create campus failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateCampus = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name: string; location?: string | null } }) =>
      lookupsApi.updateCampus(id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lookups.campuses })
      toast.success('Campus updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update campus failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteCampus = useMutation({
    mutationFn: (id: number) => lookupsApi.deleteCampus(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lookups.campuses })
      toast.success('Campus deleted.')
    },
    onError: (error: unknown) => {
      logger.error('Delete campus failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createDepartment = useMutation({
    mutationFn: (body: { name: string }) => lookupsApi.createDepartment(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lookups.departments })
      toast.success('Department created.')
    },
    onError: (error: unknown) => {
      logger.error('Create department failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteDepartment = useMutation({
    mutationFn: (id: number) => lookupsApi.deleteDepartment(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lookups.departments })
      toast.success('Department removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete department failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const addLookup = useMutation({
    mutationFn: ({ path, name }: { path: string; name: string; key: readonly unknown[] }) =>
      lookupsApi.addNamed(path, name),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: variables.key })
      toast.success('Value added.')
    },
    onError: (error: unknown) => {
      logger.error('Add lookup failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return {
    reset,
    createCampus,
    updateCampus,
    deleteCampus,
    createDepartment,
    deleteDepartment,
    addLookup,
  }
}
