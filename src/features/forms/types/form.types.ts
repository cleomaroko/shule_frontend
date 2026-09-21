export const FORM_FIELD_TYPES = ['text', 'number', 'textarea', 'select'] as const
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number]

/** One entry inside `FormTemplate.fieldDefinitions` (JSON string). */
export interface FormFieldDefinition {
  label: string
  type: FormFieldType | string
  options?: string[]
}

/** `com.lyrt.shule.forms.FormTemplate` */
export interface FormTemplate {
  id: number
  name?: string | null
  description?: string | null
  fieldDefinitions?: string | null
}

export interface FormTemplateWritePayload {
  name: string
  description?: string
  fieldDefinitions: string
}

/** `com.lyrt.shule.forms.FormResponse` */
export interface FormResponse {
  id: number
  formTemplate?: Pick<FormTemplate, 'id' | 'name'> | null
  submittedBy?: string | null
  submissionDate?: string | null
  answerData?: string | null
}

export function parseFieldDefinitions(raw: string | null | undefined): FormFieldDefinition[] {
  if (!raw?.trim()) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item): FormFieldDefinition | null => {
        if (!item || typeof item !== 'object') return null
        const row = item as { label?: unknown; type?: unknown; options?: unknown }
        const label = typeof row.label === 'string' ? row.label.trim() : ''
        if (!label) return null
        const type = typeof row.type === 'string' && row.type.trim() ? row.type.trim() : 'text'
        const next: FormFieldDefinition = { label, type }
        if (Array.isArray(row.options)) {
          const options = row.options.filter((value): value is string => typeof value === 'string' && value.trim() !== '')
          if (options.length > 0) next.options = options
        }
        return next
      })
      .filter((item): item is FormFieldDefinition => item != null)
  } catch {
    return []
  }
}

export function parseAnswerData(raw: string | null | undefined): Record<string, string> {
  if (!raw?.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value == null) continue
      out[key] = String(value)
    }
    return out
  } catch {
    return {}
  }
}

export function formFieldTypeLabel(type: string): string {
  switch (type) {
    case 'number':
      return 'Number'
    case 'textarea':
      return 'Long text'
    case 'select':
      return 'Dropdown'
    default:
      return 'Text'
  }
}
