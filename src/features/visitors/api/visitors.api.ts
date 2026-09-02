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

export const visitorsApi = {
  list: () => api.get<Visitor[]>(endpoints.visitors.list).then((r) => r.data ?? []),
  checkIn: (body: VisitorCheckInPayload) =>
    api.post<Visitor>(endpoints.visitors.list, body).then((r) => r.data as Visitor),
  checkOut: (id: number) => api.patch<Visitor>(endpoints.visitors.checkOut(id)).then((r) => r.data as Visitor),
  remove: (id: number) => api.delete(endpoints.visitors.byId(id)).then(() => undefined),
  listCategories: () => api.getList<VisitorNamedLookup>(endpoints.visitors.categories),
  createCategory: (body: { name: string }) =>
    api.post<VisitorNamedLookup>(endpoints.visitors.categories, body).then((r) => r.data as VisitorNamedLookup),
  listPurposes: () => api.getList<VisitorNamedLookup>(endpoints.visitors.purposes),
  createPurpose: (body: { name: string }) =>
    api.post<VisitorNamedLookup>(endpoints.visitors.purposes, body).then((r) => r.data as VisitorNamedLookup),
}
