import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { projectsApi } from '@/features/projects/api/projects.api'
import type { ProjectExpensePayload, ProjectStatus, ProjectWritePayload } from '@/features/projects/types/project.types'
import { logger } from '@/lib/logger'

export function useProjectList() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: projectsApi.list,
  })
}

export function useProjectAudit(id: number | null) {
  return useQuery({
    queryKey: queryKeys.projects.audit(id ?? 0),
    queryFn: () => projectsApi.audit(id as number),
    enabled: id != null,
  })
}

export function useProjectFinances(id: number | null) {
  return useQuery({
    queryKey: queryKeys.projects.finances(id ?? 0),
    queryFn: () => projectsApi.finances(id as number),
    enabled: id != null,
  })
}

export function useProjectMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })

  const create = useMutation({
    mutationFn: (body: ProjectWritePayload) => projectsApi.create(body),
    onSuccess: async () => {
      await invalidate()
      toast.success('Project saved.')
    },
    onError: (error: unknown) => {
      logger.error('Create project failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProjectStatus }) => projectsApi.updateStatus(id, status),
    onSuccess: async (saved, variables) => {
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.finances(variables.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.audit(variables.id) }),
      ])
      toast.success('Project status updated.')
      return saved
    },
    onError: (error: unknown) => {
      logger.error('Update project status failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const addExpense = useMutation({
    mutationFn: (body: ProjectExpensePayload) => projectsApi.addExpense(body),
    onSuccess: async (_void, variables) => {
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.finances(variables.projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.audit(variables.projectId) }),
      ])
      toast.success('Expense recorded.')
    },
    onError: (error: unknown) => {
      logger.error('Project expense failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { create, updateStatus, addExpense }
}
