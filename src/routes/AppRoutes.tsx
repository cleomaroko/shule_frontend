import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'

import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AppPlaceholderPage } from '@/pages/app/AppPlaceholderPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import { paths } from '@/routes/paths'

/**
 * Route tree.
 *
 * ERP modules become children of the protected `AppLayout` branch, so they
 * inherit the guard, header and page shell without further wiring.
 */
export function AppRoutes(): ReactNode {
  return (
    <Routes>
      <Route index element={<Navigate to={paths.app} replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={paths.login} element={<LoginPage />} />
          <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={paths.resetPassword} element={<ResetPasswordPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path={paths.app} element={<AppPlaceholderPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
