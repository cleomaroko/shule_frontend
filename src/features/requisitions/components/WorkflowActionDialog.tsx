import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  asMoney,
  formatKes,
  type Requisition,
  type WorkflowActionPayload,
} from '@/features/requisitions/types/requisition.types'

export type WorkflowKind = 'review' | 'approve' | 'reject'

export interface WorkflowActionDialogProps {
  kind: WorkflowKind | null
  requisition: Requisition | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (body: WorkflowActionPayload) => void
}

const COPY: Record<WorkflowKind, { title: string; description: string; confirm: string }> = {
  review: {
    title: 'Review requisition',
    description: 'Marks a submitted requisition as reviewed. Add a comment for the approver.',
    confirm: 'Mark reviewed',
  },
  approve: {
    title: 'Approve requisition',
    description: 'If you leave the amount blank, the backend uses the estimated total.',
    confirm: 'Approve',
  },
  reject: {
    title: 'Reject requisition',
    description: 'A reason is stored on the requisition and shown to the requester.',
    confirm: 'Reject',
  },
}

export function WorkflowActionDialog({
  kind,
  requisition,
  isSaving,
  onOpenChange,
  onSubmit,
}: WorkflowActionDialogProps): ReactNode {
  const [comment, setComment] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (kind && requisition) {
      setComment('')
      setAmount(requisition.totalEstimatedAmount != null ? String(asMoney(requisition.totalEstimatedAmount)) : '')
      setError('')
    }
  }, [kind, requisition])

  if (!kind || !requisition) return null

  const copy = COPY[kind]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = comment.trim()
    if (kind === 'reject' && !trimmed) {
      setError('A rejection reason is required.')
      return
    }
    setError('')
    if (kind === 'reject') {
      onSubmit({ reason: trimmed })
      return
    }
    const body: WorkflowActionPayload = {}
    if (trimmed) body.comment = trimmed
    if (kind === 'approve') {
      const parsed = amount.trim() ? Number(amount) : undefined
      if (amount.trim() && (parsed === undefined || !Number.isFinite(parsed) || parsed < 0)) {
        setError('Approved amount must be a valid number.')
        return
      }
      if (parsed !== undefined) body.approvedAmount = parsed
    }
    onSubmit(body)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {requisition.requisitionNumber ?? `Requisition ${requisition.id}`}. {copy.description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {kind === 'approve' ? (
            <TextField
              label="Approved amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              hint={`Estimated ${formatKes(requisition.totalEstimatedAmount)}`}
            />
          ) : null}
          <TextareaField
            label={kind === 'reject' ? 'Reason' : 'Comment'}
            name="workflow-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
          />
          {error ? <p className="type-caption text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={kind === 'reject' ? 'destructive' : 'primary'} disabled={isSaving}>
              {isSaving ? 'Saving…' : copy.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
