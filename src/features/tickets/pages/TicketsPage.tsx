import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip } from '@/components/data/FilterBar'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { FormSection } from '@/components/forms/FormSection'
import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDepartments } from '@/features/lookups/useLookups'
import { useTicketList, useTicketMutations } from '@/features/tickets/hooks/useTickets'
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  ticketPriorityBadge,
  ticketPriorityLabel,
  ticketStatusBadge,
  ticketStatusLabel,
  type CreateTicketPayload,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from '@/features/tickets/types/ticket.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDateTime } from '@/lib/format'

const TABS = ['mine', 'incoming'] as const
type TicketTab = (typeof TABS)[number]

function isTab(value: string | null): value is TicketTab {
  return TABS.some((tab) => tab === value)
}

export function TicketsPage(): ReactNode {
  useDocumentTitle('Tickets')
  const { user } = useAuth()
  const canCreate = can(user?.role, 'ticket:create')
  const canManage = can(user?.role, 'ticket:manage')
  const [params, setParams] = useSearchParams()
  const tab: TicketTab = isTab(params.get('tab')) ? (params.get('tab') as TicketTab) : 'mine'
  const tickets = useTicketList()
  const { create, updateStatus } = useTicketMutations()
  const departments = useDepartments()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [departmentId, setDepartmentId] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all')
  const [page, setPage] = useState(1)

  const username = user?.username ?? ''

  const visible = useMemo(() => {
    const all = tickets.data ?? []
    const scoped =
      tab === 'mine' ? all.filter((item) => (item.createdBy ?? '').toLowerCase() === username.toLowerCase()) : all
    if (statusFilter === 'all') return scoped
    return scoped.filter((item) => item.status === statusFilter)
  }, [statusFilter, tab, tickets.data, username])

  const handleCreate = (event: FormEvent) => {
    event.preventDefault()
    if (!canCreate) return
    const dept = Number(departmentId)
    if (!title.trim() || !description.trim() || !dept) {
      toast.error('Title, description, and department are required.')
      return
    }
    const body: CreateTicketPayload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      targetDepartment: { id: dept },
    }
    create.mutate(body, {
      onSuccess: () => {
        setTitle('')
        setDescription('')
      },
    })
  }

  const columns: Array<DataColumn<Ticket>> = [
    { id: 'title', header: 'Ticket', cell: (row) => row.title || `Ticket #${row.id}` },
    {
      id: 'priority',
      header: 'Priority',
      cell: (row) => <Badge variant={ticketPriorityBadge(row.priority)}>{ticketPriorityLabel(row.priority)}</Badge>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={ticketStatusBadge(row.status)}>{ticketStatusLabel(row.status)}</Badge>,
    },
    { id: 'dept', header: 'Department', cell: (row) => displayValue(row.targetDepartment?.name), hideOnMobile: true },
    { id: 'who', header: 'Raised by', cell: (row) => displayValue(row.createdBy), hideOnMobile: true },
    { id: 'when', header: 'Opened', cell: (row) => formatDateTime(row.createdAt), hideOnMobile: true },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tickets"
        description="Raise an issue for a department. GET /api/tickets returns every ticket; this page filters My tickets by createdBy."
      />

      {canCreate ? (
        <form onSubmit={handleCreate}>
          <FormSection title="New ticket" description="The controller sets createdBy from your login and status to OPEN.">
            <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            <SelectField
              label="Priority"
              value={priority}
              onChange={(value) => setPriority(value as TicketPriority)}
              options={TICKET_PRIORITIES.map((item) => ({ value: item, label: ticketPriorityLabel(item) }))}
              allowEmpty={false}
            />
            <SelectField
              label="Department"
              value={departmentId}
              onChange={setDepartmentId}
              options={(departments.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
              allowEmpty={false}
              placeholder="Select department"
              containerClassName="sm:col-span-2"
            />
            <TextareaField
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              containerClassName="sm:col-span-2"
              rows={4}
            />
            <div className="sm:col-span-2">
              <Button type="submit" isLoading={create.isPending} loadingLabel="Raising">
                Raise ticket
              </Button>
            </div>
          </FormSection>
        </form>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="mine">My tickets</TabsTrigger>
          <TabsTrigger value="incoming">Incoming</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip label="All" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
            {TICKET_STATUSES.map((status) => (
              <FilterChip
                key={status}
                label={ticketStatusLabel(status)}
                active={statusFilter === status}
                onClick={() => setStatusFilter(status)}
              />
            ))}
          </div>
          {tickets.isError ? (
            <ErrorState message={toUserMessage(tickets.error)} onRetry={() => void tickets.refetch()} />
          ) : visible.length === 0 && !tickets.isLoading ? (
            <EmptyState
              title={tab === 'mine' ? 'No tickets under your username' : 'No incoming tickets'}
              description={
                tab === 'mine'
                  ? 'New tickets are tagged with the username from your JWT.'
                  : 'Incoming shows the full GET /api/tickets list.'
              }
            />
          ) : (
            <DataTable
              columns={columns}
              rows={visible}
              getRowId={(row) => row.id}
              isLoading={tickets.isLoading}
              page={page}
              pageSize={10}
              total={visible.length}
              onPageChange={setPage}
              mobileCard={(row) => (
                <div className="flex flex-col gap-2">
                  <p className="type-heading">{row.title || `Ticket #${row.id}`}</p>
                  <p className="type-caption text-muted-foreground">
                    {ticketPriorityLabel(row.priority)} · {ticketStatusLabel(row.status)}
                  </p>
                  {canManage ? <StatusActions ticket={row} onUpdate={updateStatus.mutate} pending={updateStatus.isPending} /> : null}
                </div>
              )}
            />
          )}
          {canManage && visible.length > 0 ? (
            <div className="mt-4 hidden md:block">
              <p className="type-caption mb-2 text-muted-foreground">Update status (PUT /api/tickets/{'{id}'}/status)</p>
              <ul className="flex flex-col gap-2">
                {visible.slice((page - 1) * 10, page * 10).map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
                    <span className="type-label">{row.title || `Ticket #${row.id}`}</span>
                    <StatusActions ticket={row} onUpdate={updateStatus.mutate} pending={updateStatus.isPending} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatusActions({
  ticket,
  onUpdate,
  pending,
}: {
  ticket: Ticket
  onUpdate: (vars: { id: number; status: string }) => void
  pending: boolean
}): ReactNode {
  return (
    <div className="flex flex-wrap gap-1">
      {TICKET_STATUSES.filter((status) => status !== ticket.status).map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => onUpdate({ id: ticket.id, status })}
        >
          {ticketStatusLabel(status)}
        </Button>
      ))}
    </div>
  )
}
