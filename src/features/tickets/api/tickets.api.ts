import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { CreateTicketPayload, Ticket } from '@/features/tickets/types/ticket.types'

export const ticketsApi = {
  list: () => api.get<Ticket[]>(endpoints.tickets.list).then((r) => r.data ?? []),

  create: (body: CreateTicketPayload) =>
    api.post<Ticket>(endpoints.tickets.list, body).then((r) => r.data as Ticket),

  updateStatus: (id: number, status: string) =>
    api.put<Ticket>(endpoints.tickets.status(id), undefined, { params: { status } }).then((r) => r.data as Ticket),
}
