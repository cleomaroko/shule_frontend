import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  AcademicStream,
  AcademicTerm,
  AcademicTermWritePayload,
  AcademicYear,
  AcademicYearWritePayload,
  AssignmentWritePayload,
  LearningArea,
  LearningAreaWritePayload,
  SchoolClass,
  TeacherAssignment,
} from '@/features/academic/types/academic.types'

export const academicApi = {
  listClasses: () => api.getList<SchoolClass>(endpoints.academic.classes),
  createClass: (body: { section: string; className: string }) =>
    api.post<SchoolClass>(endpoints.academic.classes, body).then((r) => r.data),
  updateClass: (id: number, body: { section: string; className: string }) =>
    api.put<SchoolClass>(endpoints.academic.classById(id), body).then((r) => r.data),
  deleteClass: (id: number) => api.delete(endpoints.academic.classById(id)).then(() => undefined),

  listStreams: () => api.getList<AcademicStream>(endpoints.academic.streams),
  createStream: (body: { name: string }) =>
    api.post<AcademicStream>(endpoints.academic.streams, body).then((r) => r.data),
  updateStream: (id: number, body: { name: string }) =>
    api.put<AcademicStream>(endpoints.academic.streamById(id), body).then((r) => r.data),
  deleteStream: (id: number) => api.delete(endpoints.academic.streamById(id)).then(() => undefined),

  listLearningAreas: () =>
    api.get<LearningArea[]>(endpoints.subjects.list).then((r) => r.data ?? []),
  createLearningArea: (body: LearningAreaWritePayload) =>
    api.post<LearningArea>(endpoints.subjects.list, body).then((r) => r.data),
  updateLearningArea: (id: number, body: LearningAreaWritePayload) =>
    api.put<LearningArea>(endpoints.subjects.byId(id), body).then((r) => r.data),
  deleteLearningArea: (id: number) => api.delete(endpoints.subjects.byId(id)).then(() => undefined),

  listAssignments: () => api.getList<TeacherAssignment>(endpoints.academic.assignments.list),
  createAssignment: (body: AssignmentWritePayload) =>
    api.post<TeacherAssignment>(endpoints.academic.assignments.list, body).then((r) => r.data),
  deleteAssignment: (id: number) =>
    api.delete(endpoints.academic.assignments.byId(id)).then(() => undefined),

  listYears: () => api.get<AcademicYear[]>(endpoints.academic.years).then((r) => r.data ?? []),
  createYear: (body: AcademicYearWritePayload) =>
    api.post<AcademicYear>(endpoints.academic.years, body).then((r) => r.data as AcademicYear),
  updateYear: (id: number, body: AcademicYearWritePayload) =>
    api.put<AcademicYear>(endpoints.academic.yearById(id), body).then((r) => r.data as AcademicYear),

  listTerms: () => api.get<AcademicTerm[]>(endpoints.academic.terms).then((r) => r.data ?? []),
  createTerm: (body: AcademicTermWritePayload) =>
    api.post<AcademicTerm>(endpoints.academic.terms, body).then((r) => r.data as AcademicTerm),
  updateTerm: (id: number, body: AcademicTermWritePayload) =>
    api.put<AcademicTerm>(endpoints.academic.termById(id), body).then((r) => r.data as AcademicTerm),
}
