import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import {
  compactRequisitionQuery,
  requisitionsApi,
} from '@/features/requisitions/api/requisitions.api'
import type {
  CreateRequisitionPayload,
  RequisitionQuery,
  WorkflowActionPayload,
} from '@/features/requisitions/types/requisition.types'
import { logger } from '@/lib/logger'

export function useRequisitionList(params?: RequisitionQuery) {
  const compact = compactRequisitionQuery(params)
  return useQuery({
    queryKey: queryKeys.requisitions.list(compact),
    queryFn: () => requisitionsApi.list(params),
  })
}

export function useMyRequisitions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.requisitions.mine,
    queryFn: requisitionsApi.mine,
    enabled,
  })
}

export function useRequisition(id: number | null) {
  return useQuery({
    queryKey: queryKeys.requisitions.detail(id ?? 0),
    queryFn: () => requisitionsApi.getById(id as number),
    enabled: id != null,
  })
}

export function useRequisitionSummary(params?: RequisitionQuery) {
  const compact = compactRequisitionQuery(params)
  return useQuery({
    queryKey: queryKeys.requisitions.summary(compact),
    queryFn: () => requisitionsApi.summary(params),
  })
}

export function useCostCenters() {
  return useQuery({
    queryKey: queryKeys.requisitions.costCenters,
    queryFn: requisitionsApi.listCostCenters,
  })
}

export function useRequisitionMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.requisitions.all })

  const create = useMutation({
    mutationFn: (body: CreateRequisitionPayload) => requisitionsApi.create(body),
    onSuccess: async (saved) => {
      await invalidate()
      toast.success(saved.requisitionNumber ? `Submitted ${saved.requisitionNumber}.` : 'Requisition submitted.')
    },
    onError: (error: unknown) => {
      logger.error('Create requisition failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const review = useMutation({
    mutationFn: ({ id, body }: { id: number; body: WorkflowActionPayload }) =>
      requisitionsApi.review(id, body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Requisition reviewed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const approve = useMutation({
    mutationFn: ({ id, body }: { id: number; body: WorkflowActionPayload }) =>
      requisitionsApi.approve(id, body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Requisition approved.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const receive = useMutation({
    mutationFn: (id: number) => requisitionsApi.receive(id),
    onSuccess: async () => {
      await invalidate()
      toast.success('Requisition marked as received.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const reject = useMutation({
    mutationFn: ({ id, body }: { id: number; body: WorkflowActionPayload }) =>
      requisitionsApi.reject(id, body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Requisition rejected.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createCostCenter = useMutation({
    mutationFn: (body: { name: string }) => requisitionsApi.createCostCenter(body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Cost center added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const updateCostCenter = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      requisitionsApi.updateCostCenter(id, { name }),
    onSuccess: async () => {
      await invalidate()
      toast.success('Cost center updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const deleteCostCenter = useMutation({
    mutationFn: (id: number) => requisitionsApi.deleteCostCenter(id),
    onSuccess: async () => {
      await invalidate()
      toast.success('Cost center removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  return {
    create,
    review,
    approve,
    receive,
    reject,
    createCostCenter,
    updateCostCenter,
    deleteCostCenter,
  }
}
