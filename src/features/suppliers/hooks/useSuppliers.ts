import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { suppliersApi } from '@/features/suppliers/api/suppliers.api'
import type {
  SupplierContractUpdatePayload,
  SupplierContractWritePayload,
  SupplierWritePayload,
} from '@/features/suppliers/types/supplier.types'
import { logger } from '@/lib/logger'

export function useSupplierList() {
  return useQuery({
    queryKey: queryKeys.suppliers.all,
    queryFn: suppliersApi.list,
  })
}

export function useSupplierTypeList() {
  return useQuery({
    queryKey: queryKeys.suppliers.types,
    queryFn: suppliersApi.listTypes,
  })
}

export function useSupplierContractList(supplierId: number | null) {
  return useQuery({
    queryKey: queryKeys.suppliers.contracts(supplierId ?? 0),
    queryFn: () => suppliersApi.listContracts(supplierId as number),
    enabled: supplierId != null,
  })
}

export function useSupplierMutations() {
  const queryClient = useQueryClient()
  const invalidateSuppliers = () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all })
  const invalidateTypes = () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.types })
  const invalidateContracts = () => queryClient.invalidateQueries({ queryKey: ['suppliers', 'contracts'] })

  const createSupplier = useMutation({
    mutationFn: (body: SupplierWritePayload) => suppliersApi.create(body),
    onSuccess: async () => {
      await invalidateSuppliers()
      toast.success('Supplier registered.')
    },
    onError: (error: unknown) => {
      logger.error('Create supplier failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateSupplier = useMutation({
    mutationFn: ({ id, body }: { id: number; body: SupplierWritePayload }) => suppliersApi.update(id, body),
    onSuccess: async () => {
      await invalidateSuppliers()
      toast.success('Supplier updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update supplier failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteSupplier = useMutation({
    mutationFn: (id: number) => suppliersApi.remove(id),
    onSuccess: async () => {
      await invalidateSuppliers()
      toast.success('Supplier deleted.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createType = useMutation({
    mutationFn: (body: { name: string }) => suppliersApi.createType(body),
    onSuccess: async () => {
      await invalidateTypes()
      toast.success('Business type added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const updateType = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => suppliersApi.updateType(id, { name }),
    onSuccess: async () => {
      await invalidateTypes()
      toast.success('Business type updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const deleteType = useMutation({
    mutationFn: (id: number) => suppliersApi.removeType(id),
    onSuccess: async () => {
      await invalidateTypes()
      toast.success('Business type removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createContract = useMutation({
    mutationFn: (body: SupplierContractWritePayload) => suppliersApi.createContract(body),
    onSuccess: async () => {
      await invalidateContracts()
      toast.success('Contract added.')
    },
    onError: (error: unknown) => {
      logger.error('Create contract failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateContract = useMutation({
    mutationFn: ({ id, body }: { id: number; body: SupplierContractUpdatePayload }) =>
      suppliersApi.updateContract(id, body),
    onSuccess: async () => {
      await invalidateContracts()
      toast.success('Contract updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const updateContractStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => suppliersApi.updateContractStatus(id, status),
    onSuccess: async () => {
      await invalidateContracts()
      toast.success('Contract status updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const deleteContract = useMutation({
    mutationFn: (id: number) => suppliersApi.removeContract(id),
    onSuccess: async () => {
      await invalidateContracts()
      toast.success('Contract deleted.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  return {
    createSupplier,
    updateSupplier,
    deleteSupplier,
    createType,
    updateType,
    deleteType,
    createContract,
    updateContract,
    updateContractStatus,
    deleteContract,
  }
}
