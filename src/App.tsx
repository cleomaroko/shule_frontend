import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { AuthProvider } from '@/auth/AuthProvider'
import { RootErrorBoundary } from '@/components/feedback/RootErrorBoundary'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from '@/providers/QueryProvider'
import { AppRoutes } from '@/routes/AppRoutes'

export function App(): ReactNode {
  return (
    <RootErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </QueryProvider>
    </RootErrorBoundary>
  )
}
