import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { projectsApi } from '@/features/projects/api/projects.api'
import type { ProjectExpensePayload, ProjectWritePayload } from '@/features/projects/types/project.types'
import { logger } from '@/lib/logger'

export function useProjectList() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: projectsApi.list,
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

  const addExpense = useMutation({
    mutationFn: (body: ProjectExpensePayload) => projectsApi.addExpense(body),
    onSuccess: async (_void, variables) => {
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.finances(variables.project.id) }),
      ])
      toast.success('Expense recorded.')
    },
    onError: (error: unknown) => {
      logger.error('Project expense failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { create, addExpense }
}
