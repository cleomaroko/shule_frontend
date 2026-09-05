import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  ExpiryReportQuery,
  InventoryCategory,
  InventoryCategoryWritePayload,
  ItemBatch,
  ItemUnit,
  ItemUnitWritePayload,
  StockLog,
  StockLogCreatePayload,
  StockLogUpdatePayload,
  StoreItem,
  StoreItemWritePayload,
  StoreLocation,
  StoreLocationWritePayload,
} from '@/features/store/types/store.types'

function compactExpiryParams(params: ExpiryReportQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (params.itemId) out.itemId = params.itemId
  if (params.storeId) out.storeId = params.storeId
  if (params.status) out.status = params.status
  return out
}

export const storeApi = {
  listLocations: () => api.get<StoreLocation[]>(endpoints.store.locations).then((r) => r.data ?? []),
  createLocation: (body: StoreLocationWritePayload) =>
    api.post<StoreLocation>(endpoints.store.locations, body).then((r) => r.data as StoreLocation),
  deleteLocation: (id: number) => api.delete(endpoints.store.locationById(id)).then(() => undefined),

  listCategories: () => api.get<InventoryCategory[]>(endpoints.store.categories).then((r) => r.data ?? []),
  createCategory: (body: InventoryCategoryWritePayload) =>
    api.post<InventoryCategory>(endpoints.store.categories, body).then((r) => r.data as InventoryCategory),
  deleteCategory: (id: number) => api.delete(endpoints.store.categoryById(id)).then(() => undefined),

  listUnits: () => api.get<ItemUnit[]>(endpoints.store.units).then((r) => r.data ?? []),
  createUnit: (body: ItemUnitWritePayload) =>
    api.post<ItemUnit>(endpoints.store.units, body).then((r) => r.data as ItemUnit),
  deleteUnit: (id: number) => api.delete(endpoints.store.unitById(id)).then(() => undefined),

  listItems: () => api.get<StoreItem[]>(endpoints.store.items).then((r) => r.data ?? []),
  createItem: (body: StoreItemWritePayload) =>
    api.post<StoreItem>(endpoints.store.items, body).then((r) => r.data as StoreItem),
  updateItem: (id: number, body: StoreItemWritePayload) =>
    api.put<StoreItem>(endpoints.store.itemById(id), body).then((r) => r.data as StoreItem),
  deleteItem: (id: number) => api.delete(endpoints.store.itemById(id)).then(() => undefined),

  listLogs: () => api.get<StockLog[]>(endpoints.store.logs).then((r) => r.data ?? []),
  createLog: (body: StockLogCreatePayload) =>
    api.post<StockLog>(endpoints.store.logs, body).then((r) => r.data as StockLog),
  updateLog: (id: number, body: StockLogUpdatePayload) =>
    api.put<StockLog>(endpoints.store.logById(id), body).then((r) => r.data as StockLog),
  receiveLog: (id: number) => api.patch(endpoints.store.receiveLog(id)).then(() => undefined),
  removeLog: (id: number) => api.delete(endpoints.store.logById(id)).then(() => undefined),

  stockTake: (params: { storeId: number; termId: number; startDate: string; endDate: string }) =>
    api.get<StockLog[]>(endpoints.store.stockTake, { params }).then((r) => r.data ?? []),

  itemMovements: (itemId: number) =>
    api.get<StockLog[]>(endpoints.store.itemMovements(itemId)).then((r) => r.data ?? []),

  expiringSoon: () => api.get<ItemBatch[]>(endpoints.store.expiringSoon).then((r) => r.data ?? []),
  expiryReport: (params: ExpiryReportQuery = {}) =>
    api
      .get<ItemBatch[]>(endpoints.store.expiryReport, { params: compactExpiryParams(params) })
      .then((r) => r.data ?? []),
  correctExpiry: (id: number, expiryDate: string) =>
    api
      .patch<ItemBatch>(endpoints.store.correctExpiry(id), { expiryDate })
      .then((r) => r.data as ItemBatch),
}
