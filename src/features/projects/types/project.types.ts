import type { Department } from '@/features/lookups/lookups.types'

export const PROJECT_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

/** `com.lyrt.shule.project.Project` */
export interface Project {
  id: number
  name?: string | null
  description?: string | null
  department?: Pick<Department, 'id' | 'name'> | null
  requisition?: {
    id: number
    requisitionNumber?: string | null
    approvedAmount?: number | null
    status?: string | null
  } | null
  startDate?: string | null
  deadline?: string | null
  status?: string | null
  totalBudget?: number | null
}

/**
 * POST `/api/projects`. `requisitionId` is optional.
 * Status changes use PATCH `/api/projects/{id}/status`, not this body.
 */
export interface ProjectWritePayload {
  name: string
  description?: string
  department?: { id: number }
  requisitionId?: number | null
  startDate?: string
  deadline?: string
  status: ProjectStatus
  totalBudget: number
}

/** `com.lyrt.shule.project.ProjectExpense` */
export interface ProjectExpense {
  id: number
  project?: Pick<Project, 'id' | 'name'> | null
  amount?: number | null
  description?: string | null
  expenseDate?: string | null
  receiptLink?: string | null
}

export interface ProjectExpensePayload {
  projectId: number
  amount: number
  description: string
  expenseDate?: string
  receiptLink?: string
}

export interface ProjectExpenseItem {
  id: number
  amount?: number | null
  description?: string | null
  date?: string | null
  receiptLink?: string | null
}

/** GET `/api/projects/{id}/finances` map */
export interface ProjectFinances {
  projectName?: string | null
  department?: string | null
  status?: string | null
  budget?: number | null
  spent?: number | null
  remaining?: number | null
  burnRatePercent?: number | null
  linkedRequisition?: { id?: number; number?: string | null; approvedAmount?: number | null } | null
  expensesCount?: number | null
  expenses?: ProjectExpenseItem[] | null
}

export interface ProjectVarianceRow {
  item?: string | null
  requested_cost?: number | null
  actual_cost?: number | null
  difference?: number | null
  percentage?: number | null
  flag?: string | null
}

/** GET `/api/projects/{id}/audit` */
export interface ProjectAudit {
  project_name?: string | null
  total_budget?: number | null
  baseline_funds?: number | null
  total_spent?: number | null
  remaining_balance?: number | null
  burn_rate_percent?: number | null
  financial_status?: string | null
  warnings?: string[] | null
  recommendations?: string[] | null
  item_by_item_variance?: ProjectVarianceRow[] | null
}

export function projectStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'PLANNED':
      return 'Planned'
    case 'IN_PROGRESS':
      return 'In progress'
    case 'COMPLETED':
      return 'Completed'
    case 'ON_HOLD':
      return 'On hold'
    default:
      return status?.trim() || '—'
  }
}

export function projectStatusBadge(status: string | null | undefined) {
  switch (status) {
    case 'COMPLETED':
      return 'success' as const
    case 'IN_PROGRESS':
      return 'primary' as const
    case 'ON_HOLD':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}
