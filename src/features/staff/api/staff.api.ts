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

export type StaffListKind = 'all' | 'teachers' | 'drivers' | 'security'

export interface StaffPage {
  content: Staff[]
  totalElements: number
  totalPages: number
}

export interface StaffBulkResult {
  totalImported?: number
  failedRows?: number
  errors?: string[]
}

const PAGE_SIZE = 100
const MAX_PAGES = 20

function listUrl(kind: StaffListKind): string {
  switch (kind) {
    case 'teachers':
      return endpoints.staff.teachers
    case 'drivers':
      return endpoints.staff.drivers
    case 'security':
      return endpoints.staff.security
    default:
      return endpoints.staff.list
  }
}

function asPage(data: StaffPage | Staff[] | null | undefined): StaffPage {
  if (Array.isArray(data)) {
    return { content: data, totalElements: data.length, totalPages: data.length ? 1 : 0 }
  }
  const content = data?.content ?? []
  return {
    content,
    totalElements: data?.totalElements ?? content.length,
    totalPages: data?.totalPages ?? (content.length ? 1 : 0),
  }
}

async function readPage(kind: StaffListKind, page: number, size: number): Promise<StaffPage> {
  const result = await api.get<StaffPage | Staff[]>(listUrl(kind), { params: { page, size } })
  return asPage(result.data)
}

async function readAll(kind: StaffListKind): Promise<Staff[]> {
  const first = await readPage(kind, 0, PAGE_SIZE)
  const rows = [...first.content]
  const pages = Math.min(first.totalPages, MAX_PAGES)
  for (let page = 1; page < pages; page += 1) {
    const next = await readPage(kind, page, PAGE_SIZE)
    rows.push(...next.content)
  }
  return rows
}

export const staffApi = {
  list: () => readAll('all'),
  listTeachers: () => readAll('teachers'),
  listDrivers: () => readAll('drivers'),
  listSecurity: () => readAll('security'),
  page: (kind: StaffListKind, page: number, size: number) => readPage(kind, page, size),

  downloadTemplate: () => api.getBlob(endpoints.staff.bulkTemplate),

  upload(file: File): Promise<StaffBulkResult> {
    const body = new FormData()
    body.append('file', file)
    return api.postMultipart<StaffBulkResult>(endpoints.staff.bulkUpload, body).then((result) => result.data ?? {})
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

  resign(id: number, reason: string): Promise<void> {
    return api.patch<null>(endpoints.staff.resign(id), null, { params: { reason } }).then(() => undefined)
  },
}
