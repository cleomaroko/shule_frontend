import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { toUserMessage } from "@/api/errors";
import { queryKeys } from "@/api/endpoints";
import { hrApi } from "@/features/hr/api/hr.api";
import type {
  LeaveApplicationPayload,
  LeaveReviewPayload,
  PayRulePayload,
  SalarySettingPayload,
  StaffAttendanceFilters,
  StaffAttendancePayload,
} from "@/features/hr/types/hr.types";
import { logger } from "@/lib/logger";

export function useMyAppraisals(enabled = true) {
  return useQuery({
    queryKey: queryKeys.hr.myAppraisals,
    queryFn: hrApi.myAppraisals,
    enabled,
  });
}

export function useMyPayroll(enabled = true) {
  return useQuery({
    queryKey: queryKeys.hr.myPayroll,
    queryFn: hrApi.myPayroll,
    enabled,
  });
}

export function useHrLeaves(enabled = true) {
  return useQuery({ queryKey: queryKeys.hr.leaves, queryFn: hrApi.leaves, enabled });
}

export function useMyAttendance(filters: StaffAttendanceFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.hr.myAttendance(filters),
    queryFn: () => hrApi.myAttendance(filters),
    enabled,
  });
}

export function useStaffAttendanceReport(filters: StaffAttendanceFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.hr.attendanceReport(filters),
    queryFn: () => hrApi.attendanceReport(filters),
    enabled,
  });
}

export function useHrPayroll(enabled = true) {
  return useQuery({
    queryKey: queryKeys.hr.payroll,
    queryFn: hrApi.payroll,
    enabled,
  });
}

export function usePayrollSummary(month: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.hr.payrollSummary(month),
    queryFn: () => hrApi.payrollSummary(month),
    enabled: enabled && month.length > 0,
  });
}

export function useAllowances(enabled = true) {
  return useQuery({
    queryKey: queryKeys.hr.allowances,
    queryFn: hrApi.allowances,
    enabled,
  });
}

export function useDeductions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.hr.deductions,
    queryFn: hrApi.deductions,
    enabled,
  });
}

export function useHrMutations() {
  const queryClient = useQueryClient();
  const invalidateLeaves = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.hr.leaves });
  const invalidatePayroll = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.hr.payroll });

  const applyLeave = useMutation({
    mutationFn: (body: LeaveApplicationPayload) => hrApi.applyLeave(body),
    onSuccess: () => toast.success("Leave application submitted."),
    onError: (error: unknown) => {
      logger.error("Leave application failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const uploadAttendance = useMutation({
    mutationFn: (body: StaffAttendancePayload[]) =>
      hrApi.uploadAttendance(body),
    onSuccess: () => toast.success("Staff attendance recorded."),
    onError: (error: unknown) => {
      logger.error("Staff attendance upload failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const processPayroll = useMutation({
    mutationFn: (month: string) => hrApi.processPayroll(month),
    onSuccess: async () => {
      await invalidatePayroll();
      toast.success("Payroll processing completed.");
    },
    onError: (error: unknown) => {
      logger.error("Payroll processing failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const reviewLeave = useMutation({
    mutationFn: (body: LeaveReviewPayload) => hrApi.reviewLeave(body),
    onSuccess: async (_saved, variables) => {
      await invalidateLeaves();
      toast.success(`Leave request ${variables.action.toLowerCase()}.`);
    },
    onError: (error: unknown) => {
      logger.error("Leave decision failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const saveSalary = useMutation({
    mutationFn: (body: SalarySettingPayload) => hrApi.salarySettings(body),
    onSuccess: () => toast.success("Basic salary saved."),
    onError: (error: unknown) => {
      logger.error("Salary settings save failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const draftPayroll = useMutation({
    mutationFn: (month: string) => hrApi.draftPayroll(month),
    onSuccess: async (result) => {
      await Promise.all([
        invalidatePayroll(),
        queryClient.invalidateQueries({ queryKey: ["hr", "payroll-summary"] }),
      ]);
      toast.success(`Draft ready for ${result?.staffProcessed ?? 0} staff.`);
    },
    onError: (error: unknown) => {
      logger.error("Payroll draft failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const submitPayroll = useMutation({
    mutationFn: (month: string) => hrApi.submitPayroll(month),
    onSuccess: async () => {
      await Promise.all([
        invalidatePayroll(),
        queryClient.invalidateQueries({ queryKey: ["hr", "payroll-summary"] }),
      ]);
      toast.success("Payroll sent to finance.");
    },
    onError: (error: unknown) => {
      logger.error("Payroll submit failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const markPayrollPaid = useMutation({
    mutationFn: ({ id, reference, receiptUrl }: { id: number; reference: string; receiptUrl?: string }) =>
      hrApi.markPayrollPaid(id, reference, receiptUrl),
    onSuccess: async () => {
      await Promise.all([
        invalidatePayroll(),
        queryClient.invalidateQueries({ queryKey: queryKeys.hr.myPayroll }),
        queryClient.invalidateQueries({ queryKey: ["hr", "payroll-summary"] }),
      ]);
      toast.success("Salary marked as paid.");
    },
    onError: (error: unknown) => {
      logger.error("Mark payroll paid failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const saveAllowance = useMutation({
    mutationFn: ({ id, body }: { id?: number; body: PayRulePayload }) =>
      id ? hrApi.updateAllowance(id, body) : hrApi.saveAllowance(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.allowances });
      toast.success("Allowance saved.");
    },
    onError: (error: unknown) => {
      logger.error("Allowance save failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const deleteAllowance = useMutation({
    mutationFn: (id: number) => hrApi.deleteAllowance(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.allowances });
      toast.success("Allowance removed.");
    },
    onError: (error: unknown) => {
      logger.error("Allowance delete failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const saveDeduction = useMutation({
    mutationFn: ({ id, body }: { id?: number; body: PayRulePayload }) =>
      id ? hrApi.updateDeduction(id, body) : hrApi.saveDeduction(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.deductions });
      toast.success("Deduction saved.");
    },
    onError: (error: unknown) => {
      logger.error("Deduction save failed", error);
      toast.error(toUserMessage(error));
    },
  });

  const deleteDeduction = useMutation({
    mutationFn: (id: number) => hrApi.deleteDeduction(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.deductions });
      toast.success("Deduction removed.");
    },
    onError: (error: unknown) => {
      logger.error("Deduction delete failed", error);
      toast.error(toUserMessage(error));
    },
  });

  return {
    applyLeave,
    uploadAttendance,
    reviewLeave,
    processPayroll,
    saveSalary,
    draftPayroll,
    submitPayroll,
    markPayrollPaid,
    saveAllowance,
    deleteAllowance,
    saveDeduction,
    deleteDeduction,
  };
}
