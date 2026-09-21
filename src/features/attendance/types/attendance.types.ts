import type { AcademicStream, AcademicTerm, AcademicYear, LearningArea, SchoolClass } from '@/features/academic/types/academic.types'
import type { Learner } from '@/features/learners/types/learner.types'

export interface AttendanceNamedLookup {
  id: number
  name: string
}

export interface AttendanceRecord {
  id: number
  learner: Pick<Learner, 'id' | 'firstName' | 'middleName' | 'lastName' | 'admissionNumber'> | null
  academicYear?: AcademicYear | null
  term?: AcademicTerm | null
  schoolClass?: SchoolClass | null
  stream?: AcademicStream | null
  session?: AttendanceNamedLookup | null
  unit?: Pick<LearningArea, 'id' | 'name'> | null
  activity?: AttendanceNamedLookup | null
  campusId?: number | null
  attendanceDate?: string | null
  recordedAt?: string | null
  present?: boolean
  recordedBy?: string | null
}

export interface AttendanceMarkPayload {
  id?: number
  learner: { id: number }
  schoolClass: { id: number }
  stream?: { id: number }
  session: { id: number }
  attendanceDate: string
  present: boolean
  activity?: { id: number }
  unit?: { id: number }
  campusId?: number
}

export interface AttendanceReportQuery {
  learnerId?: number
  classId?: number
  streamId?: number
  date?: string
}

export function isPresent(row: Pick<AttendanceRecord, 'present'>): boolean {
  return row.present === true
}
