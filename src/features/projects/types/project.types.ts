import type { Department } from '@/features/lookups/lookups.types'

export const PROJECT_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

/** `com.lyrt.shule.project.Project` */
export interface Project {
  id: number
  name?: string | null
  description?: string | null
  department?: Pick<Department, 'id' | 'name'> | null
  startDate?: string | null
  deadline?: string | null
  status?: string | null
  totalBudget?: number | null
}

/** POST `/api/projects` raw body. */
export interface ProjectWritePayload {
  name: string
  description?: string
  department?: { id: number }
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
  project: { id: number }
  amount: number
  description: string
  expenseDate?: string
  receiptLink?: string
}

/** GET `/api/projects/{id}/finances` map */
export interface ProjectFinances {
  projectName?: string | null
  budget?: number | null
  spent?: number | null
  remaining?: number | null
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
