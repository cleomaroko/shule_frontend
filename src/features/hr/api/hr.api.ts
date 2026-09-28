import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  LeaveApplicationPayload,
  PayrollRecord,
  SalarySettingPayload,
  StaffAppraisal,
  StaffAttendancePayload,
  StaffLeave,
} from '@/features/hr/types/hr.types'

export const hrApi = {
  myAppraisals: () => api.get<StaffAppraisal[]>(endpoints.hr.myAppraisals).then((r) => r.data ?? []),
  applyLeave: (body: LeaveApplicationPayload) =>
    api.post<StaffLeave>(endpoints.hr.leaveApplication, body).then((r) => r.data as StaffLeave),
  uploadAttendance: (body: StaffAttendancePayload[]) =>
    api.post<unknown[]>(endpoints.hr.attendanceBulk, body).then((r) => r.data ?? []),
  processPayroll: (month: string) => api.post<null>(endpoints.hr.processPayroll(month)).then((r) => r.data),
  leaves: () => api.get<StaffLeave[]>(endpoints.hr.leaves).then((r) => r.data ?? []),
  updateLeaveStatus: (id: number, status: 'APPROVED' | 'REJECTED') =>
    api.patch<StaffLeave>(endpoints.hr.leaveStatus(id), undefined, { params: { status } }).then((r) => r.data as StaffLeave),
  payroll: () => api.get<PayrollRecord[]>(endpoints.hr.payroll).then((r) => r.data ?? []),
  salarySettings: (body: SalarySettingPayload) =>
    api.post<unknown>(endpoints.hr.salarySettings, body).then((r) => r.data),
  myPayroll: () => api.get<PayrollRecord[]>(endpoints.hr.myPayroll).then((r) => r.data ?? []),
}