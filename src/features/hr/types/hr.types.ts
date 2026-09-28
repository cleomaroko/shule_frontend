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
  staff?: Pick<Staff, "id" | "firstName" | "lastName" | "staffNumber"> | null;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
}

export interface LeaveApplicationPayload {
  startDate: string;
  endDate: string;
  reason: string;
}

export type StaffAttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export interface StaffAttendancePayload {
  staff: { id: number };
  attendanceDate: string;
  status: StaffAttendanceStatus;
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
  nhif?: number | string | null;
  nssf?: number | string | null;
  paye?: number | string | null;
  helb?: number | string | null;
  totalDeductions?: number | string | null;
  netSalary?: number | string | null;
  status?: string | null;
}

export interface SalarySettingPayload {
  staff: { id: number };
  basicSalary: number;
  houseAllowance: number;
  transportAllowance: number;
  helbAmount: number;
  saccoContribution: number;
  isNssfEnabled: boolean;
  isNhifEnabled: boolean;
}

export function payrollStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "PROCESSED":
      return "Processed";
    case "PAID":
      return "Paid";
    case "DRAFT":
      return "Draft";
    default:
      return status?.trim() || "Unknown";
  }
}

export function payrollBadgeVariant(status: string | null | undefined) {
  switch (status) {
    case "PAID":
      return "success" as const;
    case "PROCESSED":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export function leaveBadgeVariant(status: string | null | undefined) {
  switch (status) {
    case "APPROVED":
      return "success" as const;
    case "REJECTED":
      return "destructive" as const;
    case "PENDING":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export function staffDisplayName(
  staff: StaffLeave["staff"] | PayrollRecord["staff"]
): string {
  const name = [staff?.firstName, staff?.lastName].filter(Boolean).join(" ");
  return name || (staff?.id ? `Staff #${staff.id}` : "Unknown staff");
}
