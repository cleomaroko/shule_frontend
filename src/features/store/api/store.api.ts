import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  StockLog,
  StockLogCreatePayload,
  StockLogUpdatePayload,
  StoreItem,
  StoreItemWritePayload,
} from '@/features/store/types/store.types'

export const storeApi = {
  listItems: () => api.get<StoreItem[]>(endpoints.store.items).then((r) => r.data ?? []),
  createItem: (body: StoreItemWritePayload) =>
    api.post<StoreItem>(endpoints.store.items, body).then((r) => r.data as StoreItem),
  listLogs: () => api.get<StockLog[]>(endpoints.store.logs).then((r) => r.data ?? []),
  createLog: (body: StockLogCreatePayload) =>
    api.post<StockLog>(endpoints.store.logs, body).then((r) => r.data as StockLog),
  updateLog: (id: number, body: StockLogUpdatePayload) =>
    api.put<StockLog>(endpoints.store.logById(id), body).then((r) => r.data as StockLog),
  removeLog: (id: number) => api.delete(endpoints.store.logById(id)).then(() => undefined),
}
