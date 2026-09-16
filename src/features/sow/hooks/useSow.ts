import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { compactSowQuery, sowApi } from '@/features/sow/api/sow.api'
import type { SchemeOfWorkPayload, SowReportQuery } from '@/features/sow/types/sow.types'
import { logger } from '@/lib/logger'

export function useSowReport(params?: SowReportQuery) {
  const compact = compactSowQuery(params)
  return useQuery({
    queryKey: queryKeys.sow.report(compact),
    queryFn: () => sowApi.report(params),
  })
}

export function useSowMutations() {
  const queryClient = useQueryClient()

  const upload = useMutation({
    mutationFn: (body: SchemeOfWorkPayload) => sowApi.upload(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sow', 'report'] })
      toast.success('Scheme of work uploaded.')
    },
    onError: (error: unknown) => {
      logger.error('Upload scheme of work failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { upload }
}
