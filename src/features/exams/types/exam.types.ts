import type { AcademicStream, AcademicTerm, LearningArea, SchoolClass } from '@/features/academic/types/academic.types'
import type { Learner } from '@/features/learners/types/learner.types'

export interface ExamType {
  id: number
  name: string
  includedInFinal?: boolean
  isIncludedInFinal?: boolean
}

export interface ExamTypeWritePayload {
  name: string
  includedInFinal: boolean
  isIncludedInFinal: boolean
}

export function examTypeIncludedInFinal(row: ExamType): boolean {
  return row.includedInFinal === true || row.isIncludedInFinal === true
}

export interface GradingScale {
  id: number
  name?: string | null
  descriptiveLevel?: string | null
  points?: number | null
  minMark?: number | null
  maxMark?: number | null
}

export interface GradingScaleWritePayload {
  name: string
  descriptiveLevel: string
  points: number
  minMark: number
  maxMark: number
}

export interface ExamSubjectConfig {
  id: number
  schoolClass?: SchoolClass | null
  subject?: Pick<LearningArea, 'id' | 'name'> | null
  totalMarks?: number | null
  contributesToTotal?: boolean
  isContributesToTotal?: boolean
}

export interface ExamSubjectConfigWritePayload {
  schoolClass: { id: number }
  subject: { id: number }
  totalMarks: number
  contributesToTotal: boolean
  isContributesToTotal: boolean
}

export function configContributesToTotal(row: ExamSubjectConfig): boolean {
  return row.contributesToTotal === true || row.isContributesToTotal === true
}

export interface ExamRecord {
  id: number
  learner?: Pick<Learner, 'id' | 'firstName' | 'middleName' | 'lastName' | 'admissionNumber'> | null
  examType?: ExamType | null
  subject?: Pick<LearningArea, 'id' | 'name'> | null
  term?: AcademicTerm | null
  schoolClass?: SchoolClass | null
  stream?: AcademicStream | null
  marksScored?: number | null
  outOf?: number | null
  dateRecorded?: string | null
  recordedBy?: string | null
}

export interface ExamMarkPayload {
  learner: { id: number }
  examType: { id: number }
  subject: { id: number }
  term: { id: number }
  schoolClass: { id: number }
  stream?: { id: number }
  marksScored: number
  outOf: number
}

export interface ExamAnalysis {
  pathway: string
  track: string
  results: ExamRecord[]
}

export type PathwayDistribution = Record<string, number>

export function markPercent(row: Pick<ExamRecord, 'marksScored' | 'outOf'>): number | null {
  const scored = row.marksScored
  const outOf = row.outOf
  if (scored == null || outOf == null || outOf === 0) return null
  return (scored / outOf) * 100
}

export function gradeForMark(percent: number | null, scales: GradingScale[]): GradingScale | null {
  if (percent == null) return null
  return (
    scales.find((scale) => {
      const min = scale.minMark ?? Number.NEGATIVE_INFINITY
      const max = scale.maxMark ?? Number.POSITIVE_INFINITY
      return percent >= min && percent <= max
    }) ?? null
  )
}
