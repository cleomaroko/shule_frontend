import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  ExamAnalysis,
  ExamMarkPayload,
  ExamRecord,
  ExamSubjectConfig,
  ExamSubjectConfigWritePayload,
  ExamType,
  ExamTypeWritePayload,
  GradingScale,
  GradingScaleWritePayload,
  PathwayDistribution,
} from '@/features/exams/types/exam.types'

export const examsApi = {
  listTypes: () => api.get<ExamType[]>(endpoints.exams.types).then((r) => r.data ?? []),
  createType: (body: ExamTypeWritePayload) =>
    api.post<ExamType>(endpoints.exams.types, body).then((r) => r.data as ExamType),
  updateType: (id: number, body: ExamTypeWritePayload) =>
    api.put<ExamType>(endpoints.exams.typeById(id), body).then((r) => r.data as ExamType),
  deleteType: (id: number) => api.delete(endpoints.exams.typeById(id)).then(() => undefined),

  listGrading: () => api.get<GradingScale[]>(endpoints.exams.grading).then((r) => r.data ?? []),
  createGrading: (body: GradingScaleWritePayload) =>
    api.post<GradingScale>(endpoints.exams.grading, body).then((r) => r.data as GradingScale),

  listConfig: (classId: number) =>
    api.get<ExamSubjectConfig[]>(endpoints.exams.configByClass(classId)).then((r) => r.data ?? []),
  saveConfig: (body: ExamSubjectConfigWritePayload) =>
    api.post<ExamSubjectConfig>(endpoints.exams.config, body).then((r) => r.data as ExamSubjectConfig),

  addMark: (body: ExamMarkPayload) =>
    api.post<ExamRecord>(endpoints.exams.marks, body).then((r) => r.data as ExamRecord),
  addMarksBatch: (body: ExamMarkPayload[]) =>
    api.post<ExamRecord[]>(endpoints.exams.marksBatch, body).then((r) => r.data ?? []),

  analysis: (learnerId: number, termId: number) =>
    api
      .get<ExamAnalysis>(endpoints.exams.analysis, { params: { learnerId, termId } })
      .then((r) => r.data as ExamAnalysis),

  pathwayDistribution: (classId: number, termId: number) =>
    api
      .get<PathwayDistribution>(endpoints.exams.pathwayDistribution, { params: { classId, termId } })
      .then((r) => r.data ?? {}),
}
