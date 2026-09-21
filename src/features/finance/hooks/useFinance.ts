import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { financeApi } from '@/features/finance/api/finance.api'
import type { CaptureInvoicePayload, CreatePurchaseOrderPayload } from '@/features/finance/types/finance.types'
import { logger } from '@/lib/logger'

export function useFinanceSummary(enabled = true) {
  return useQuery({
    queryKey: queryKeys.finance.summary,
    queryFn: financeApi.summary,
    enabled,
  })
}

export function useFinanceMutations() {
  const queryClient = useQueryClient()
  const invalidateSummary = () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.summary })

  const createPo = useMutation({
    mutationFn: (body: CreatePurchaseOrderPayload) => financeApi.createPo(body),
    onSuccess: async (saved) => {
      await invalidateSummary()
      toast.success(saved.poNumber ? `${saved.poNumber} created, awaiting finance approval.` : 'Purchase order created.')
    },
    onError: (error: unknown) => {
      logger.error('Create PO failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const approvePo = useMutation({
    mutationFn: (id: number) => financeApi.approvePo(id),
    onSuccess: async (saved) => {
      await invalidateSummary()
      toast.success(saved.poNumber ? `${saved.poNumber} approved.` : 'Purchase order approved.')
    },
    onError: (error: unknown) => {
      logger.error('Approve PO failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const captureInvoice = useMutation({
    mutationFn: (body: CaptureInvoicePayload) => financeApi.captureInvoice(body),
    onSuccess: async (saved) => {
      await invalidateSummary()
      toast.success(saved.invoiceNumber ? `Invoice ${saved.invoiceNumber} captured.` : 'Invoice captured.')
    },
    onError: (error: unknown) => {
      logger.error('Capture invoice failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const recordPayment = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => financeApi.recordInvoicePayment(id, amount),
    onSuccess: async (saved) => {
      await invalidateSummary()
      toast.success(saved.status === 'PAID' ? 'Invoice marked paid.' : 'Partial payment recorded.')
    },
    onError: (error: unknown) => {
      logger.error('Invoice payment failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { createPo, approvePo, captureInvoice, recordPayment }
}
