import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { Asset, AssetCategory, AssetWritePayload } from '@/features/assets/types/asset.types'

export const assetsApi = {
  list: () => api.get<Asset[]>(endpoints.assets.list).then((r) => r.data ?? []),
  create: (body: AssetWritePayload) => api.post<Asset>(endpoints.assets.list, body).then((r) => r.data as Asset),
  update: (id: number, body: AssetWritePayload) =>
    api.put<Asset>(endpoints.assets.byId(id), body).then((r) => r.data as Asset),
  remove: (id: number) => api.delete(endpoints.assets.byId(id)).then(() => undefined),
  listCategories: () => api.getList<AssetCategory>(endpoints.assets.categories),
  createCategory: (body: { name: string }) =>
    api.post<AssetCategory>(endpoints.assets.categories, body).then((r) => r.data as AssetCategory),
}
