import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  AcademicStream,
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

  listStreams: () => api.getList<AcademicStream>(endpoints.academic.streams),
  createStream: (body: { name: string }) =>
    api.post<AcademicStream>(endpoints.academic.streams, body).then((r) => r.data),

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
}
