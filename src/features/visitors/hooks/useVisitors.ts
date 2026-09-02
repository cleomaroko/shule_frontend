import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { visitorsApi, type VisitorCheckInPayload } from '@/features/visitors/api/visitors.api'
import { logger } from '@/lib/logger'

export function useVisitorList() {
  return useQuery({
    queryKey: queryKeys.visitors.all,
    queryFn: visitorsApi.list,
  })
}

export function useVisitorCategoryList() {
  return useQuery({
    queryKey: queryKeys.visitors.categories,
    queryFn: visitorsApi.listCategories,
  })
}

export function useVisitorPurposeList() {
  return useQuery({
    queryKey: queryKeys.visitors.purposes,
    queryFn: visitorsApi.listPurposes,
  })
}

export function useVisitorMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.visitors.all })
  const invalidateLookups = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.categories }),
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.purposes }),
    ])

  const checkIn = useMutation({
    mutationFn: (body: VisitorCheckInPayload) => visitorsApi.checkIn(body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Visitor checked in.')
    },
    onError: (error: unknown) => {
      logger.error('Visitor check-in failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const checkOut = useMutation({
    mutationFn: (id: number) => visitorsApi.checkOut(id),
    onSuccess: async () => {
      await invalidate()
      toast.success('Visitor checked out.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => visitorsApi.remove(id),
    onSuccess: async () => {
      await invalidate()
      toast.success('Visitor record removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createCategory = useMutation({
    mutationFn: (body: { name: string }) => visitorsApi.createCategory(body),
    onSuccess: async () => {
      await invalidateLookups()
      toast.success('Category added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createPurpose = useMutation({
    mutationFn: (body: { name: string }) => visitorsApi.createPurpose(body),
    onSuccess: async () => {
      await invalidateLookups()
      toast.success('Purpose added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  return { checkIn, checkOut, remove, createCategory, createPurpose }
}
