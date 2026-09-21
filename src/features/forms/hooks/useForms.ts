import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { formsApi } from '@/features/forms/api/forms.api'
import type { FormTemplateWritePayload } from '@/features/forms/types/form.types'
import { logger } from '@/lib/logger'

export function useFormTemplates() {
  return useQuery({
    queryKey: queryKeys.forms.templates,
    queryFn: formsApi.listTemplates,
  })
}

export function useFormResponses(templateId: number | null) {
  return useQuery({
    queryKey: queryKeys.forms.responses(templateId ?? 0),
    queryFn: () => formsApi.responses(templateId as number),
    enabled: templateId != null,
  })
}

export function useSharedForm(templateId: number | null) {
  return useQuery({
    queryKey: queryKeys.forms.shared(templateId ?? 0),
    queryFn: () => formsApi.shared(templateId as number),
    enabled: templateId != null,
  })
}

export function useSharedFormResults(templateId: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.forms.sharedResults(templateId ?? 0),
    queryFn: () => formsApi.sharedResults(templateId as number),
    enabled: enabled && templateId != null,
  })
}

export function useFormMutations() {
  const queryClient = useQueryClient()

  const createTemplate = useMutation({
    mutationFn: (body: FormTemplateWritePayload) => formsApi.createTemplate(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.forms.templates })
      toast.success('Form template saved.')
    },
    onError: (error: unknown) => {
      logger.error('Create form template failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const submit = useMutation({
    mutationFn: ({ templateId, answers }: { templateId: number; answers: Record<string, string> }) =>
      formsApi.submit(templateId, answers),
    onSuccess: async (_saved, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.forms.responses(variables.templateId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.forms.sharedResults(variables.templateId) }),
      ])
      toast.success('Response submitted.')
    },
    onError: (error: unknown) => {
      logger.error('Submit form failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { createTemplate, submit }
}
