import type { Staff } from "@/features/staff/types/staff.types";

export interface StaffAppraisal {
  id: number;
  staff?: Pick<Staff, "id" | "firstName" | "lastName"> | null;
  period?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  noteSummary?: string | null;
  attachmentUrl?: string | null;
  addedBy?: string | null;
}

export interface StaffLeave {
  id: number;
  staff?: Pick<Staff, "id" | "firstName" | "lastName" | "staffNumber" | "supervisor"> | null;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  supervisorComment?: string | null;
  hrComment?: string | null;
}

export interface StaffAttendanceRecord {
  id: number;
  staff?: Pick<Staff, "id" | "firstName" | "secondName" | "lastName" | "staffNumber" | "department"> | null;
  attendanceDate: string;
  timeIn?: string | null;
  timeOut?: string | null;
}

export interface StaffAttendanceFilters {
  startDate?: string;
  endDate?: string;
  staffId?: number;
}

export interface LeaveReviewPayload {
  id: number;
  action: "APPROVED" | "REJECTED";
  comment?: string;
}

export interface LeaveApplicationPayload {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface StaffAttendancePayload {
  staff: { id: number };
  attendanceDate: string;
  timeIn?: string;
  timeOut?: string;
}

/** `GET/POST /api/hr/setup/allowances` and `/deductions`. */
export interface PayRule {
  id: number;
  staff?: { id: number; firstName?: string | null; lastName?: string | null } | null;
  name?: string | null;
  value?: number | string | null;
  isGlobal?: boolean | null;
  global?: boolean | null;
  isPercentage?: boolean | null;
  percentage?: boolean | null;
}

export interface PayRulePayload {
  staff: { id: number };
  name: string;
  value: number;
  isGlobal: boolean;
  global: boolean;
  isPercentage: boolean;
  percentage: boolean;
}

export interface PayrollSummary {
  payPeriod?: string | null;
  totalStaffProcessed?: number | null;
  grandTotalGross?: number | string | null;
  grandTotalDeductions?: number | string | null;
  grandTotalNet?: number | string | null;
  netByDepartment?: Record<string, number | string> | null;
  netByCampus?: Record<string, number | string> | null;
  payrolls?: PayrollRecord[] | null;
}

export interface PayrollRecord {
  id: number;
  staff?: Pick<
    Staff,
    "id" | "firstName" | "lastName" | "staffNumber" | "department"
  > | null;
  payPeriod?: string | null;
  paymentDate?: string | null;
  basicSalary?: number | string | null;
  allowances?: number | string | null;
  grossSalary?: number | string | null;
  totalDeductions?: number | string | null;
  netSalary?: number | string | null;
  itemizedAllowancesSummary?: string | null;
  itemizedDeductionsSummary?: string | null;
  paymentReference?: string | null;
  receiptProofUrl?: string | null;
  paidAt?: string | null;
  status?: string | null;
}

/** The pay run loads this row with `findById(staffId)`, so `id` is the staff id. */
export interface SalarySettingPayload {
  id: number;
  staff: { id: number };
  basicSalary: number;
}

export function payrollStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "PROCESSED":
      return "Processed";
    case "PAID":
      return "Paid";
    case "DRAFT":
      return "Draft";
    case "SUBMITTED_TO_FINANCE":
      return "With finance";
    case "REJECTED":
      return "Rejected";
    default:
      return status?.trim() || "Unknown";
  }
}

export function payrollBadgeVariant(status: string | null | undefined) {
  switch (status) {
    case "PAID":
      return "success" as const;
    case "PROCESSED":
    case "SUBMITTED_TO_FINANCE":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export function payRuleIsGlobal(rule: PayRule): boolean {
  return Boolean(rule.isGlobal ?? rule.global);
}

export function payRuleIsPercentage(rule: PayRule): boolean {
  return Boolean(rule.isPercentage ?? rule.percentage);
}

export function leaveBadgeVariant(status: string | null | undefined) {
  switch (status) {
    case "APPROVED":
    case "APPROVED_BY_SUPERVISOR":
      return "success" as const;
    case "REJECTED":
      return "destructive" as const;
    case "PENDING":
    case "PENDING_SUPERVISOR":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export function leaveStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "PENDING_SUPERVISOR":
      return "Pending supervisor review";
    case "APPROVED_BY_SUPERVISOR":
      return "Supervisor approved";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return status?.trim() || "Unknown";
  }
}

export function staffDisplayName(
  staff: { id?: number; firstName?: string | null; lastName?: string | null } | null | undefined
): string {
  const name = [staff?.firstName, staff?.lastName].filter(Boolean).join(" ");
  return name || (staff?.id ? `Staff #${staff.id}` : "Unknown staff");
}
