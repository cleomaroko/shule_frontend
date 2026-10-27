import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { learnersApi } from '@/features/learners/api/learners.api'
import type { BulkPromotionBody, LearnerWriteBody } from '@/features/learners/types/learner.types'
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

export function useLearnerHistory(id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.learners.history(id ?? 0),
    queryFn: () => learnersApi.history(id as number),
    enabled: enabled && Boolean(id),
  })
}

export function useLearnerMutations() {
  const queryClient = useQueryClient()
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.learners.all }),
      queryClient.invalidateQueries({ queryKey: ['learners', 'history'] }),
    ])
  }

  const create = useMutation({
    mutationFn: (body: LearnerWriteBody) => learnersApi.register(body),
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
    mutationFn: ({ id, body }: { id: number; body: LearnerWriteBody }) => learnersApi.update(id, body),
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

  const promoteClass = useMutation({
    mutationFn: (body: BulkPromotionBody) => learnersApi.promoteClass(body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Class promoted.')
    },
    onError: (error: unknown) => {
      logger.error('Class promotion failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const transferCampus = useMutation({
    mutationFn: (body: { learnerId: number; targetCampusId: number; reason: string }) =>
      learnersApi.transferCampus(body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Learner transferred to the new campus.')
    },
    onError: (error: unknown) => {
      logger.error('Campus transfer failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const transferExternal = useMutation({
    mutationFn: (body: { learnerId: number; newSchoolName: string; reason: string }) =>
      learnersApi.transferExternal(body),
    onSuccess: async () => {
      await invalidate()
      toast.success('External exit recorded.')
    },
    onError: (error: unknown) => {
      logger.error('External exit failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const graduateClass = useMutation({
    mutationFn: (body: { campusId: number; className: string }) => learnersApi.graduateClass(body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Class marked as graduated alumni.')
    },
    onError: (error: unknown) => {
      logger.error('Class graduation failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { create, update, remove, promoteClass, transferCampus, transferExternal, graduateClass }
}
