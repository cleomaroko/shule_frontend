import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { hrApi } from '@/features/hr/api/hr.api'
import type { LeaveApplicationPayload, SalarySettingPayload, StaffAttendancePayload } from '@/features/hr/types/hr.types'
import { logger } from '@/lib/logger'

export function useMyAppraisals() {
  return useQuery({ queryKey: queryKeys.hr.myAppraisals, queryFn: hrApi.myAppraisals })
}

export function useMyPayroll() {
  return useQuery({ queryKey: queryKeys.hr.myPayroll, queryFn: hrApi.myPayroll })
}

export function useHrLeaves() {
  return useQuery({ queryKey: queryKeys.hr.leaves, queryFn: hrApi.leaves })
}

export function useHrPayroll(enabled = true) {
  return useQuery({ queryKey: queryKeys.hr.payroll, queryFn: hrApi.payroll, enabled })
}

export function useHrMutations() {
  const queryClient = useQueryClient()
  const invalidateLeaves = () => queryClient.invalidateQueries({ queryKey: queryKeys.hr.leaves })
  const invalidatePayroll = () => queryClient.invalidateQueries({ queryKey: queryKeys.hr.payroll })

  const applyLeave = useMutation({
    mutationFn: (body: LeaveApplicationPayload) => hrApi.applyLeave(body),
    onSuccess: () => toast.success('Leave application submitted.'),
    onError: (error: unknown) => {
      logger.error('Leave application failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const uploadAttendance = useMutation({
    mutationFn: (body: StaffAttendancePayload[]) => hrApi.uploadAttendance(body),
    onSuccess: () => toast.success('Staff attendance recorded.'),
    onError: (error: unknown) => {
      logger.error('Staff attendance upload failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const processPayroll = useMutation({
    mutationFn: (month: string) => hrApi.processPayroll(month),
    onSuccess: async () => {
      await invalidatePayroll()
      toast.success('Payroll processing completed.')
    },
    onError: (error: unknown) => {
      logger.error('Payroll processing failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateLeaveStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) => hrApi.updateLeaveStatus(id, status),
    onSuccess: async (_saved, variables) => {
      await invalidateLeaves()
      toast.success(`Leave request ${variables.status.toLowerCase()}.`)
    },
    onError: (error: unknown) => {
      logger.error('Leave decision failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const saveSalary = useMutation({
    mutationFn: (body: SalarySettingPayload) => hrApi.salarySettings(body),
    onSuccess: () => toast.success('Salary settings saved.'),
    onError: (error: unknown) => {
      logger.error('Salary settings save failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { applyLeave, uploadAttendance, processPayroll, updateLeaveStatus, saveSalary }
}