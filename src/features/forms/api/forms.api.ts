import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { FormResponse, FormTemplate, FormTemplateWritePayload } from '@/features/forms/types/form.types'

export const formsApi = {
  listTemplates: () => api.get<FormTemplate[]>(endpoints.forms.templates).then((r) => r.data ?? []),

  createTemplate: (body: FormTemplateWritePayload) =>
    api.post<FormTemplate>(endpoints.forms.templates, body).then((r) => r.data as FormTemplate),

  /** Body is a JSON string. Axios serializes the string as a JSON string value. */
  submit: (templateId: number, answers: Record<string, string>) =>
    api.post<FormResponse>(endpoints.forms.submit(templateId), JSON.stringify(answers)).then((r) => r.data as FormResponse),

  responses: (templateId: number) =>
    api.get<FormResponse[]>(endpoints.forms.responses(templateId)).then((r) => r.data ?? []),

  shared: (templateId: number) =>
    api.get<FormTemplate>(endpoints.forms.shared(templateId)).then((r) => r.data as FormTemplate),

  sharedResults: (templateId: number) =>
    api.get<FormResponse[]>(endpoints.forms.sharedResults(templateId)).then((r) => r.data ?? []),
}
