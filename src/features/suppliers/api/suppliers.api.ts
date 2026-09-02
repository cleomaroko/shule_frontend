import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  Supplier,
  SupplierBusinessType,
  SupplierContract,
  SupplierContractWritePayload,
  SupplierWritePayload,
} from '@/features/suppliers/types/supplier.types'

export const suppliersApi = {
  list: () => api.getList<Supplier>(endpoints.suppliers.list),
  create: (body: SupplierWritePayload) =>
    api.post<Supplier>(endpoints.suppliers.list, body).then((r) => r.data as Supplier),
  update: (id: number, body: SupplierWritePayload) =>
    api.put<Supplier>(endpoints.suppliers.byId(id), body).then((r) => r.data as Supplier),

  listTypes: () => api.getList<SupplierBusinessType>(endpoints.suppliers.types),
  createType: (body: { name: string }) =>
    api.post<SupplierBusinessType>(endpoints.suppliers.types, body).then((r) => r.data as SupplierBusinessType),

  listContracts: (supplierId: number) =>
    api.getList<SupplierContract>(endpoints.suppliers.contractsBySupplier(supplierId)),
  createContract: (body: SupplierContractWritePayload) =>
    api.post<SupplierContract>(endpoints.suppliers.contracts, body).then((r) => r.data as SupplierContract),
  updateContractStatus: (id: number, status: string) =>
    api
      .patch<SupplierContract>(endpoints.suppliers.contractStatus(id), undefined, { params: { status } })
      .then((r) => r.data as SupplierContract),
}
