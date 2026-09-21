import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  Project,
  ProjectExpensePayload,
  ProjectFinances,
  ProjectWritePayload,
} from '@/features/projects/types/project.types'

export const projectsApi = {
  list: () => api.getList<Project>(endpoints.projects.list),

  create: (body: ProjectWritePayload) => api.postRaw<Project>(endpoints.projects.list, body),

  addExpense: (body: ProjectExpensePayload) => api.post<null>(endpoints.projects.expense, body).then(() => undefined),

  finances: (id: number) =>
    api.get<ProjectFinances>(endpoints.projects.finances(id)).then((r) => r.data as ProjectFinances),
}
