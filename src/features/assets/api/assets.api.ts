import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  Asset,
  AssetLookups,
  AssetNamedLookup,
  AssetSearchParams,
  AssetWritePayload,
} from '@/features/assets/types/asset.types'

function compactParams(params: AssetSearchParams): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (params.brand) out.brand = params.brand
  if (params.model) out.model = params.model
  if (params.serialNumber) out.serialNumber = params.serialNumber
  if (params.descriptionId) out.descriptionId = params.descriptionId
  if (params.categoryId) out.categoryId = params.categoryId
  if (params.campusId) out.campusId = params.campusId
  if (params.departmentId) out.departmentId = params.departmentId
  if (params.staffId) out.staffId = params.staffId
  if (params.conditionId) out.conditionId = params.conditionId
  if (params.statusId) out.statusId = params.statusId
  if (params.purchaseDate) out.purchaseDate = params.purchaseDate
  return out
}

export const assetsApi = {
  list: () => api.get<Asset[]>(endpoints.assets.list).then((r) => r.data ?? []),
  search: (params: AssetSearchParams) =>
    api.get<Asset[]>(endpoints.assets.search, { params: compactParams(params) }).then((r) => r.data ?? []),
  getByTag: (tagId: string) => api.get<Asset>(endpoints.assets.byTag(tagId)).then((r) => r.data as Asset),
  lookups: () =>
    api.get<AssetLookups>(endpoints.assets.lookups).then(
      (r) =>
        r.data ?? {
          categories: [],
          descriptions: [],
          conditions: [],
          statuses: [],
        },
    ),
  create: (body: AssetWritePayload) => api.post<Asset>(endpoints.assets.list, body).then((r) => r.data as Asset),
  update: (id: number, body: AssetWritePayload) =>
    api.put<Asset>(endpoints.assets.byId(id), body).then((r) => r.data as Asset),
  remove: (id: number) => api.delete(endpoints.assets.byId(id)).then(() => undefined),

  listCategories: () => api.getList<AssetNamedLookup>(endpoints.assets.categories),
  createCategory: (body: { name: string }) =>
    api.post<AssetNamedLookup>(endpoints.assets.categories, body).then((r) => r.data as AssetNamedLookup),
  updateCategory: (id: number, body: { name: string }) =>
    api.put<AssetNamedLookup>(endpoints.assets.categoryById(id), body).then((r) => r.data as AssetNamedLookup),
  deleteCategory: (id: number) => api.delete(endpoints.assets.categoryById(id)).then(() => undefined),

  listDescriptions: () => api.getList<AssetNamedLookup>(endpoints.assets.descriptions),
  createDescription: (body: { name: string }) =>
    api.post<AssetNamedLookup>(endpoints.assets.descriptions, body).then((r) => r.data as AssetNamedLookup),
  updateDescription: (id: number, body: { name: string }) =>
    api.put<AssetNamedLookup>(endpoints.assets.descriptionById(id), body).then((r) => r.data as AssetNamedLookup),
  deleteDescription: (id: number) => api.delete(endpoints.assets.descriptionById(id)).then(() => undefined),

  listConditions: () => api.getList<AssetNamedLookup>(endpoints.assets.conditions),
  createCondition: (body: { name: string }) =>
    api.post<AssetNamedLookup>(endpoints.assets.conditions, body).then((r) => r.data as AssetNamedLookup),
  updateCondition: (id: number, body: { name: string }) =>
    api.put<AssetNamedLookup>(endpoints.assets.conditionById(id), body).then((r) => r.data as AssetNamedLookup),
  deleteCondition: (id: number) => api.delete(endpoints.assets.conditionById(id)).then(() => undefined),

  listStatuses: () => api.getList<AssetNamedLookup>(endpoints.assets.statuses),
  createStatus: (body: { name: string }) =>
    api.post<AssetNamedLookup>(endpoints.assets.statuses, body).then((r) => r.data as AssetNamedLookup),
  updateStatus: (id: number, body: { name: string }) =>
    api.put<AssetNamedLookup>(endpoints.assets.statusById(id), body).then((r) => r.data as AssetNamedLookup),
  deleteStatus: (id: number) => api.delete(endpoints.assets.statusById(id)).then(() => undefined),
}
