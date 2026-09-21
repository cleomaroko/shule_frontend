import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { DiraWordmark } from '@/components/branding/DiraWordmark'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { FormSection } from '@/components/forms/FormSection'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { collectAnswers, DynamicFormFields } from '@/features/forms/components/DynamicFormFields'
import { useFormMutations, useSharedForm, useSharedFormResults } from '@/features/forms/hooks/useForms'
import { parseAnswerData, parseFieldDefinitions } from '@/features/forms/types/form.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDateTime } from '@/lib/format'
import { paths } from '@/routes/paths'

function templateIdFromParams(raw: string | undefined): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

function PublicShell({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <Link to={paths.login} className="inline-flex items-center">
          <DiraWordmark size="sm" />
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}

export function SharedFormPage(): ReactNode {
  const templateId = templateIdFromParams(useParams().templateId)
  const form = useSharedForm(templateId)
  const { submit } = useFormMutations()
  const [values, setValues] = useState<Record<string, string>>({})
  const fields = parseFieldDefinitions(form.data?.fieldDefinitions)
  useDocumentTitle(form.data?.name || 'Shared form')

  const handleSubmit = (event: FormEvent) => {
    if (!templateId) return
    const answers = collectAnswers(event, fields, values)
    if (!answers) {
      toast.error('Fill every field before submitting.')
      return
    }
    submit.mutate(
      { templateId, answers },
      { onSuccess: () => setValues({}) },
    )
  }

  if (templateId == null) {
    return (
      <PublicShell>
        <EmptyState title="Invalid form link" description="The shared form id is missing or not a number." />
      </PublicShell>
    )
  }

  if (form.isError) {
    return (
      <PublicShell>
        <ErrorState message={toUserMessage(form.error)} onRetry={() => void form.refetch()} />
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <form onSubmit={handleSubmit}>
        <FormSection
          title={form.data?.name || 'Shared form'}
          description={form.data?.description || 'This form can be filled without signing in.'}
        >
          <DynamicFormFields
            fields={fields}
            values={values}
            onChange={(label, value) => setValues((current) => ({ ...current, [label]: value }))}
            disabled={form.isLoading}
          />
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="secondary" asChild>
              <Link to={paths.formSharedResults(templateId)}>View results</Link>
            </Button>
            <Button type="submit" isLoading={submit.isPending} loadingLabel="Submitting" disabled={form.isLoading}>
              Submit
            </Button>
          </div>
        </FormSection>
      </form>
    </PublicShell>
  )
}

export function SharedFormResultsPage(): ReactNode {
  const templateId = templateIdFromParams(useParams().templateId)
  const form = useSharedForm(templateId)
  const results = useSharedFormResults(templateId)
  const fields = parseFieldDefinitions(form.data?.fieldDefinitions)
  useDocumentTitle(form.data?.name ? `${form.data.name} results` : 'Form results')

  if (templateId == null) {
    return (
      <PublicShell>
        <EmptyState title="Invalid form link" description="The shared form id is missing or not a number." />
      </PublicShell>
    )
  }

  if (results.isError) {
    return (
      <PublicShell>
        <ErrorState message={toUserMessage(results.error)} onRetry={() => void results.refetch()} />
      </PublicShell>
    )
  }

  const rows = results.data ?? []

  return (
    <PublicShell>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="type-page-title">{form.data?.name || 'Form results'}</h1>
            <p className="type-caption mt-1 text-muted-foreground">Public submissions for this template.</p>
          </div>
          <Button variant="secondary" asChild>
            <Link to={paths.formShared(templateId)}>Fill this form</Link>
          </Button>
        </div>
        {rows.length === 0 && !results.isLoading ? (
          <EmptyState title="No responses yet" description="Submissions will appear here as they arrive." />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => {
              const answers = parseAnswerData(row.answerData)
              return (
                <li key={row.id} className="rounded-2xl border border-border bg-card p-4">
                  <p className="type-caption text-muted-foreground">{formatDateTime(row.submissionDate)}</p>
                  <dl className="mt-2 grid gap-2">
                    {fields.map((field) => (
                      <div key={field.label}>
                        <dt className="type-caption text-muted-foreground">{field.label}</dt>
                        <dd className="type-body">{displayValue(answers[field.label])}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </PublicShell>
  )
}
