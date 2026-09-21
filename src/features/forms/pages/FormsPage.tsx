import { Copy, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { FormSection } from '@/components/forms/FormSection'
import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { collectAnswers, DynamicFormFields } from '@/features/forms/components/DynamicFormFields'
import { useFormMutations, useFormResponses, useFormTemplates } from '@/features/forms/hooks/useForms'
import {
  FORM_FIELD_TYPES,
  formFieldTypeLabel,
  parseAnswerData,
  parseFieldDefinitions,
  type FormFieldDefinition,
  type FormResponse,
  type FormTemplate,
  type FormTemplateWritePayload,
} from '@/features/forms/types/form.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDateTime } from '@/lib/format'
import { paths } from '@/routes/paths'

const TABS = ['templates', 'fill', 'responses'] as const
type FormsTab = (typeof TABS)[number]

function isTab(value: string | null): value is FormsTab {
  return TABS.some((tab) => tab === value)
}

function emptyField(): FormFieldDefinition {
  return { label: '', type: 'text' }
}

export function FormsPage(): ReactNode {
  useDocumentTitle('Forms')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'forms:write')
  const [params, setParams] = useSearchParams()
  const tab: FormsTab = isTab(params.get('tab')) ? (params.get('tab') as FormsTab) : 'templates'
  const selectedId = Number(params.get('id')) || null

  const setTab = (value: string, id?: number) => {
    const next = new URLSearchParams()
    next.set('tab', value)
    if (id) next.set('id', String(id))
    setParams(next, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Forms"
        description="Build a template, share a public link, collect responses as a JSON string, and review submissions."
      />
      <Tabs value={tab} onValueChange={(value) => (selectedId ? setTab(value, selectedId) : setTab(value))}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="fill">Fill</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
        </TabsList>
        <TabsContent value="templates">
          <TemplatesPanel canWrite={canWrite} onOpen={(id) => setTab('fill', id)} />
        </TabsContent>
        <TabsContent value="fill">
          <FillPanel selectedId={selectedId} onSelect={(id) => setTab('fill', id)} />
        </TabsContent>
        <TabsContent value="responses">
          <ResponsesPanel selectedId={selectedId} onSelect={(id) => setTab('responses', id)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TemplatesPanel({
  canWrite,
  onOpen,
}: {
  canWrite: boolean
  onOpen: (id: number) => void
}): ReactNode {
  const templates = useFormTemplates()
  const { createTemplate } = useFormMutations()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FormFieldDefinition[]>([emptyField()])
  const [page, setPage] = useState(1)

  const handleSave = (event: FormEvent) => {
    event.preventDefault()
    if (!canWrite) return
    if (!name.trim()) {
      toast.error('Give the form a name.')
      return
    }
    const cleaned = fields
      .map((field) => {
        const label = field.label.trim()
        if (!label) return null
        const next: FormFieldDefinition = { label, type: field.type || 'text' }
        if (field.type === 'select' && field.options && field.options.length > 0) {
          next.options = field.options
        }
        return next
      })
      .filter((item): item is FormFieldDefinition => item != null)
    if (cleaned.length === 0) {
      toast.error('Add at least one field with a label.')
      return
    }
    const body: FormTemplateWritePayload = {
      name: name.trim(),
      fieldDefinitions: JSON.stringify(cleaned),
    }
    if (description.trim()) body.description = description.trim()
    createTemplate.mutate(body, {
      onSuccess: () => {
        setName('')
        setDescription('')
        setFields([emptyField()])
      },
    })
  }

  const columns: Array<DataColumn<FormTemplate>> = [
    { id: 'name', header: 'Name', cell: (row) => row.name || `Form #${row.id}` },
    {
      id: 'fields',
      header: 'Fields',
      cell: (row) => String(parseFieldDefinitions(row.fieldDefinitions).length),
      hideOnMobile: true,
    },
    { id: 'desc', header: 'Description', cell: (row) => displayValue(row.description), hideOnMobile: true },
  ]

  if (templates.isError) {
    return <ErrorState message={toUserMessage(templates.error)} onRetry={() => void templates.refetch()} />
  }

  return (
    <div className="flex flex-col gap-6">
      {canWrite ? (
        <form onSubmit={handleSave}>
          <FormSection title="New template" description="fieldDefinitions is stored as a JSON string of label/type rows.">
            <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
            <TextareaField
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="flex flex-col gap-3 sm:col-span-2">
              {fields.map((field, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_10rem_1fr_auto]">
                  <TextField
                    label="Label"
                    value={field.label}
                    onChange={(event) =>
                      setFields((current) =>
                        current.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)),
                      )
                    }
                  />
                  <SelectField
                    label="Type"
                    value={field.type}
                    onChange={(value) =>
                      setFields((current) => current.map((item, i) => (i === index ? { ...item, type: value } : item)))
                    }
                    options={FORM_FIELD_TYPES.map((item) => ({ value: item, label: formFieldTypeLabel(item) }))}
                    allowEmpty={false}
                  />
                  <TextField
                    label="Options"
                    value={(field.options ?? []).join(', ')}
                    onChange={(event) =>
                      setFields((current) =>
                        current.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                options: event.target.value
                                  .split(',')
                                  .map((part) => part.trim())
                                  .filter(Boolean),
                              }
                            : item,
                        ),
                      )
                    }
                    hint={field.type === 'select' ? 'Comma-separated choices' : 'Used only for dropdowns'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end"
                    onClick={() => setFields((current) => current.filter((_, i) => i !== index))}
                    aria-label="Remove field"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setFields((current) => [...current, emptyField()])}>
                  <Plus />
                  Add field
                </Button>
                <Button type="submit" isLoading={createTemplate.isPending} loadingLabel="Saving">
                  Save template
                </Button>
              </div>
            </div>
          </FormSection>
        </form>
      ) : (
        <Alert>
          <AlertTitle>View only</AlertTitle>
          <AlertDescription>Creating templates is limited to admin and head roles in this UI.</AlertDescription>
        </Alert>
      )}

      {templates.data?.length ? (
        <DataTable
          columns={columns}
          rows={templates.data}
          getRowId={(row) => row.id}
          page={page}
          pageSize={10}
          total={templates.data.length}
          onPageChange={setPage}
          onRowClick={(row) => onOpen(row.id)}
          rowAriaLabel={(row) => `Open ${row.name || `form ${row.id}`}`}
          mobileCard={(row) => (
            <div>
              <p className="type-heading">{row.name || `Form #${row.id}`}</p>
              <p className="type-caption text-muted-foreground">
                {parseFieldDefinitions(row.fieldDefinitions).length} fields
              </p>
            </div>
          )}
        />
      ) : (
        <EmptyState title="No templates yet" description="Save a template to start collecting responses." />
      )}
    </div>
  )
}

function FillPanel({
  selectedId,
  onSelect,
}: {
  selectedId: number | null
  onSelect: (id: number) => void
}): ReactNode {
  const templates = useFormTemplates()
  const { submit } = useFormMutations()
  const [values, setValues] = useState<Record<string, string>>({})
  const selected = (templates.data ?? []).find((item) => item.id === selectedId) ?? null
  const fields = parseFieldDefinitions(selected?.fieldDefinitions)

  const handleSubmit = (event: FormEvent) => {
    if (!selected) return
    const answers = collectAnswers(event, fields, values)
    if (!answers) {
      toast.error('Fill every field before submitting.')
      return
    }
    submit.mutate(
      { templateId: selected.id, answers },
      { onSuccess: () => setValues({}) },
    )
  }

  const shareUrl = selected ? `${window.location.origin}${paths.formShared(selected.id)}` : ''

  return (
    <div className="flex flex-col gap-6">
      <SelectField
        label="Template"
        value={selectedId ? String(selectedId) : ''}
        onChange={(value) => onSelect(Number(value))}
        options={(templates.data ?? []).map((item) => ({
          value: String(item.id),
          label: item.name || `Form #${item.id}`,
        }))}
        allowEmpty={false}
        placeholder="Select a form"
      />
      {!selected ? (
        <EmptyState title="Pick a template" description="Share links work without signing in." />
      ) : (
        <form onSubmit={handleSubmit}>
          <FormSection
            title={selected.name || `Form #${selected.id}`}
            {...(selected.description ? { description: selected.description } : {})}
          >
            <DynamicFormFields
              fields={fields}
              values={values}
              onChange={(label, value) => setValues((current) => ({ ...current, [label]: value }))}
            />
            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(shareUrl)
                  toast.success('Public form link copied.')
                }}
              >
                <Copy />
                Copy share link
              </Button>
              <Button type="submit" isLoading={submit.isPending} loadingLabel="Submitting">
                Submit response
              </Button>
            </div>
          </FormSection>
        </form>
      )}
    </div>
  )
}

function ResponsesPanel({
  selectedId,
  onSelect,
}: {
  selectedId: number | null
  onSelect: (id: number) => void
}): ReactNode {
  const templates = useFormTemplates()
  const responses = useFormResponses(selectedId)
  const [page, setPage] = useState(1)
  const selected = (templates.data ?? []).find((item) => item.id === selectedId) ?? null
  const fields = parseFieldDefinitions(selected?.fieldDefinitions)

  const columns: Array<DataColumn<FormResponse>> = useMemo(() => {
    const base: Array<DataColumn<FormResponse>> = [
      { id: 'when', header: 'Submitted', cell: (row) => formatDateTime(row.submissionDate) },
      { id: 'who', header: 'By', cell: (row) => displayValue(row.submittedBy), hideOnMobile: true },
    ]
    for (const field of fields.slice(0, 3)) {
      base.push({
        id: field.label,
        header: field.label,
        cell: (row) => displayValue(parseAnswerData(row.answerData)[field.label]),
        hideOnMobile: true,
      })
    }
    return base
  }, [fields])

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label="Template"
        value={selectedId ? String(selectedId) : ''}
        onChange={(value) => onSelect(Number(value))}
        options={(templates.data ?? []).map((item) => ({
          value: String(item.id),
          label: item.name || `Form #${item.id}`,
        }))}
        allowEmpty={false}
        placeholder="Select a form"
      />
      {selected ? (
        <p className="type-caption text-muted-foreground">
          Public results: {window.location.origin}
          {paths.formSharedResults(selected.id)}
        </p>
      ) : null}
      {responses.isError ? (
        <ErrorState message={toUserMessage(responses.error)} onRetry={() => void responses.refetch()} />
      ) : !selectedId ? (
        <EmptyState title="Pick a template" description="Responses are listed per form." />
      ) : (responses.data ?? []).length === 0 && !responses.isLoading ? (
        <EmptyState title="No responses yet" description="Share the public fill link, then refresh this tab." />
      ) : (
        <DataTable
          columns={columns}
          rows={responses.data ?? []}
          getRowId={(row) => row.id}
          isLoading={responses.isLoading}
          page={page}
          pageSize={10}
          total={(responses.data ?? []).length}
          onPageChange={setPage}
          mobileCard={(row) => {
            const answers = parseAnswerData(row.answerData)
            return (
              <div className="flex flex-col gap-1">
                <p className="type-heading">{formatDateTime(row.submissionDate)}</p>
                {fields.slice(0, 3).map((field) => (
                  <p key={field.label} className="type-caption text-muted-foreground">
                    {field.label}: {displayValue(answers[field.label])}
                  </p>
                ))}
              </div>
            )
          }}
        />
      )}
    </div>
  )
}
