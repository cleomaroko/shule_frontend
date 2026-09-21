import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { FeePaymentPayload, FeeTransaction } from '@/features/fees/types/fee.types'

export const feesApi = {
  /**
   * GET `/api/finance/fees/balance/{learnerId}`.
   * The controller does not accept `termId` and always uses term `1L`.
   */
  balance: (learnerId: number) =>
    api.get<number | string>(endpoints.fees.balance(learnerId)).then((r) => r.data),

  pay: (body: FeePaymentPayload, termId?: number) =>
    api
      .post<FeeTransaction>(endpoints.fees.pay, body, termId ? { params: { termId } } : undefined)
      .then((r) => r.data as FeeTransaction),
}
