import { api } from '@/api/client'
import { ApiError } from '@/api/errors'
import { endpoints } from '@/api/endpoints'
import type {
  BulkPromotionBody,
  BulkRollbackBody,
  DemotionBody,
  Learner,
  LearnerBulkResult,
  LearnerHistoryEntry,
  LearnerWriteBody,
} from '@/features/learners/types/learner.types'

function requireData<T>(data: T | null | undefined, message: string): T {
  if (data === null || data === undefined) {
    throw new ApiError({ kind: 'unknown', message })
  }
  return data
}

export const learnersApi = {
  list(): Promise<Learner[]> {
    return api.get<Learner[]>(endpoints.learners.list).then((result) => result.data ?? [])
  },

  register(body: LearnerWriteBody): Promise<Learner> {
    return api.post<Learner>(endpoints.learners.register, body).then((result) =>
      requireData(result.data, 'Learner was enrolled but the response had no record'),
    )
  },

  update(id: number, body: LearnerWriteBody): Promise<Learner> {
    return api.put<Learner>(endpoints.learners.byId(id), body).then((result) =>
      requireData(result.data, 'Learner was updated but the response had no record'),
    )
  },

  remove(id: number): Promise<void> {
    return api.delete(endpoints.learners.byId(id)).then(() => undefined)
  },

  history(id: number): Promise<LearnerHistoryEntry[]> {
    return api.get<LearnerHistoryEntry[]>(endpoints.learners.history(id)).then((result) => result.data ?? [])
  },

  promoteClass(body: BulkPromotionBody): Promise<void> {
    return api.post(endpoints.learners.promotions, body).then(() => undefined)
  },

  transferCampus(body: { learnerId: number; targetCampusId: number; reason: string }): Promise<void> {
    return api.post(endpoints.learners.transferCampus, body).then(() => undefined)
  },

  transferExternal(body: { learnerId: number; newSchoolName: string; reason: string }): Promise<void> {
    return api.post(endpoints.learners.transferExternal, body).then(() => undefined)
  },

  graduateClass(body: { campusId: number; className: string }): Promise<void> {
    return api.post(endpoints.learners.graduate, body).then(() => undefined)
  },

  downloadTemplate(params: { campusId: number; classId: number; streamId?: number }): Promise<Blob> {
    return api.getBlob(endpoints.learners.bulkTemplate, { params })
  },

  upload(file: File, params: { campusId: number; classId: number; streamId?: number; academicYearId?: number }): Promise<LearnerBulkResult> {
    const body = new FormData()
    body.append('file', file)
    body.append('campusId', String(params.campusId))
    body.append('classId', String(params.classId))
    if (params.streamId) body.append('streamId', String(params.streamId))
    if (params.academicYearId) body.append('academicYearId', String(params.academicYearId))
    return api.postMultipart<LearnerBulkResult>(endpoints.learners.bulkUpload, body).then((result) => result.data ?? {})
  },

  rollbackSingle(learnerId: number, reason: string): Promise<void> {
    return api.post(endpoints.learners.rollbackSingle(learnerId), { reason }).then(() => undefined)
  },

  rollbackBulk(body: BulkRollbackBody): Promise<{ revertedLearnersCount?: number; revertedFromClass?: string }> {
    return api
      .post<{ revertedLearnersCount?: number; revertedFromClass?: string }>(endpoints.learners.rollbackBulk, body)
      .then((result) => result.data ?? {})
  },

  demote(body: DemotionBody): Promise<void> {
    return api.post(endpoints.learners.demote, body).then(() => undefined)
  },
}
