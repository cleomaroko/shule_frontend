import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { attendanceApi, compactAttendanceQuery } from '@/features/attendance/api/attendance.api'
import type { AttendanceMarkPayload, AttendanceReportQuery } from '@/features/attendance/types/attendance.types'
import { logger } from '@/lib/logger'

export function useAttendanceReport(params?: AttendanceReportQuery) {
  const compact = compactAttendanceQuery(params)
  return useQuery({
    queryKey: queryKeys.attendance.report(compact),
    queryFn: () => attendanceApi.report(params),
  })
}

export function useAttendanceSessionList() {
  return useQuery({
    queryKey: queryKeys.attendance.sessions,
    queryFn: attendanceApi.listSessions,
  })
}

export function useAttendanceActivityList() {
  return useQuery({
    queryKey: queryKeys.attendance.activities,
    queryFn: attendanceApi.listActivities,
  })
}

export function useAttendanceMutations() {
  const queryClient = useQueryClient()
  const invalidateReport = () => queryClient.invalidateQueries({ queryKey: ['attendance', 'report'] })
  const invalidateSessions = () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.sessions })
  const invalidateActivities = () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.activities })

  const mark = useMutation({
    mutationFn: (body: AttendanceMarkPayload) => attendanceApi.mark(body),
    onSuccess: async () => {
      await invalidateReport()
      toast.success('Attendance marked.')
    },
    onError: (error: unknown) => {
      logger.error('Mark attendance failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const markMany = useMutation({
    mutationFn: (rows: AttendanceMarkPayload[]) => attendanceApi.markMany(rows),
    onSuccess: async (result) => {
      await invalidateReport()
      if (result.failed === 0) {
        toast.success(`Marked ${result.saved} learner${result.saved === 1 ? '' : 's'}.`)
        return
      }
      toast.error(`Saved ${result.saved} of ${result.total}. ${result.failed} failed.`)
    },
    onError: (error: unknown) => {
      logger.error('Batch attendance failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createSession = useMutation({
    mutationFn: (body: { name: string }) => attendanceApi.createSession(body),
    onSuccess: async () => {
      await invalidateSessions()
      toast.success('Session added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const updateSession = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => attendanceApi.updateSession(id, { name }),
    onSuccess: async () => {
      await invalidateSessions()
      toast.success('Session updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const deleteSession = useMutation({
    mutationFn: (id: number) => attendanceApi.deleteSession(id),
    onSuccess: async () => {
      await invalidateSessions()
      toast.success('Session removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createActivity = useMutation({
    mutationFn: (body: { name: string }) => attendanceApi.createActivity(body),
    onSuccess: async () => {
      await invalidateActivities()
      toast.success('Activity added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const updateActivity = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => attendanceApi.updateActivity(id, { name }),
    onSuccess: async () => {
      await invalidateActivities()
      toast.success('Activity updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const deleteActivity = useMutation({
    mutationFn: (id: number) => attendanceApi.deleteActivity(id),
    onSuccess: async () => {
      await invalidateActivities()
      toast.success('Activity removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  return {
    mark,
    markMany,
    createSession,
    updateSession,
    deleteSession,
    createActivity,
    updateActivity,
    deleteActivity,
  }
}
