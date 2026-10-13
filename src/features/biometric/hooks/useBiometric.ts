import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/api/endpoints'
import {
  biometricApi,
  toBiometricParams,
  type BiometricFilterQuery,
} from '@/features/biometric/api/biometric.api'

export function useBiometricSummary(date: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.biometric.summary(date),
    queryFn: () => biometricApi.summary(date),
    enabled: enabled && date.length > 0,
  })
}

export function useBiometricFilter(query: BiometricFilterQuery) {
  const params = toBiometricParams(query)
  return useQuery({
    queryKey: queryKeys.biometric.filter(params),
    queryFn: () => biometricApi.filter(query),
  })
}
