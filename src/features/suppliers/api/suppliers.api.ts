import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  Supplier,
  SupplierBusinessType,
  SupplierContract,
  SupplierContractUpdatePayload,
  SupplierContractWritePayload,
  SupplierWritePayload,
} from '@/features/suppliers/types/supplier.types'

export const suppliersApi = {
  list: () => api.getList<Supplier>(endpoints.suppliers.list),
  getOne: (id: number) => api.get<Supplier>(endpoints.suppliers.byId(id)).then((r) => r.data as Supplier),
  create: (body: SupplierWritePayload) =>
    api.post<Supplier>(endpoints.suppliers.list, body).then((r) => r.data as Supplier),
  update: (id: number, body: SupplierWritePayload) =>
    api.put<Supplier>(endpoints.suppliers.byId(id), body).then((r) => r.data as Supplier),
  remove: (id: number) => api.delete(endpoints.suppliers.byId(id)).then(() => undefined),

  listTypes: () => api.getList<SupplierBusinessType>(endpoints.suppliers.types),
  createType: (body: { name: string }) =>
    api.post<SupplierBusinessType>(endpoints.suppliers.types, body).then((r) => r.data as SupplierBusinessType),
  updateType: (id: number, body: { name: string }) =>
    api.put<SupplierBusinessType>(endpoints.suppliers.typeById(id), body).then((r) => r.data as SupplierBusinessType),
  removeType: (id: number) => api.delete(endpoints.suppliers.typeById(id)).then(() => undefined),

  listContracts: (supplierId: number) =>
    api.getList<SupplierContract>(endpoints.suppliers.contractsBySupplier(supplierId)),
  getContract: (id: number) =>
    api.get<SupplierContract>(endpoints.suppliers.contractById(id)).then((r) => r.data as SupplierContract),
  createContract: (body: SupplierContractWritePayload) =>
    api.post<SupplierContract>(endpoints.suppliers.contracts, body).then((r) => r.data as SupplierContract),
  updateContract: (id: number, body: SupplierContractUpdatePayload) =>
    api.put<SupplierContract>(endpoints.suppliers.contractById(id), body).then((r) => r.data as SupplierContract),
  updateContractStatus: (id: number, status: string) =>
    api
      .patch<SupplierContract>(endpoints.suppliers.contractStatus(id), undefined, { params: { status } })
      .then((r) => r.data as SupplierContract),
  removeContract: (id: number) => api.delete(endpoints.suppliers.contractById(id)).then(() => undefined),
}
