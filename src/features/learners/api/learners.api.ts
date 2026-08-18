import { api } from '@/api/client'
import { ApiError } from '@/api/errors'
import { endpoints } from '@/api/endpoints'
import type { Learner } from '@/features/learners/types/learner.types'

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

  register(body: Record<string, string | boolean>): Promise<Learner> {
    return api.post<Learner>(endpoints.learners.register, body).then((result) =>
      requireData(result.data, 'Learner was enrolled but the response had no record'),
    )
  },

  update(id: number, body: Record<string, string | boolean>): Promise<Learner> {
    return api.put<Learner>(endpoints.learners.byId(id), body).then((result) =>
      requireData(result.data, 'Learner was updated but the response had no record'),
    )
  },

  remove(id: number): Promise<void> {
    return api.delete(endpoints.learners.byId(id)).then(() => undefined)
  },
}
