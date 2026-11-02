import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { staffApi, type StaffListKind } from '@/features/staff/api/staff.api'
import type { Staff, StaffWritePayload } from '@/features/staff/types/staff.types'
import { logger } from '@/lib/logger'

export function useStaffList() {
  return useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: staffApi.list,
  })
}

/** Teaching staff (`GET /api/staff/teachers`), every page joined for dropdowns. */
export function useTeacherList() {
  return useQuery({
    queryKey: queryKeys.staff.teachers,
    queryFn: staffApi.listTeachers,
  })
}

/** Drivers (`GET /api/staff/drivers`), every page joined for the transport log form. */
export function useDriverList() {
  return useQuery({
    queryKey: queryKeys.staff.drivers,
    queryFn: staffApi.listDrivers,
  })
}

/** Security staff (`GET /api/staff/security`). */
export function useSecurityList() {
  return useQuery({
    queryKey: queryKeys.staff.security,
    queryFn: staffApi.listSecurity,
  })
}

/** One server page for the staff directory. `page` is 1-based. */
export function useStaffPage(kind: StaffListKind, page: number, size: number) {
  return useQuery({
    queryKey: queryKeys.staff.page(kind, page, size),
    queryFn: () => staffApi.page(kind, page - 1, size),
  })
}

export function useStaff(id: number | undefined) {
  const list = useStaffList()
  const staff = list.data?.find((item) => item.id === id)

  return {
    ...list,
    staff: staff ?? null,
    isMissing: Boolean(id) && !list.isLoading && !list.isError && !staff,
  }
}

export function useStaffMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['staff'] }),
    ])

  const create = useMutation({
    mutationFn: (body: StaffWritePayload) => staffApi.register(body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Staff member created successfully.')
    },
    onError: (error: unknown) => {
      logger.error('Staff registration failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: StaffWritePayload }) => staffApi.update(id, body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Staff member updated successfully.')
    },
    onError: (error: unknown) => {
      logger.error('Staff update failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const resign = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => staffApi.resign(id, reason),
    onSuccess: async () => {
      await invalidate()
      toast.success('Resignation recorded. Their login has been removed.')
    },
    onError: (error: unknown) => {
      logger.error('Staff resignation failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => staffApi.remove(id),
    onSuccess: async () => {
      await invalidate()
      toast.success('Staff member deleted successfully.')
    },
    onError: (error: unknown) => {
      logger.error('Staff delete failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const linkBiometric = useMutation({
    mutationFn: ({ id, empCode }: { id: number; empCode: string }) => staffApi.linkBiometric(id, empCode),
    onSuccess: async () => {
      await invalidate()
      toast.success('Biometric code linked.')
    },
    onError: (error: unknown) => {
      logger.error('Biometric code link failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { create, update, remove, resign, linkBiometric }
}

export function findStaff(list: Staff[] | undefined, id: number): Staff | undefined {
  return list?.find((item) => item.id === id)
}
