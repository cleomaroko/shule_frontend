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

export function useAssetCategoryList() {
  return useQuery({
    queryKey: queryKeys.assets.categories,
    queryFn: assetsApi.listCategories,
  })
}

export function useAssetMutations() {
  const queryClient = useQueryClient()

  const invalidateAssets = () => queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
  const invalidateCategories = () => queryClient.invalidateQueries({ queryKey: queryKeys.assets.categories })

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
      await invalidateCategories()
      toast.success('Category added.')
    },
    onError: (error: unknown) => {
      logger.error('Create asset category failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { createAsset, updateAsset, deleteAsset, createCategory }
}
