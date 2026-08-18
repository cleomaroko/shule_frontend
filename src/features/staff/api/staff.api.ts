import { api } from '@/api/client'
import { ApiError } from '@/api/errors'
import { endpoints } from '@/api/endpoints'
import type { Staff, StaffWritePayload } from '@/features/staff/types/staff.types'

function requireData<T>(data: T | null | undefined, message: string): T {
  if (data === null || data === undefined) {
    throw new ApiError({ kind: 'unknown', message })
  }
  return data
}

export const staffApi = {
  list(): Promise<Staff[]> {
    return api.get<Staff[]>(endpoints.staff.list).then((result) => result.data ?? [])
  },

  register(body: StaffWritePayload): Promise<Staff> {
    return api.post<Staff>(endpoints.staff.register, body).then((result) =>
      requireData(result.data, 'Staff was created but the response had no record'),
    )
  },

  update(id: number, body: StaffWritePayload): Promise<Staff> {
    return api.put<Staff>(endpoints.staff.byId(id), body).then((result) =>
      requireData(result.data, 'Staff was updated but the response had no record'),
    )
  },

  remove(id: number): Promise<void> {
    return api.delete(endpoints.staff.byId(id)).then(() => undefined)
  },
}
