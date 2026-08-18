import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { staffApi } from '@/features/staff/api/staff.api'
import type { Staff, StaffWritePayload } from '@/features/staff/types/staff.types'
import { logger } from '@/lib/logger'

export function useStaffList() {
  return useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: staffApi.list,
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.staff.all })

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

  return { create, update, remove }
}

export function findStaff(list: Staff[] | undefined, id: number): Staff | undefined {
  return list?.find((item) => item.id === id)
}
