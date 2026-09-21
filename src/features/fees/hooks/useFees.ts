import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { feesApi } from '@/features/fees/api/fees.api'
import type { FeePaymentPayload } from '@/features/fees/types/fee.types'
import { logger } from '@/lib/logger'

export function useFeeBalance(learnerId: number | null) {
  return useQuery({
    queryKey: queryKeys.fees.balance(learnerId ?? 0),
    queryFn: () => feesApi.balance(learnerId as number),
    enabled: learnerId != null,
  })
}

export function useFeeMutations() {
  const queryClient = useQueryClient()

  const pay = useMutation({
    mutationFn: ({ body, termId }: { body: FeePaymentPayload; termId?: number }) =>
      feesApi.pay(body, termId),
    onSuccess: async (_saved, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.fees.balance(variables.body.learner.id),
      })
      toast.success('Payment recorded. A receipt notification is simulated on the server.')
    },
    onError: (error: unknown) => {
      logger.error('Fee payment failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { pay }
}
