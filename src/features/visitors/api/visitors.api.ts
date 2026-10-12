import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { NamedLookup } from '@/features/lookups/lookups.types'
import type { Campus, Department } from '@/features/lookups/lookups.types'
import type { Learner } from '@/features/learners/types/learner.types'
import type { Staff } from '@/features/staff/types/staff.types'

export interface VisitorNamedLookup {
  id: number
  name: string
}

export interface Visitor {
  id: number
  fullName: string
  phoneNumber: string | null
  nationalId: string | null
  emailAddress: string | null
  numberPlate: string | null
  title: NamedLookup | null
  titleName: string | null
  gender: NamedLookup | null
  genderName: string | null
  category: VisitorNamedLookup | null
  categoryName: string | null
  purpose: VisitorNamedLookup | null
  purposeName: string | null
  campus: Campus | null
  campusName: string | null
  staffToVisit: Pick<Staff, 'id' | 'firstName' | 'lastName'> | null
  staffName: string | null
  learnerToVisit: Pick<Learner, 'id' | 'firstName' | 'lastName'> | null
  learnerName: string | null
  department: Department | null
  departmentName: string | null
  checkInTime: string | null
  checkOutTime: string | null
  status: string | null
  stayDuration: string | null
  comments: string | null
}

export interface VisitorCheckInPayload {
  fullName: string
  phoneNumber?: string
  nationalId?: string
  emailAddress?: string
  numberPlate?: string
  title?: { id: number }
  gender?: { id: number }
  category?: { id: number }
  purpose?: { id: number }
  campus?: { id: number }
  staffToVisit?: { id: number }
  learnerToVisit?: { id: number }
  department?: { id: number }
  comments?: string
}

/** Spring Data `Page` JSON. `number` is zero-based. */
export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface VisitorAnalyticsSummary {
  windowStart?: string
  windowEnd?: string
  totalVisits?: number
  uniqueVisitors?: number
  onPremisesNow?: number
  visitsByCampus?: Record<string, number>
  visitsByDepartment?: Record<string, number>
  topVisitedStaff?: Record<string, number>
}

export interface VisitorAnalytics {
  summary: VisitorAnalyticsSummary
  visitors: SpringPage<Visitor>
}

export interface VisitorAnalyticsQuery {
  day?: string
  startDate?: string
  endDate?: string
  month?: string
  campusId?: number
  departmentId?: number
  staffId?: number
  status?: string
  page: number
  size: number
}

export interface StaffVisitorNotification {
  id: number
  title: string | null
  message: string | null
  type: string | null
  /** Lombok `boolean isRead` may serialize as either property. */
  isRead?: boolean
  read?: boolean
  createdAt: string | null
}

export function toAnalyticsParams(query: VisitorAnalyticsQuery): Record<string, string | number> {
  const params: Record<string, string | number> = { page: query.page, size: query.size }
  if (query.day) params.day = query.day
  if (query.startDate) params.startDate = query.startDate
  if (query.endDate) params.endDate = query.endDate
  if (query.month) params.month = query.month
  if (query.campusId != null) params.campusId = query.campusId
  if (query.departmentId != null) params.departmentId = query.departmentId
  if (query.staffId != null) params.staffId = query.staffId
  if (query.status) params.status = query.status
  return params
}

export function notificationIsRead(row: StaffVisitorNotification): boolean {
  return row.isRead === true || row.read === true
}

const emptyPage = <T,>(): SpringPage<T> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 0,
})

export const visitorsApi = {
  analytics: (query: VisitorAnalyticsQuery) =>
    api
      .get<VisitorAnalytics>(endpoints.visitors.analytics, { params: toAnalyticsParams(query) })
      .then((r) => r.data ?? { summary: {}, visitors: emptyPage<Visitor>() }),
  myVisitors: (page: number, size: number) =>
    api
      .get<SpringPage<Visitor>>(endpoints.visitors.myVisitors, { params: { page, size } })
      .then((r) => r.data ?? emptyPage<Visitor>()),
  myNotifications: (page: number, size: number) =>
    api
      .get<SpringPage<StaffVisitorNotification>>(endpoints.visitors.myNotifications, {
        params: { page, size },
      })
      .then((r) => r.data ?? emptyPage<StaffVisitorNotification>()),
  checkIn: (body: VisitorCheckInPayload) =>
    api.post<Visitor>(endpoints.visitors.checkIn, body).then((r) => r.data as Visitor),
  checkOut: (id: number) => api.patch<Visitor>(endpoints.visitors.checkOut(id)).then((r) => r.data as Visitor),
  remove: (id: number) => api.delete(endpoints.visitors.byId(id)).then(() => undefined),
  listCategories: () => api.getList<VisitorNamedLookup>(endpoints.visitors.categories),
  createCategory: (body: { name: string }) =>
    api.post<VisitorNamedLookup>(endpoints.visitors.categories, body).then((r) => r.data as VisitorNamedLookup),
  listPurposes: () => api.getList<VisitorNamedLookup>(endpoints.visitors.purposes),
  createPurpose: (body: { name: string }) =>
    api.post<VisitorNamedLookup>(endpoints.visitors.purposes, body).then((r) => r.data as VisitorNamedLookup),
}
