import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { AuthProvider } from '@/auth/AuthProvider'
import { RootErrorBoundary } from '@/components/feedback/RootErrorBoundary'
import { Toaster } from '@/components/ui/toaster'
import { env } from '@/lib/env'
import { QueryProvider } from '@/providers/QueryProvider'
import { AppRoutes } from '@/routes/AppRoutes'
import { ThemeProvider } from '@/theme/ThemeProvider'

export function App(): ReactNode {
  return (
    <RootErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <BrowserRouter basename={env.routerBasename}>
            <AuthProvider>
              <AppRoutes />
              <Toaster />
            </AuthProvider>
          </BrowserRouter>
        </QueryProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  )
}
