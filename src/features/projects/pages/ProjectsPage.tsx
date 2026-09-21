import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { FormSection } from '@/components/forms/FormSection'
import {
  GoogleDriveDocumentField,
  type GoogleDriveDocumentFieldHandle,
} from '@/components/forms/GoogleDriveDocumentField'
import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDepartments } from '@/features/lookups/useLookups'
import { useProjectFinances, useProjectList, useProjectMutations } from '@/features/projects/hooks/useProjects'
import {
  PROJECT_STATUSES,
  projectStatusBadge,
  projectStatusLabel,
  type Project,
  type ProjectExpensePayload,
  type ProjectStatus,
  type ProjectWritePayload,
} from '@/features/projects/types/project.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDate, formatKes, todayIso } from '@/lib/format'

export function ProjectsPage(): ReactNode {
  useDocumentTitle('Projects')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'project:write')
  const canExpense = can(user?.role, 'project:expense')
  const projects = useProjectList()
  const departments = useDepartments()
  const { create, addExpense } = useProjectMutations()
  const driveRef = useRef<GoogleDriveDocumentFieldHandle>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [startDate, setStartDate] = useState(todayIso())
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('PLANNED')
  const [budget, setBudget] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(todayIso())
  const [receiptLink, setReceiptLink] = useState('')
  const [page, setPage] = useState(1)

  const finances = useProjectFinances(selectedId)
  const selected = (projects.data ?? []).find((item) => item.id === selectedId) ?? null

  const handleCreate = (event: FormEvent) => {
    event.preventDefault()
    if (!canWrite) return
    const parsedBudget = Number(budget)
    if (!name.trim() || !Number.isFinite(parsedBudget) || parsedBudget < 0) {
      toast.error('Name and a budget of zero or more are required.')
      return
    }
    const body: ProjectWritePayload = {
      name: name.trim(),
      status,
      totalBudget: parsedBudget,
    }
    if (description.trim()) body.description = description.trim()
    const dept = Number(departmentId)
    if (dept) body.department = { id: dept }
    if (startDate) body.startDate = startDate
    if (deadline) body.deadline = deadline
    create.mutate(body, {
      onSuccess: (saved) => {
        setName('')
        setDescription('')
        setBudget('')
        if (saved.id) setSelectedId(saved.id)
      },
    })
  }

  const handleExpense = async (event: FormEvent) => {
    event.preventDefault()
    if (!canExpense || selectedId == null) return
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !expenseDescription.trim()) {
      toast.error('Amount and description are required.')
      return
    }
    let link = receiptLink
    try {
      link = (await driveRef.current?.commit()) ?? receiptLink
    } catch {
      return
    }
    const body: ProjectExpensePayload = {
      project: { id: selectedId },
      amount: parsedAmount,
      description: expenseDescription.trim(),
    }
    if (expenseDate) body.expenseDate = expenseDate
    if (link.trim()) body.receiptLink = link.trim()
    addExpense.mutate(body, {
      onSuccess: () => {
        setAmount('')
        setExpenseDescription('')
        setReceiptLink('')
      },
    })
  }

  const columns: Array<DataColumn<Project>> = [
    { id: 'name', header: 'Project', cell: (row) => row.name || `Project #${row.id}` },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={projectStatusBadge(row.status)}>{projectStatusLabel(row.status)}</Badge>,
    },
    { id: 'budget', header: 'Budget', cell: (row) => formatKes(row.totalBudget) },
    { id: 'dept', header: 'Department', cell: (row) => displayValue(row.department?.name), hideOnMobile: true },
    { id: 'deadline', header: 'Deadline', cell: (row) => formatDate(row.deadline), hideOnMobile: true },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projects"
        description="GET /api/projects returns a raw list. Create is also unwrapped. Expenses and the finance summary use the ApiResponse envelope."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {canWrite ? (
          <form onSubmit={handleCreate}>
            <FormSection title="New project" description="POST /api/projects with name, budget, status, and optional dates.">
              <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
              <SelectField
                label="Status"
                value={status}
                onChange={(value) => setStatus(value as ProjectStatus)}
                options={PROJECT_STATUSES.map((item) => ({ value: item, label: projectStatusLabel(item) }))}
                allowEmpty={false}
              />
              <SelectField
                label="Department"
                value={departmentId}
                onChange={setDepartmentId}
                options={(departments.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
                emptyLabel="Not set"
              />
              <TextField
                label="Total budget (KES)"
                type="number"
                min="0"
                step="0.01"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                required
              />
              <TextField label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <TextField label="Deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
              <TextareaField
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                containerClassName="sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <Button type="submit" isLoading={create.isPending} loadingLabel="Saving">
                  Save project
                </Button>
              </div>
            </FormSection>
          </form>
        ) : (
          <EmptyState title="View only" description="Creating projects is limited to admin and head roles in this UI." />
        )}

        <form onSubmit={(event) => void handleExpense(event)}>
          <FormSection
            title="Record expense"
            description="POST /api/projects/expense. There is no expense list — the finance summary is the remaining view."
          >
            <SelectField
              label="Project"
              value={selectedId ? String(selectedId) : ''}
              onChange={(value) => setSelectedId(Number(value))}
              options={(projects.data ?? []).map((item) => ({
                value: String(item.id),
                label: item.name || `Project #${item.id}`,
              }))}
              allowEmpty={false}
              placeholder="Select project"
              containerClassName="sm:col-span-2"
            />
            {selected ? (
              <Card className="sm:col-span-2">
                <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
                  <div>
                    <p className="type-caption text-muted-foreground">Budget</p>
                    <p className="type-heading">{formatKes(finances.data?.budget ?? selected.totalBudget)}</p>
                  </div>
                  <div>
                    <p className="type-caption text-muted-foreground">Spent</p>
                    <p className="type-heading">{finances.isError ? '—' : formatKes(finances.data?.spent)}</p>
                  </div>
                  <div>
                    <p className="type-caption text-muted-foreground">Remaining</p>
                    <p className="type-heading">{finances.isError ? '—' : formatKes(finances.data?.remaining)}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
            <TextField
              label="Amount (KES)"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
            <TextField
              label="Expense date"
              type="date"
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
            />
            <TextareaField
              label="Description"
              value={expenseDescription}
              onChange={(event) => setExpenseDescription(event.target.value)}
              containerClassName="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <GoogleDriveDocumentField
                ref={driveRef}
                label="Receipt"
                value={receiptLink}
                onChange={setReceiptLink}
                hint="Optional. Stored as receiptLink."
              />
            </div>
            <div className="sm:col-span-2">
              {canExpense ? (
                <Button type="submit" isLoading={addExpense.isPending} loadingLabel="Recording" disabled={selectedId == null}>
                  Record expense
                </Button>
              ) : (
                <p className="type-caption text-muted-foreground">Recording expenses is limited in this UI.</p>
              )}
            </div>
          </FormSection>
        </form>
      </div>

      {projects.isError ? (
        <ErrorState message={toUserMessage(projects.error)} onRetry={() => void projects.refetch()} />
      ) : (projects.data ?? []).length === 0 && !projects.isLoading ? (
        <EmptyState title="No projects yet" description="Create a project to start tracking budget versus spend." />
      ) : (
        <DataTable
          columns={columns}
          rows={projects.data ?? []}
          getRowId={(row) => row.id}
          isLoading={projects.isLoading}
          page={page}
          pageSize={10}
          total={(projects.data ?? []).length}
          onPageChange={setPage}
          onRowClick={(row) => setSelectedId(row.id)}
          rowAriaLabel={(row) => `Select ${row.name || `project ${row.id}`}`}
          mobileCard={(row) => (
            <div>
              <p className="type-heading">{row.name || `Project #${row.id}`}</p>
              <p className="type-caption text-muted-foreground">
                {projectStatusLabel(row.status)} · {formatKes(row.totalBudget)}
              </p>
            </div>
          )}
        />
      )}
    </div>
  )
}
