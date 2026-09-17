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
  sbaScore?: number | null
  kjseaScore?: number | null
  kpseaScore?: number | null
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
  sbaScore?: number
  kjseaScore?: number
  kpseaScore?: number
}

export interface ExamAnalysis {
  pathway?: string | null
  track?: string | null
  schoolTier?: string | null
  results?: ExamRecord[] | null
}

/** Jackson keys from ExamController.getDistribution. */
export const PATHWAY_DISTRIBUTION_KEYS = ['STEM', 'Arts', 'Social Sciences'] as const

export type PathwayDistribution = Record<string, number>

/** Subject-name keywords from ExamReportService.getClusterAverage. */
const STEM_KEYWORDS = ['math', 'science', 'technical', 'language']
const SOCIAL_KEYWORDS = ['social', 'religious', 'language', 'business']
const ARTS_KEYWORDS = ['creative', 'sport', 'science', 'language', 'math']

export function pathwayDistributionLabel(key: string): string {
  if (key === 'STEM') return 'STEM'
  if (key === 'Arts') return 'Arts and Sports'
  if (key === 'Social Sciences') return 'Social Sciences'
  return key
}

export function pathwayDistributionRows(
  data: PathwayDistribution | null | undefined,
): Array<{ label: string; count: number }> {
  const source = data ?? {}
  const seen = new Set<string>()
  const rows: Array<{ label: string; count: number }> = []
  for (const key of PATHWAY_DISTRIBUTION_KEYS) {
    seen.add(key)
    rows.push({ label: pathwayDistributionLabel(key), count: Number(source[key]) || 0 })
  }
  for (const [key, value] of Object.entries(source)) {
    if (seen.has(key)) continue
    rows.push({ label: pathwayDistributionLabel(key), count: Number(value) || 0 })
  }
  return rows
}

function clusterAverage(records: ExamRecord[], keywords: readonly string[]): number | null {
  let total = 0
  let count = 0
  for (const row of records) {
    const name = row.subject?.name?.toLowerCase() ?? ''
    if (!keywords.some((keyword) => name.includes(keyword))) continue
    const percent = markPercent(row)
    if (percent == null) continue
    total += percent
    count += 1
  }
  if (count === 0) return null
  return total / count
}

export function examClusterAverages(records: ExamRecord[]): Array<{ label: string; value: string }> {
  const format = (value: number | null) => (value == null ? '—' : `${value.toFixed(1)}%`)
  return [
    { label: 'STEM cluster', value: format(clusterAverage(records, STEM_KEYWORDS)) },
    { label: 'Arts cluster', value: format(clusterAverage(records, ARTS_KEYWORDS)) },
    { label: 'Social cluster', value: format(clusterAverage(records, SOCIAL_KEYWORDS)) },
  ]
}

export function buildExamMarkPayload(input: {
  learnerId: number
  examTypeId: number
  subjectId: number
  termId: number
  schoolClassId: number
  streamId?: number
  marksScored: number
  outOf: number
  sbaScore?: number
  kjseaScore?: number
  kpseaScore?: number
}): ExamMarkPayload {
  const body: ExamMarkPayload = {
    learner: { id: input.learnerId },
    examType: { id: input.examTypeId },
    subject: { id: input.subjectId },
    term: { id: input.termId },
    schoolClass: { id: input.schoolClassId },
    marksScored: input.marksScored,
    outOf: input.outOf,
  }
  if (input.streamId) body.stream = { id: input.streamId }
  if (input.sbaScore != null) body.sbaScore = input.sbaScore
  if (input.kjseaScore != null) body.kjseaScore = input.kjseaScore
  if (input.kpseaScore != null) body.kpseaScore = input.kpseaScore
  return body
}

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
