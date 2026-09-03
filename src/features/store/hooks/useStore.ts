import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { storeApi } from '@/features/store/api/store.api'
import type {
  InventoryCategoryWritePayload,
  StockLogCreatePayload,
  StockLogUpdatePayload,
  StoreItemWritePayload,
  StoreLocationWritePayload,
} from '@/features/store/types/store.types'
import { logger } from '@/lib/logger'

export function useStoreLocations() {
  return useQuery({
    queryKey: queryKeys.store.locations,
    queryFn: storeApi.listLocations,
  })
}

export function useStoreCategories() {
  return useQuery({
    queryKey: queryKeys.store.categories,
    queryFn: storeApi.listCategories,
  })
}

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

export function useStoreStockTake(params: {
  storeId: number
  termId: number
  startDate: string
  endDate: string
} | null) {
  return useQuery({
    queryKey: queryKeys.store.stockTake(params ?? { storeId: 0, termId: 0, startDate: '', endDate: '' }),
    queryFn: () => storeApi.stockTake(params as { storeId: number; termId: number; startDate: string; endDate: string }),
    enabled: params != null,
  })
}

export function useItemMovements(itemId: number | null) {
  return useQuery({
    queryKey: queryKeys.store.itemMovements(itemId ?? 0),
    queryFn: () => storeApi.itemMovements(itemId as number),
    enabled: itemId != null,
  })
}

export function useStoreMutations() {
  const queryClient = useQueryClient()
  const invalidateItems = () => queryClient.invalidateQueries({ queryKey: queryKeys.store.items })
  const invalidateLogs = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.store.logs }),
      queryClient.invalidateQueries({ queryKey: ['store', 'stock-take'] }),
      queryClient.invalidateQueries({ queryKey: ['store', 'items'] }),
    ])
  const invalidateLocations = () => queryClient.invalidateQueries({ queryKey: queryKeys.store.locations })
  const invalidateCategories = () => queryClient.invalidateQueries({ queryKey: queryKeys.store.categories })

  const createLocation = useMutation({
    mutationFn: (body: StoreLocationWritePayload) => storeApi.createLocation(body),
    onSuccess: async () => {
      await invalidateLocations()
      toast.success('Store location added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const deleteLocation = useMutation({
    mutationFn: (id: number) => storeApi.deleteLocation(id),
    onSuccess: async () => {
      await invalidateLocations()
      toast.success('Store location removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createCategory = useMutation({
    mutationFn: (body: InventoryCategoryWritePayload) => storeApi.createCategory(body),
    onSuccess: async () => {
      await invalidateCategories()
      toast.success('Category added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const deleteCategory = useMutation({
    mutationFn: (id: number) => storeApi.deleteCategory(id),
    onSuccess: async () => {
      await invalidateCategories()
      toast.success('Category removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

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
  const updateItem = useMutation({
    mutationFn: ({ id, body }: { id: number; body: StoreItemWritePayload }) => storeApi.updateItem(id, body),
    onSuccess: async () => {
      await invalidateItems()
      toast.success('Store item updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const deleteItem = useMutation({
    mutationFn: (id: number) => storeApi.deleteItem(id),
    onSuccess: async () => {
      await invalidateItems()
      toast.success('Store item removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
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

  return {
    createLocation,
    deleteLocation,
    createCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    createLog,
    updateLog,
    deleteLog,
  }
}
