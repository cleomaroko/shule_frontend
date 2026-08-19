import type { Staff } from '@/features/staff/types/staff.types'

export interface AcademicStream {
  id: number
  name: string
}

export interface SchoolClass {
  id: number
  section: string | null
  className: string | null
  streams?: AcademicStream[] | null
}

export interface LearningArea {
  id: number
  name: string
  shortName: string | null
  knecCode: string | null
  subjectGroup: string | null
  status: string | null
}

export interface LearningAreaWritePayload {
  name: string
  shortName: string
  knecCode: string
  subjectGroup: string
  status: string
}

/** Nested teacher on an assignment. Password must never be rendered. */
export type AssignmentTeacher = Pick<
  Staff,
  'id' | 'firstName' | 'secondName' | 'lastName' | 'staffNumber' | 'workEmail'
>

export interface TeacherAssignment {
  id: number
  teacher: AssignmentTeacher | null
  schoolClass: SchoolClass | null
  stream: AcademicStream | null
  subject: LearningArea | null
  /** Jackson may emit either name for Lombok `boolean isClassTeacher`. */
  classTeacher?: boolean
  isClassTeacher?: boolean
}

export interface AssignmentWritePayload {
  teacher: { id: number }
  schoolClass: { id: number }
  stream: { id: number } | null
  subject: { id: number }
  classTeacher: boolean
  isClassTeacher: boolean
}

export function assignmentIsClassTeacher(row: TeacherAssignment): boolean {
  return row.classTeacher === true || row.isClassTeacher === true
}

export const SUBJECT_GROUPS = ['Default', 'Group I', 'Group II', 'Group III', 'Group IV', 'Group V'] as const

export const SUBJECT_STATUSES = ['ACTIVE', 'INACTIVE'] as const
