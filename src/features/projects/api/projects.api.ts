import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  Project,
  ProjectAudit,
  ProjectExpensePayload,
  ProjectFinances,
  ProjectStatus,
  ProjectWritePayload,
} from '@/features/projects/types/project.types'

export const projectsApi = {
  list: () => api.getList<Project>(endpoints.projects.list),

  create: (body: ProjectWritePayload) =>
    api.post<Project>(endpoints.projects.list, body).then((result) => result.data as Project),

  updateStatus: (id: number, status: ProjectStatus) =>
    api.patch<Project>(endpoints.projects.status(id), { status }).then((result) => result.data as Project),

  addExpense: (body: ProjectExpensePayload) => api.post<null>(endpoints.projects.expense, body).then(() => undefined),

  finances: (id: number) =>
    api.get<ProjectFinances>(endpoints.projects.finances(id)).then((r) => r.data as ProjectFinances),

  audit: (id: number) => api.get<ProjectAudit>(endpoints.projects.audit(id)).then((r) => r.data as ProjectAudit),
}
