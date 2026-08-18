import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { learnersApi } from '@/features/learners/api/learners.api'
import { logger } from '@/lib/logger'

export function useLearnerList() {
  return useQuery({
    queryKey: queryKeys.learners.all,
    queryFn: learnersApi.list,
  })
}

export function useLearner(id: number | undefined) {
  const list = useLearnerList()
  const learner = list.data?.find((item) => item.id === id)

  return {
    ...list,
    learner: learner ?? null,
    isMissing: Boolean(id) && !list.isLoading && !list.isError && !learner,
  }
}

export function useLearnerMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.learners.all })

  const create = useMutation({
    mutationFn: (body: Record<string, string | boolean>) => learnersApi.register(body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Learner enrolled successfully.')
    },
    onError: (error: unknown) => {
      logger.error('Learner registration failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, string | boolean> }) =>
      learnersApi.update(id, body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Learner updated successfully.')
    },
    onError: (error: unknown) => {
      logger.error('Learner update failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => learnersApi.remove(id),
    onSuccess: async () => {
      await invalidate()
      toast.success('Learner record removed.')
    },
    onError: (error: unknown) => {
      logger.error('Learner delete failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { create, update, remove }
}
