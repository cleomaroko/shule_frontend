import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'

import { LearnerCreatePage } from '@/features/learners/pages/LearnerCreatePage'
import { LearnerDetailsPage } from '@/features/learners/pages/LearnerDetailsPage'
import { LearnerEditPage } from '@/features/learners/pages/LearnerEditPage'
import { LearnersPage } from '@/features/learners/pages/LearnersPage'
import { StaffCreatePage } from '@/features/staff/pages/StaffCreatePage'
import { StaffDetailsPage } from '@/features/staff/pages/StaffDetailsPage'
import { StaffEditPage } from '@/features/staff/pages/StaffEditPage'
import { StaffPage } from '@/features/staff/pages/StaffPage'
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
          <Route path={paths.staff} element={<StaffPage />} />
          <Route path={paths.staffNew} element={<StaffCreatePage />} />
          <Route path="/staff/:id/edit" element={<StaffEditPage />} />
          <Route path="/staff/:id" element={<StaffDetailsPage />} />
          <Route path={paths.learners} element={<LearnersPage />} />
          <Route path={paths.learnerNew} element={<LearnerCreatePage />} />
          <Route path="/learners/:id/edit" element={<LearnerEditPage />} />
          <Route path="/learners/:id" element={<LearnerDetailsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
