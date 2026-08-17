import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { isApiError } from '@/api/errors'

/**
 * Shared TanStack Query client.
 *
 * Retries are limited to genuine connectivity faults — a request the backend
 * declined (`success: false`, e.g. bad credentials) must never be replayed.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          failureCount < 2 && isApiError(error) && error.isConnectivityError,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function QueryProvider({ children }: { children: ReactNode }): ReactNode {
  // Created in state so the client survives re-renders but is never shared
  // between users during SSR or tests.
  const [queryClient] = useState(createQueryClient)

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
