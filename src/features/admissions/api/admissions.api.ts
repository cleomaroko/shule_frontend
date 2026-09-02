import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'

export interface LearnerLead {
  id: number
  campus: string | null
  academicYear: string | null
  term: string | null
  studentFirstName: string | null
  studentMiddleName: string | null
  studentSurname: string | null
  studentDob: string | null
  classApplied: string | null
  source: string | null
  parentFirstName: string | null
  parentSurname: string | null
  parentPhone: string | null
  parentEmail: string | null
  relationship: string | null
  comment: string | null
  submissionDate: string | null
  processed: boolean
}

export const admissionsApi = {
  listPending: () => api.get<LearnerLead[]>(endpoints.admissions.list).then((r) => r.data ?? []),
  markProcessed: (id: number) => api.patch(endpoints.admissions.process(id)).then(() => undefined),
}
