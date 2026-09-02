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
  stream?: { id: number }
  subject?: { id: number }
  classTeacher: boolean
  isClassTeacher: boolean
}

export function assignmentIsClassTeacher(row: TeacherAssignment): boolean {
  return row.classTeacher === true || row.isClassTeacher === true
}

export const SUBJECT_GROUPS = ['Default', 'Group I', 'Group II', 'Group III', 'Group IV', 'Group V'] as const

export const SUBJECT_STATUSES = ['ACTIVE', 'INACTIVE'] as const

export interface AcademicYear {
  id: number
  name: string
  /** Jackson may emit `current` for Lombok `boolean isCurrent`. */
  current?: boolean
  isCurrent?: boolean
}

export interface AcademicYearWritePayload {
  name: string
  current: boolean
  isCurrent: boolean
}

export interface AcademicTerm {
  id: number
  name: string
  startDate?: string | null
  endDate?: string | null
  current?: boolean
  isCurrent?: boolean
  academicYear?: AcademicYear | null
}

export interface AcademicTermWritePayload {
  name: string
  startDate?: string
  endDate?: string
  current: boolean
  isCurrent: boolean
  academicYear?: { id: number }
}

export function calendarIsCurrent(row: { current?: boolean; isCurrent?: boolean }): boolean {
  return row.current === true || row.isCurrent === true
}

function todayIso(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** True when today falls on the term’s start/end dates (inclusive). */
export function termContainsDate(term: AcademicTerm, today = todayIso()): boolean {
  const start = term.startDate?.trim()
  const end = term.endDate?.trim()
  if (!start || !end) return false
  return start <= today && today <= end
}

export function resolveCurrentTerm(terms: AcademicTerm[]): AcademicTerm | null {
  return terms.find(calendarIsCurrent) ?? terms.find((term) => termContainsDate(term)) ?? null
}

export function resolveCurrentAcademicYear(
  years: AcademicYear[],
  currentTerm?: AcademicTerm | null,
): AcademicYear | null {
  const flagged = years.find(calendarIsCurrent)
  if (flagged) return flagged
  const fromTerm = currentTerm?.academicYear
  if (fromTerm?.id) {
    return years.find((year) => year.id === fromTerm.id) ?? fromTerm
  }
  if (years.length === 1) return years[0] ?? null
  return null
}

/** Display-only: `2027` → `2027/2028`. Names already containing a range are left as-is. */
export function formatAcademicYearDisplay(name: string | null | undefined): string | null {
  const trimmed = name?.trim()
  if (!trimmed) return null
  if (/^\d{4}$/.test(trimmed)) {
    const year = Number(trimmed)
    return `${year}/${year + 1}`
  }
  return trimmed
}

export function academicTermLabel(term: AcademicTerm): string {
  const name = term.name?.trim()
  const year = term.academicYear?.name?.trim()
  if (name && year) return `${name} · ${year}`
  if (name) return name
  return `Term ${term.id}`
}
