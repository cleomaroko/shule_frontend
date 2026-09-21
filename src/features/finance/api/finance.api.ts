import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  CaptureInvoicePayload,
  CreatePurchaseOrderPayload,
  FinanceSummary,
  Invoice,
  PurchaseOrder,
} from '@/features/finance/types/finance.types'

export const financeApi = {
  createPo: (body: CreatePurchaseOrderPayload) =>
    api.post<PurchaseOrder>(endpoints.finance.createPo, body).then((r) => r.data as PurchaseOrder),

  approvePo: (id: number) =>
    api.patch<PurchaseOrder>(endpoints.finance.approvePo(id)).then((r) => r.data as PurchaseOrder),

  captureInvoice: (body: CaptureInvoicePayload) =>
    api.post<Invoice>(endpoints.finance.invoices, body).then((r) => r.data as Invoice),

  recordInvoicePayment: (id: number, amount: number) =>
    api
      .post<Invoice>(endpoints.finance.invoicePayment(id), undefined, { params: { amount } })
      .then((r) => r.data as Invoice),

  summary: () => api.get<FinanceSummary>(endpoints.finance.summary).then((r) => r.data as FinanceSummary),
}
