import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  AttendanceMarkPayload,
  AttendanceNamedLookup,
  AttendanceRecord,
  AttendanceReportQuery,
} from '@/features/attendance/types/attendance.types'

export function compactAttendanceQuery(params?: AttendanceReportQuery): Record<string, string | number> {
  if (!params) return {}
  const out: Record<string, string | number> = {}
  if (params.learnerId) out.learnerId = params.learnerId
  if (params.classId) out.classId = params.classId
  if (params.streamId) out.streamId = params.streamId
  if (params.date) out.date = params.date
  return out
}

export const attendanceApi = {
  report: (params?: AttendanceReportQuery) =>
    api
      .get<AttendanceRecord[]>(endpoints.attendance.report, { params: compactAttendanceQuery(params) })
      .then((r) => r.data ?? []),

  mark: (body: AttendanceMarkPayload) =>
    api.post<AttendanceRecord>(endpoints.attendance.mark, body).then((r) => r.data as AttendanceRecord),

  markMany: async (rows: AttendanceMarkPayload[]) => {
    const results = await Promise.allSettled(rows.map((row) => attendanceApi.mark(row)))
    return {
      saved: results.filter((row) => row.status === 'fulfilled').length,
      failed: results.filter((row) => row.status === 'rejected').length,
      total: rows.length,
    }
  },

  listSessions: () => api.getList<AttendanceNamedLookup>(endpoints.attendance.sessions),
  createSession: (body: { name: string }) =>
    api.post<AttendanceNamedLookup>(endpoints.attendance.sessions, body).then((r) => r.data as AttendanceNamedLookup),
  updateSession: (id: number, body: { name: string }) =>
    api
      .put<AttendanceNamedLookup>(endpoints.attendance.sessionById(id), body)
      .then((r) => r.data as AttendanceNamedLookup),
  deleteSession: (id: number) => api.delete(endpoints.attendance.sessionById(id)).then(() => undefined),

  listActivities: () => api.getList<AttendanceNamedLookup>(endpoints.attendance.activities),
  createActivity: (body: { name: string }) =>
    api
      .post<AttendanceNamedLookup>(endpoints.attendance.activities, body)
      .then((r) => r.data as AttendanceNamedLookup),
  updateActivity: (id: number, body: { name: string }) =>
    api
      .put<AttendanceNamedLookup>(endpoints.attendance.activityById(id), body)
      .then((r) => r.data as AttendanceNamedLookup),
  deleteActivity: (id: number) => api.delete(endpoints.attendance.activityById(id)).then(() => undefined),
}
