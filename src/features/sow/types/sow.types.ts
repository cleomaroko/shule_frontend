import type { AcademicTerm, AcademicYear, LearningArea, SchoolClass } from '@/features/academic/types/academic.types'
import type { Campus } from '@/features/lookups/lookups.types'
import type { Staff } from '@/features/staff/types/staff.types'

export interface SchemeOfWork {
  id: number
  teacher: Pick<Staff, 'id' | 'firstName' | 'secondName' | 'lastName' | 'staffNumber'> | null
  campus: Pick<Campus, 'id' | 'name'> | null
  schoolClass: SchoolClass | null
  subject: Pick<LearningArea, 'id' | 'name'> | null
  academicYear: AcademicYear | null
  term: AcademicTerm | null
  documentLink: string
  remarks?: string | null
  dateUploaded?: string | null
}

export interface SchemeOfWorkPayload {
  teacher: { id: number }
  campus: { id: number }
  schoolClass: { id: number }
  subject: { id: number }
  academicYear: { id: number }
  term: { id: number }
  documentLink: string
  remarks?: string
}

export type SowFilterDimension = 'teacherId' | 'classId' | 'termId' | 'campusId' | 'subjectId'

export interface SowReportQuery {
  teacherId?: number
  classId?: number
  termId?: number
  campusId?: number
  subjectId?: number
}

/** Controller uses the first non-null of teacher → class → term → campus → subject. */
export const SOW_FILTER_ORDER: SowFilterDimension[] = [
  'teacherId',
  'classId',
  'termId',
  'campusId',
  'subjectId',
]
