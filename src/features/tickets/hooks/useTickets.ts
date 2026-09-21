import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { ticketsApi } from '@/features/tickets/api/tickets.api'
import type { CreateTicketPayload } from '@/features/tickets/types/ticket.types'
import { logger } from '@/lib/logger'

export function useTicketList() {
  return useQuery({
    queryKey: queryKeys.tickets.all,
    queryFn: ticketsApi.list,
  })
}

export function useTicketMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })

  const create = useMutation({
    mutationFn: (body: CreateTicketPayload) => ticketsApi.create(body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Ticket raised.')
    },
    onError: (error: unknown) => {
      logger.error('Create ticket failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => ticketsApi.updateStatus(id, status),
    onSuccess: async () => {
      await invalidate()
      toast.success('Ticket status updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update ticket status failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { create, updateStatus }
}
