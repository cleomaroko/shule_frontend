import { api } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type {
  LeaveApplicationPayload,
  LeaveReviewPayload,
  PayrollRecord,
  SalarySettingPayload,
  StaffAttendanceFilters,
  StaffAttendanceRecord,
  StaffAppraisal,
  StaffAttendancePayload,
  StaffLeave,
} from "@/features/hr/types/hr.types";

export const hrApi = {
  myAppraisals: () =>
    api
      .get<StaffAppraisal[]>(endpoints.hr.myAppraisals)
      .then((r) => r.data ?? []),
  applyLeave: (body: LeaveApplicationPayload) =>
    api
      .post<StaffLeave>(endpoints.hr.leaveApplication, body)
      .then((r) => r.data as StaffLeave),
  uploadAttendance: (body: StaffAttendancePayload[]) =>
    api
      .post<unknown[]>(endpoints.hr.attendanceBulk, body)
      .then((r) => r.data ?? []),
  myAttendance: (filters: StaffAttendanceFilters) =>
    api
      .get<StaffAttendanceRecord[]>(endpoints.hr.myAttendance, { params: filters })
      .then((r) => r.data ?? []),
  attendanceReport: (filters: StaffAttendanceFilters) => {
    const params: Record<string, string | number> = {};
    if (filters.staffId != null) params.staffId = filters.staffId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return api
      .get<StaffAttendanceRecord[]>(endpoints.hr.attendanceReport, { params })
      .then((r) => r.data ?? []);
  },
  processPayroll: (month: string) =>
    api.post<null>(endpoints.hr.processPayroll(month)).then((r) => r.data),
  leaves: () =>
    api.get<StaffLeave[]>(endpoints.hr.leaves).then((r) => r.data ?? []),
  reviewLeave: ({ id, action, comment }: LeaveReviewPayload) =>
    api
      .patch<StaffLeave>(endpoints.hr.leaveReview(id), comment || undefined, {
        params: { action },
      })
      .then((r) => r.data as StaffLeave),
  payroll: () =>
    api.get<PayrollRecord[]>(endpoints.hr.payroll).then((r) => r.data ?? []),
  salarySettings: (body: SalarySettingPayload) =>
    api.post<unknown>(endpoints.hr.salarySettings, body).then((r) => r.data),
  myPayroll: () =>
    api.get<PayrollRecord[]>(endpoints.hr.myPayroll).then((r) => r.data ?? []),
};
