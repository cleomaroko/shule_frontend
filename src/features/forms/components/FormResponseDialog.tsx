import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { parseAnswerData, type FormFieldDefinition, type FormResponse } from '@/features/forms/types/form.types'
import { displayValue, formatDateTime } from '@/lib/format'

export interface FormResponseDialogProps {
  response: FormResponse | null
  templateName: string
  fields: FormFieldDefinition[]
  onOpenChange: (open: boolean) => void
}

export function FormResponseDialog({
  response,
  templateName,
  fields,
  onOpenChange,
}: FormResponseDialogProps): ReactNode {
  const answers = parseAnswerData(response?.answerData)
  const known = new Set(fields.map((field) => field.label))
  const extra = Object.keys(answers).filter((key) => !known.has(key))

  return (
    <Dialog open={response !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle>{templateName || 'Response'}</DialogTitle>
          <DialogDescription>
            {response
              ? `${formatDateTime(response.submissionDate)} · ${displayValue(response.submittedBy)}`
              : 'Submitted answers'}
          </DialogDescription>
        </DialogHeader>
        {response ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
            <dl className="flex flex-col gap-3">
              {fields.map((field) => (
                <div key={field.label} className="min-w-0">
                  <dt className="type-caption text-muted-foreground">{field.label}</dt>
                  <dd className="type-body mt-0.5 whitespace-pre-wrap break-words">{displayValue(answers[field.label])}</dd>
                </div>
              ))}
              {extra.map((key) => (
                <div key={key} className="min-w-0">
                  <dt className="type-caption text-muted-foreground">{key}</dt>
                  <dd className="type-body mt-0.5 whitespace-pre-wrap break-words">{displayValue(answers[key])}</dd>
                </div>
              ))}
              {fields.length === 0 && extra.length === 0 ? (
                <p className="type-body text-muted-foreground">This submission has no answers stored.</p>
              ) : null}
            </dl>
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
