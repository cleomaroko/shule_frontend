import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { storeApi } from '@/features/store/api/store.api'
import type {
  StockLogCreatePayload,
  StockLogUpdatePayload,
  StoreItemWritePayload,
} from '@/features/store/types/store.types'
import { logger } from '@/lib/logger'

export function useStoreItems() {
  return useQuery({
    queryKey: queryKeys.store.items,
    queryFn: storeApi.listItems,
  })
}

export function useStoreLogs() {
  return useQuery({
    queryKey: queryKeys.store.logs,
    queryFn: storeApi.listLogs,
  })
}

export function useStoreMutations() {
  const queryClient = useQueryClient()
  const invalidateItems = () => queryClient.invalidateQueries({ queryKey: queryKeys.store.items })
  const invalidateLogs = () => queryClient.invalidateQueries({ queryKey: queryKeys.store.logs })

  const createItem = useMutation({
    mutationFn: (body: StoreItemWritePayload) => storeApi.createItem(body),
    onSuccess: async () => {
      await invalidateItems()
      toast.success('Store item created.')
    },
    onError: (error: unknown) => {
      logger.error('Create store item failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createLog = useMutation({
    mutationFn: (body: StockLogCreatePayload) => storeApi.createLog(body),
    onSuccess: async () => {
      await invalidateLogs()
      toast.success('Stock transaction recorded.')
    },
    onError: (error: unknown) => {
      logger.error('Create stock log failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateLog = useMutation({
    mutationFn: ({ id, body }: { id: number; body: StockLogUpdatePayload }) => storeApi.updateLog(id, body),
    onSuccess: async () => {
      await invalidateLogs()
      toast.success('Stock record corrected.')
    },
    onError: (error: unknown) => {
      logger.error('Update stock log failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteLog = useMutation({
    mutationFn: (id: number) => storeApi.removeLog(id),
    onSuccess: async () => {
      await invalidateLogs()
      toast.success('Stock log removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete stock log failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { createItem, createLog, updateLog, deleteLog }
}
