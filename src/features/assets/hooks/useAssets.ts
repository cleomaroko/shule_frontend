import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { assetsApi } from '@/features/assets/api/assets.api'
import type { AssetWritePayload } from '@/features/assets/types/asset.types'
import { logger } from '@/lib/logger'

export function useAssetList() {
  return useQuery({
    queryKey: queryKeys.assets.all,
    queryFn: assetsApi.list,
  })
}

export function useAssetLookups() {
  return useQuery({
    queryKey: queryKeys.assets.lookups,
    queryFn: assetsApi.lookups,
  })
}

export function useAssetCategoryList() {
  return useQuery({
    queryKey: queryKeys.assets.categories,
    queryFn: assetsApi.listCategories,
  })
}

export function useAssetDescriptionList() {
  return useQuery({
    queryKey: queryKeys.assets.descriptions,
    queryFn: assetsApi.listDescriptions,
  })
}

export function useAssetConditionList() {
  return useQuery({
    queryKey: queryKeys.assets.conditions,
    queryFn: assetsApi.listConditions,
  })
}

export function useAssetStatusList() {
  return useQuery({
    queryKey: queryKeys.assets.statuses,
    queryFn: assetsApi.listStatuses,
  })
}

function invalidateLookups(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.assets.lookups }),
    queryClient.invalidateQueries({ queryKey: queryKeys.assets.categories }),
    queryClient.invalidateQueries({ queryKey: queryKeys.assets.descriptions }),
    queryClient.invalidateQueries({ queryKey: queryKeys.assets.conditions }),
    queryClient.invalidateQueries({ queryKey: queryKeys.assets.statuses }),
  ])
}

export function useAssetMutations() {
  const queryClient = useQueryClient()

  const invalidateAssets = () => queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })

  const createAsset = useMutation({
    mutationFn: (body: AssetWritePayload) => assetsApi.create(body),
    onSuccess: async () => {
      await invalidateAssets()
      toast.success('Asset registered.')
    },
    onError: (error: unknown) => {
      logger.error('Create asset failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateAsset = useMutation({
    mutationFn: ({ id, body }: { id: number; body: AssetWritePayload }) => assetsApi.update(id, body),
    onSuccess: async () => {
      await invalidateAssets()
      toast.success('Asset updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update asset failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteAsset = useMutation({
    mutationFn: (id: number) => assetsApi.remove(id),
    onSuccess: async () => {
      await invalidateAssets()
      toast.success('Asset removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete asset failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createCategory = useMutation({
    mutationFn: (body: { name: string }) => assetsApi.createCategory(body),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Category added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const updateCategory = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => assetsApi.updateCategory(id, { name }),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Category updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const deleteCategory = useMutation({
    mutationFn: (id: number) => assetsApi.deleteCategory(id),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Category removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createDescription = useMutation({
    mutationFn: (body: { name: string }) => assetsApi.createDescription(body),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Description added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const updateDescription = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => assetsApi.updateDescription(id, { name }),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Description updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const deleteDescription = useMutation({
    mutationFn: (id: number) => assetsApi.deleteDescription(id),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Description removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createCondition = useMutation({
    mutationFn: (body: { name: string }) => assetsApi.createCondition(body),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Condition added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const updateCondition = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => assetsApi.updateCondition(id, { name }),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Condition updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const deleteCondition = useMutation({
    mutationFn: (id: number) => assetsApi.deleteCondition(id),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Condition removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createStatus = useMutation({
    mutationFn: (body: { name: string }) => assetsApi.createStatus(body),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Status added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const updateStatus = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => assetsApi.updateStatus(id, { name }),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Status updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })
  const deleteStatus = useMutation({
    mutationFn: (id: number) => assetsApi.deleteStatus(id),
    onSuccess: async () => {
      await invalidateLookups(queryClient)
      toast.success('Status removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  return {
    createAsset,
    updateAsset,
    deleteAsset,
    createCategory,
    updateCategory,
    deleteCategory,
    createDescription,
    updateDescription,
    deleteDescription,
    createCondition,
    updateCondition,
    deleteCondition,
    createStatus,
    updateStatus,
    deleteStatus,
  }
}
