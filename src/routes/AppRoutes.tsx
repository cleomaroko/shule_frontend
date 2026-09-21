import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'

import { AcademicsPage } from '@/features/academic/pages/AcademicsPage'
import { FeesPage } from '@/features/fees/pages/FeesPage'
import { FinancePage } from '@/features/finance/pages/FinancePage'
import { FormsPage } from '@/features/forms/pages/FormsPage'
import { SharedFormPage, SharedFormResultsPage } from '@/features/forms/pages/SharedFormPage'
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage'
import { TicketsPage } from '@/features/tickets/pages/TicketsPage'
import { AdmissionsPage } from '@/features/admissions/pages/AdmissionsPage'
import { AssetsPage } from '@/features/assets/pages/AssetsPage'
import { AttendancePage } from '@/features/attendance/pages/AttendancePage'
import { ExamsPage } from '@/features/exams/pages/ExamsPage'
import { StorePage } from '@/features/store/pages/StorePage'
import { SchemesPage } from '@/features/sow/pages/SchemesPage'
import { SuppliersPage } from '@/features/suppliers/pages/SuppliersPage'
import { TransportPage } from '@/features/transport/pages/TransportPage'
import { VisitorsPage } from '@/features/visitors/pages/VisitorsPage'
import { RequisitionsPage } from '@/features/requisitions/pages/RequisitionsPage'
import { LearnerCreatePage } from '@/features/learners/pages/LearnerCreatePage'
import { LearnerDetailsPage } from '@/features/learners/pages/LearnerDetailsPage'
import { LearnerEditPage } from '@/features/learners/pages/LearnerEditPage'
import { LearnersPage } from '@/features/learners/pages/LearnersPage'
import { LogisticsPage } from '@/features/logistics/pages/LogisticsPage'
import { StaffCreatePage } from '@/features/staff/pages/StaffCreatePage'
import { StaffDetailsPage } from '@/features/staff/pages/StaffDetailsPage'
import { StaffEditPage } from '@/features/staff/pages/StaffEditPage'
import { StaffPage } from '@/features/staff/pages/StaffPage'
import { SystemPage } from '@/features/system/pages/SystemPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
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

      <Route path="/forms/shared/:templateId/results" element={<SharedFormResultsPage />} />
      <Route path="/forms/shared/:templateId" element={<SharedFormPage />} />

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
          <Route path={paths.academics} element={<AcademicsPage />} />
          <Route path={paths.attendance} element={<AttendancePage />} />
          <Route path={paths.exams} element={<ExamsPage />} />
          <Route path={paths.schemes} element={<SchemesPage />} />
          <Route path={paths.logistics} element={<LogisticsPage />} />
          <Route path={paths.assets} element={<AssetsPage />} />
          <Route path={paths.store} element={<StorePage />} />
          <Route path={paths.transport} element={<TransportPage />} />
          <Route path={paths.suppliers} element={<SuppliersPage />} />
          <Route path={paths.visitors} element={<VisitorsPage />} />
          <Route path={paths.admissions} element={<AdmissionsPage />} />
          <Route path={paths.requisitions} element={<RequisitionsPage />} />
          <Route path={paths.fees} element={<FeesPage />} />
          <Route path={paths.finance} element={<FinancePage />} />
          <Route path={paths.forms} element={<FormsPage />} />
          <Route path={paths.tickets} element={<TicketsPage />} />
          <Route path={paths.projects} element={<ProjectsPage />} />
          <Route path={paths.reports} element={<ReportsPage />} />
          <Route path={paths.system} element={<SystemPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
