import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { admissionsApi } from '@/features/admissions/api/admissions.api'

export function usePendingLeads() {
  return useQuery({
    queryKey: queryKeys.admissions.pending,
    queryFn: admissionsApi.listPending,
  })
}

export function useAdmissionMutations() {
  const queryClient = useQueryClient()

  const markProcessed = useMutation({
    mutationFn: (id: number) => admissionsApi.markProcessed(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admissions.pending })
      toast.success('Application marked as processed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  return { markProcessed }
}
