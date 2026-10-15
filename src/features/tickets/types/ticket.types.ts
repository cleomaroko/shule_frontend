import type { Department } from '@/features/lookups/lookups.types'

export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

/** `com.lyrt.shule.ticketing.Ticket` */
export interface Ticket {
  id: number
  title?: string | null
  description?: string | null
  priority?: string | null
  status?: string | null
  createdBy?: string | null
  targetDepartment?: Pick<Department, 'id' | 'name'> | null
  createdAt?: string | null
  updatedAt?: string | null
}

/** POST `/api/tickets` — controller sets createdBy from JWT and status OPEN. */
export interface CreateTicketPayload {
  title: string
  description: string
  priority: TicketPriority
  targetDepartment: { id: number }
}

export function ticketPriorityLabel(priority: string | null | undefined): string {
  switch (priority) {
    case 'LOW':
      return 'Low'
    case 'MEDIUM':
      return 'Medium'
    case 'HIGH':
      return 'High'
    default:
      return priority?.trim() || '—'
  }
}

export function ticketStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'OPEN':
      return 'Open'
    case 'IN_PROGRESS':
      return 'In progress'
    case 'RESOLVED':
      return 'Resolved'
    case 'CLOSED':
      return 'Closed'
    default:
      return status?.trim() || '—'
  }
}

export function ticketStatusBadge(status: string | null | undefined) {
  switch (status) {
    case 'RESOLVED':
      return 'success' as const
    case 'CLOSED':
      return 'neutral' as const
    case 'IN_PROGRESS':
      return 'warning' as const
    case 'OPEN':
      return 'primary' as const
    default:
      return 'neutral' as const
  }
}

/** Distinct paint for each ticket status. Badge variants alone collapse Closed with Resolved. */
export function ticketStatusClassName(status: string | null | undefined): string {
  switch (status) {
    case 'OPEN':
      return 'border-sky-500/35 bg-sky-500/15 text-sky-800 dark:text-sky-200'
    case 'IN_PROGRESS':
      return 'border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200'
    case 'RESOLVED':
      return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
    case 'CLOSED':
      return 'border-violet-500/35 bg-violet-500/15 text-violet-900 dark:text-violet-200'
    default:
      return ''
  }
}

export function ticketPriorityBadge(priority: string | null | undefined) {
  switch (priority) {
    case 'HIGH':
      return 'destructive' as const
    case 'MEDIUM':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}
