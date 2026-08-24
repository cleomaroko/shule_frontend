import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { GoogleDrivePhotoField } from '@/components/forms/GoogleDrivePhotoField'
import { SelectField } from '@/components/forms/SelectField'
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
import type { Campus } from '@/features/lookups/lookups.types'
import {
  TRANSACTION_TYPES,
  defaultTermId,
  termLabel,
  transactionTypeLabel,
  type StockLog,
  type StockLogCreatePayload,
  type StockLogUpdatePayload,
  type StoreItem,
  type TermRef,
  type TransactionType,
} from '@/features/store/types/store.types'
import { displayValue } from '@/lib/format'

export interface StoreLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: StockLog | null
  items: StoreItem[]
  campuses: Campus[]
  terms: TermRef[]
  termsLoading?: boolean
  isSaving: boolean
  onCreate: (body: StockLogCreatePayload) => void
  onUpdate: (body: StockLogUpdatePayload) => void
}

interface LogFormState {
  type: TransactionType
  itemId: string
  campusId: string
  termId: string
  quantity: string
  logDate: string
  receiptLink: string
}

function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function emptyForm(items: StoreItem[], terms: TermRef[]): LogFormState {
  return {
    type: 'ADDITION',
    itemId: items[0] ? String(items[0].id) : '',
    campusId: '',
    termId: defaultTermId(terms),
    quantity: '',
    logDate: todayIso(),
    receiptLink: '',
  }
}

function formFromLog(log: StockLog): LogFormState {
  return {
    type: log.type ?? 'ADDITION',
    itemId: log.item?.id ? String(log.item.id) : '',
    campusId: log.campus?.id ? String(log.campus.id) : '',
    termId: log.term?.id ? String(log.term.id) : '',
    quantity: log.quantity == null ? '' : String(log.quantity),
    logDate: log.logDate ?? todayIso(),
    receiptLink: log.receiptLink ?? '',
  }
}

function needsCampus(type: TransactionType): boolean {
  return type === 'TRANSFER' || type === 'CONSUMPTION'
}

function typeHint(type: TransactionType): string {
  switch (type) {
    case 'ADDITION':
      return 'Stock arriving at the main store. Campus is omitted.'
    case 'TRANSFER':
      return 'Stock issued from the main store to a campus.'
    case 'CONSUMPTION':
      return 'Daily usage at a campus store (typically Monday–Friday).'
    case 'BALANCE_BF':
      return 'Opening balance for an item in a term. One record per item, campus, and term.'
  }
}

export function StoreLogDialog({
  open,
  onOpenChange,
  editing,
  items,
  campuses,
  terms,
  termsLoading = false,
  isSaving,
  onCreate,
  onUpdate,
}: StoreLogDialogProps): ReactNode {
  const [form, setForm] = useState<LogFormState>(() => emptyForm(items, terms))
  const isEdit = editing !== null

  useEffect(() => {
    if (!open) return
    setForm(editing ? formFromLog(editing) : emptyForm(items, terms))
  }, [editing, items, open, terms])

  const setField = <K extends keyof LogFormState>(key: K, value: LogFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const campusRequired = needsCampus(form.type)
  const termOptions = useMemo(
    () => terms.map((term) => ({ value: String(term.id), label: termLabel(term) })),
    [terms],
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const quantity = Number(form.quantity)
    if (!Number.isFinite(quantity) || !form.logDate) return

    if (isEdit) {
      onUpdate({
        quantity,
        logDate: form.logDate,
        receiptLink: form.receiptLink.trim() || null,
      })
      return
    }

    const itemId = Number(form.itemId)
    const termId = Number(form.termId)
    if (!itemId || !termId) return
    if (campusRequired && !Number(form.campusId)) return

    const body: StockLogCreatePayload = {
      item: { id: itemId },
      term: { id: termId },
      quantity,
      type: form.type,
      logDate: form.logDate,
    }
    const campusId = Number(form.campusId)
    if (campusId) body.campus = { id: campusId }
    const receipt = form.receiptLink.trim()
    if (receipt) body.receiptLink = receipt
    onCreate(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>{isEdit ? 'Correct stock record' : 'Record transaction'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Only quantity, date, and receipt can be changed. Type, item, campus, and term stay as recorded.'
                : typeHint(form.type)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            {isEdit ? (
              <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3 type-caption">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium text-foreground">{transactionTypeLabel(editing.type)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Item</dt>
                  <dd className="font-medium text-foreground">{displayValue(editing.item?.name)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Campus</dt>
                  <dd className="font-medium text-foreground">{editing.campus?.name ?? 'Main store'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Term</dt>
                  <dd className="font-medium text-foreground">{termLabel(editing.term)}</dd>
                </div>
              </dl>
            ) : (
              <>
                <SelectField
                  label="Type"
                  value={form.type}
                  onChange={(value) => setField('type', (value as TransactionType) || 'ADDITION')}
                  options={TRANSACTION_TYPES.map((type) => ({
                    value: type,
                    label: transactionTypeLabel(type),
                  }))}
                  allowEmpty={false}
                />
                <SelectField
                  label="Item"
                  value={form.itemId}
                  onChange={(value) => setField('itemId', value)}
                  options={items.map((item) => ({
                    value: String(item.id),
                    label: [item.name, item.unit?.name].filter(Boolean).join(' · '),
                  }))}
                  placeholder="Select item"
                  allowEmpty={false}
                />
                {form.type === 'ADDITION' ? (
                  <p className="type-caption text-muted-foreground">
                    Addition is recorded against the main store. Campus is left unset.
                  </p>
                ) : (
                  <SelectField
                    label="Campus"
                    value={form.campusId}
                    onChange={(value) => setField('campusId', value)}
                    options={campuses.map((campus) => ({ value: String(campus.id), label: campus.name }))}
                    placeholder="Select campus"
                    allowEmpty={!campusRequired}
                    emptyLabel={form.type === 'BALANCE_BF' ? 'Main store' : 'Not set'}
                    hint={campusRequired ? 'Required for transfers and campus usage.' : 'Optional for Balance B/F.'}
                  />
                )}
                {terms.length > 0 || termsLoading ? (
                  <SelectField
                    label="Term"
                    value={form.termId}
                    onChange={(value) => setField('termId', value)}
                    options={termOptions}
                    placeholder={termsLoading ? 'Loading terms…' : 'Select term'}
                    hint="Loaded from the academic calendar."
                    allowEmpty={false}
                    disabled={termsLoading}
                  />
                ) : (
                  <TextField
                    label="Term ID"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={form.termId}
                    onChange={(event) => setField('termId', event.target.value)}
                    hint="No terms in the academic calendar yet. Add them under System → Calendar, or enter the numeric term id."
                    required
                  />
                )}
              </>
            )}

            <TextField
              label="Quantity"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.quantity}
              onChange={(event) => setField('quantity', event.target.value)}
              required
            />
            <TextField
              label="Date"
              type="date"
              value={form.logDate}
              onChange={(event) => setField('logDate', event.target.value)}
              hint="Use YYYY-MM-DD. Consumption is typically one weekday at a time."
              required
            />
            <GoogleDrivePhotoField
              label="Receipt"
              value={form.receiptLink}
              onChange={(url) => setField('receiptLink', url)}
              hint="Optional. Used for main-store additions; a Google Drive image link is stored."
            />
          </div>

          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              {isEdit ? 'Save correction' : 'Record transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
