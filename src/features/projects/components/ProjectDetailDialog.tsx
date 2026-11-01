import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useProjectAudit, useProjectFinances } from '@/features/projects/hooks/useProjects'
import {
  PROJECT_STATUSES,
  projectStatusBadge,
  projectStatusLabel,
  type Project,
  type ProjectStatus,
} from '@/features/projects/types/project.types'
import { displayValue, formatDate, formatKes } from '@/lib/format'

export interface ProjectDetailDialogProps {
  project: Project | null
  canUpdateStatus: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (status: ProjectStatus) => void
}

export function ProjectDetailDialog({
  project,
  canUpdateStatus,
  isSaving,
  onOpenChange,
  onStatusChange,
}: ProjectDetailDialogProps): ReactNode {
  const finances = useProjectFinances(project?.id ?? null)
  const audit = useProjectAudit(project?.id ?? null)

  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {project?.name || (project ? `Project #${project.id}` : 'Project')}
            {project ? (
              <Badge variant={projectStatusBadge(project.status)}>{projectStatusLabel(project.status)}</Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>Status, expenses, and the budget audit for this project.</DialogDescription>
        </DialogHeader>
        {project ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-4 sm:px-6">
            <dl className="grid grid-cols-2 gap-3 type-caption text-muted-foreground">
              <div>
                <dt>Department</dt>
                <dd className="font-medium text-foreground">{displayValue(project.department?.name)}</dd>
              </div>
              <div>
                <dt>Start</dt>
                <dd className="font-medium text-foreground">{formatDate(project.startDate)}</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd className="font-medium text-foreground">{formatDate(project.deadline)}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd className="font-medium text-foreground">{formatKes(project.totalBudget)}</dd>
              </div>
              <div>
                <dt>Requisition</dt>
                <dd className="font-medium text-foreground">
                  {displayValue(project.requisition?.requisitionNumber ?? finances.data?.linkedRequisition?.number)}
                </dd>
              </div>
            </dl>
            <div>
              <p className="type-caption font-medium text-muted-foreground">Description</p>
              <p className="type-body mt-1 whitespace-pre-wrap">{displayValue(project.description)}</p>
            </div>
            <div>
              <p className="type-caption mb-2 font-medium text-muted-foreground">Finance report</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border px-3 py-2">
                  <p className="type-caption text-muted-foreground">Budget</p>
                  <p className="type-heading">{formatKes(finances.data?.budget ?? project.totalBudget)}</p>
                </div>
                <div className="rounded-xl border border-border px-3 py-2">
                  <p className="type-caption text-muted-foreground">Spent</p>
                  <p className="type-heading">{finances.isError ? '—' : finances.isLoading ? '…' : formatKes(finances.data?.spent)}</p>
                </div>
                <div className="rounded-xl border border-border px-3 py-2">
                  <p className="type-caption text-muted-foreground">Remaining</p>
                  <p className="type-heading">
                    {finances.isError ? '—' : finances.isLoading ? '…' : formatKes(finances.data?.remaining)}
                  </p>
                </div>
              </div>
            </div>
            {canUpdateStatus ? (
              <div>
                <p className="type-caption mb-2 font-medium text-muted-foreground">Update status</p>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_STATUSES.filter((status) => status !== project.status).map((status) => (
                    <Button
                      key={status}
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => onStatusChange(status)}
                    >
                      {projectStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            {(finances.data?.expenses?.length ?? 0) > 0 ? (
              <div>
                <p className="type-caption mb-2 font-medium text-muted-foreground">Expenses</p>
                <ul className="flex flex-col gap-2">
                  {finances.data?.expenses?.map((item) => (
                    <li key={item.id} className="rounded-xl border border-border px-3 py-2">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <p className="type-body">{displayValue(item.description)}</p>
                        <p className="type-label shrink-0">{formatKes(item.amount)}</p>
                      </div>
                      <p className="type-caption text-muted-foreground">
                        {formatDate(item.date)}
                        {item.receiptLink && item.receiptLink !== 'None' ? ` · ${item.receiptLink}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {audit.data ? (
              <div className="flex flex-col gap-3">
                <p className="type-caption font-medium text-muted-foreground">
                  Audit · {displayValue(audit.data.financial_status)}
                </p>
                {audit.data.warnings?.map((warning) => (
                  <p key={warning} className="rounded-xl bg-destructive/10 px-3 py-2 type-caption text-destructive">
                    {warning}
                  </p>
                ))}
                {audit.data.recommendations?.map((note) => (
                  <p key={note} className="type-caption text-muted-foreground">
                    {note}
                  </p>
                ))}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border type-caption text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Item</th>
                        <th className="py-2 pr-3 font-medium">Requested</th>
                        <th className="py-2 pr-3 font-medium">Paid</th>
                        <th className="py-2 font-medium">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.data.item_by_item_variance?.map((row) => (
                        <tr key={`${row.item}-${row.actual_cost}`} className="border-b border-border type-caption">
                          <td className="py-2 pr-3">{displayValue(row.item)}</td>
                          <td className="py-2 pr-3">{formatKes(row.requested_cost)}</td>
                          <td className="py-2 pr-3">{formatKes(row.actual_cost)}</td>
                          <td className="py-2">{displayValue(row.flag)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="flex flex-col gap-2 md:hidden">
                  {audit.data.item_by_item_variance?.map((row) => (
                    <li key={`${row.item}-${row.actual_cost}`} className="rounded-xl border border-border px-3 py-2">
                      <p className="type-body">{displayValue(row.item)}</p>
                      <p className="type-caption text-muted-foreground">
                        Requested {formatKes(row.requested_cost)} · Paid {formatKes(row.actual_cost)} · {displayValue(row.flag)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        <DialogFooter className="border-t border-border px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
