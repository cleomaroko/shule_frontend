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
import { useProjectFinances } from '@/features/projects/hooks/useProjects'
import {
  PROJECT_STATUSES,
  projectStatusBadge,
  projectStatusLabel,
  type Project,
  type ProjectStatus,
  type ProjectWritePayload,
} from '@/features/projects/types/project.types'
import { displayValue, formatDate, formatKes } from '@/lib/format'

export interface ProjectDetailDialogProps {
  project: Project | null
  canUpdateStatus: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (body: ProjectWritePayload) => void
}

export function ProjectDetailDialog({
  project,
  canUpdateStatus,
  isSaving,
  onOpenChange,
  onStatusChange,
}: ProjectDetailDialogProps): ReactNode {
  const finances = useProjectFinances(project?.id ?? null)

  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {project?.name || (project ? `Project #${project.id}` : 'Project')}
            {project ? (
              <Badge variant={projectStatusBadge(project.status)}>{projectStatusLabel(project.status)}</Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>Status and the finance report for this project.</DialogDescription>
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
                      onClick={() => onStatusChange(toStatusPayload(project, status))}
                    >
                      {projectStatusLabel(status)}
                    </Button>
                  ))}
                </div>
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

function toStatusPayload(project: Project, status: ProjectStatus): ProjectWritePayload {
  const body: ProjectWritePayload = {
    id: project.id,
    name: project.name?.trim() || `Project #${project.id}`,
    status,
    totalBudget: project.totalBudget ?? 0,
  }
  if (project.description?.trim()) body.description = project.description.trim()
  if (project.department?.id) body.department = { id: project.department.id }
  if (project.startDate) body.startDate = project.startDate.slice(0, 10)
  if (project.deadline) body.deadline = project.deadline.slice(0, 10)
  return body
}
