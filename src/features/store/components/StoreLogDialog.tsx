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
import type { Department } from '@/features/lookups/lookups.types'
import type { Learner } from '@/features/learners/types/learner.types'
import type { Staff } from '@/features/staff/types/staff.types'
import type { Supplier } from '@/features/suppliers/types/supplier.types'
import {
  TRANSACTION_TYPES,
  defaultTermId,
  storeIsMain,
  termLabel,
  transactionTypeLabel,
  type StockLog,
  type StockLogCreatePayload,
  type StockLogUpdatePayload,
  type StoreItem,
  type StoreLocation,
  type TermRef,
  type TransactionType,
} from '@/features/store/types/store.types'
import { displayValue, formatPersonName } from '@/lib/format'

export interface StoreLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: StockLog | null
  items: StoreItem[]
  stores: StoreLocation[]
  terms: TermRef[]
  termsLoading?: boolean
  suppliers: Supplier[]
  staff: Staff[]
  learners: Learner[]
  departments: Department[]
  isSaving: boolean
  onCreate: (body: StockLogCreatePayload) => void
  onUpdate: (body: StockLogUpdatePayload) => void
}

interface LogFormState {
  type: TransactionType
  itemId: string
  sourceStoreId: string
  destinationStoreId: string
  termId: string
  quantity: string
  logDate: string
  receiptLink: string
  supplierId: string
  issuedToKind: 'none' | 'staff' | 'learner' | 'department'
  issuedToId: string
}

function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function emptyForm(items: StoreItem[], stores: StoreLocation[], terms: TermRef[]): LogFormState {
  const main = stores.find(storeIsMain) ?? stores[0]
  return {
    type: 'ADDITION',
    itemId: items[0] ? String(items[0].id) : '',
    sourceStoreId: main ? String(main.id) : '',
    destinationStoreId: '',
    termId: defaultTermId(terms),
    quantity: '',
    logDate: todayIso(),
    receiptLink: '',
    supplierId: '',
    issuedToKind: 'none',
    issuedToId: '',
  }
}

function formFromLog(log: StockLog): LogFormState {
  let issuedToKind: LogFormState['issuedToKind'] = 'none'
  let issuedToId = ''
  if (log.issuedToStaff?.id) {
    issuedToKind = 'staff'
    issuedToId = String(log.issuedToStaff.id)
  } else if (log.issuedToLearner?.id) {
    issuedToKind = 'learner'
    issuedToId = String(log.issuedToLearner.id)
  } else if (log.issuedToDept?.id) {
    issuedToKind = 'department'
    issuedToId = String(log.issuedToDept.id)
  }
  return {
    type: log.type ?? 'ADDITION',
    itemId: log.item?.id ? String(log.item.id) : '',
    sourceStoreId: log.sourceStore?.id ? String(log.sourceStore.id) : '',
    destinationStoreId: log.destinationStore?.id ? String(log.destinationStore.id) : '',
    termId: log.term?.id ? String(log.term.id) : '',
    quantity: log.quantity == null ? '' : String(log.quantity),
    logDate: log.logDate ?? todayIso(),
    receiptLink: log.receiptLink ?? '',
    supplierId: log.supplier?.id ? String(log.supplier.id) : '',
    issuedToKind,
    issuedToId,
  }
}

function typeHint(type: TransactionType): string {
  switch (type) {
    case 'ADDITION':
      return 'Stock arriving from a supplier into a store, usually the main store.'
    case 'TRANSFER':
      return 'Move stock from a source store (hub) to a destination store (campus).'
    case 'CONSUMPTION':
      return 'Issue stock from a store to a learner, staff member, or department.'
    case 'BALANCE_BF':
      return 'Opening balance for an item in a store and term. One record per item, store, and term.'
  }
}

export function StoreLogDialog({
  open,
  onOpenChange,
  editing,
  items,
  stores,
  terms,
  termsLoading = false,
  suppliers,
  staff,
  learners,
  departments,
  isSaving,
  onCreate,
  onUpdate,
}: StoreLogDialogProps): ReactNode {
  const [form, setForm] = useState<LogFormState>(() => emptyForm(items, stores, terms))
  const isEdit = editing !== null

  useEffect(() => {
    if (!open) return
    setForm(editing ? formFromLog(editing) : emptyForm(items, stores, terms))
  }, [editing, items, open, stores, terms])

  const setField = <K extends keyof LogFormState>(key: K, value: LogFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

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
    const sourceStoreId = Number(form.sourceStoreId)
    if (!itemId || !sourceStoreId) return
    if (form.type === 'BALANCE_BF' && !Number(form.termId)) return
    if (form.type === 'TRANSFER' && !Number(form.destinationStoreId)) return
    if (form.type === 'ADDITION' && !Number(form.supplierId)) return

    const body: StockLogCreatePayload = {
      item: { id: itemId },
      sourceStore: { id: sourceStoreId },
      quantity,
      type: form.type,
      logDate: form.logDate,
    }
    const termId = Number(form.termId)
    if (termId) body.term = { id: termId }
    const destinationId = Number(form.destinationStoreId)
    if (form.type === 'TRANSFER' && destinationId) body.destinationStore = { id: destinationId }
    const supplierId = Number(form.supplierId)
    if (form.type === 'ADDITION' && supplierId) body.supplier = { id: supplierId }
    if (form.type === 'CONSUMPTION' && form.issuedToKind !== 'none') {
      const issuedId = Number(form.issuedToId)
      if (issuedId && form.issuedToKind === 'staff') body.issuedToStaff = { id: issuedId }
      if (issuedId && form.issuedToKind === 'learner') body.issuedToLearner = { id: issuedId }
      if (issuedId && form.issuedToKind === 'department') body.issuedToDept = { id: issuedId }
    }
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
                ? 'Only quantity, date, and receipt can be changed. Type, item, and stores stay as recorded.'
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
                  <dt className="text-muted-foreground">From</dt>
                  <dd className="font-medium text-foreground">{displayValue(editing.sourceStore?.name)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">To</dt>
                  <dd className="font-medium text-foreground">{displayValue(editing.destinationStore?.name)}</dd>
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
                <SelectField
                  label={form.type === 'TRANSFER' ? 'Source store' : 'Store'}
                  value={form.sourceStoreId}
                  onChange={(value) => setField('sourceStoreId', value)}
                  options={stores.map((store) => ({
                    value: String(store.id),
                    label: storeIsMain(store) ? `${store.name} (main)` : store.name,
                  }))}
                  placeholder={stores.length ? 'Select store' : 'No stores available'}
                  emptyMessage="No stores available"
                  allowEmpty={false}
                />
                {form.type === 'TRANSFER' ? (
                  <SelectField
                    label="Destination store"
                    value={form.destinationStoreId}
                    onChange={(value) => setField('destinationStoreId', value)}
                    options={stores
                      .filter((store) => String(store.id) !== form.sourceStoreId)
                      .map((store) => ({
                        value: String(store.id),
                        label: store.name,
                      }))}
                    placeholder="Select destination"
                    allowEmpty={false}
                  />
                ) : null}
                {form.type === 'ADDITION' ? (
                  <SelectField
                    label="Supplier"
                    value={form.supplierId}
                    onChange={(value) => setField('supplierId', value)}
                    options={suppliers.map((item) => ({ value: String(item.id), label: item.name }))}
                    placeholder={suppliers.length ? 'Select supplier' : 'No suppliers available'}
                    emptyMessage="No suppliers available"
                    allowEmpty={false}
                  />
                ) : null}
                {form.type === 'CONSUMPTION' ? (
                  <>
                    <SelectField
                      label="Issued to"
                      value={form.issuedToKind}
                      onChange={(value) => {
                        setForm((current) => ({
                          ...current,
                          issuedToKind: (value as LogFormState['issuedToKind']) || 'none',
                          issuedToId: '',
                        }))
                      }}
                      options={[
                        { value: 'staff', label: 'Staff' },
                        { value: 'learner', label: 'Learner' },
                        { value: 'department', label: 'Department' },
                      ]}
                      emptyLabel="Not linked"
                    />
                    {form.issuedToKind === 'staff' ? (
                      <SelectField
                        label="Staff member"
                        value={form.issuedToId}
                        onChange={(value) => setField('issuedToId', value)}
                        options={staff.map((item) => ({
                          value: String(item.id),
                          label: formatPersonName(item),
                        }))}
                        placeholder="Select staff"
                        allowEmpty={false}
                      />
                    ) : null}
                    {form.issuedToKind === 'learner' ? (
                      <SelectField
                        label="Learner"
                        value={form.issuedToId}
                        onChange={(value) => setField('issuedToId', value)}
                        options={learners.map((item) => ({
                          value: String(item.id),
                          label: formatPersonName(item),
                        }))}
                        placeholder="Select learner"
                        allowEmpty={false}
                      />
                    ) : null}
                    {form.issuedToKind === 'department' ? (
                      <SelectField
                        label="Department"
                        value={form.issuedToId}
                        onChange={(value) => setField('issuedToId', value)}
                        options={departments.map((item) => ({
                          value: String(item.id),
                          label: item.name,
                        }))}
                        placeholder="Select department"
                        allowEmpty={false}
                      />
                    ) : null}
                  </>
                ) : null}
                {form.type === 'BALANCE_BF' || terms.length > 0 ? (
                  terms.length > 0 || termsLoading ? (
                    <SelectField
                      label="Term"
                      value={form.termId}
                      onChange={(value) => setField('termId', value)}
                      options={termOptions}
                      placeholder={termsLoading ? 'Loading terms…' : 'Select term'}
                      hint={form.type === 'BALANCE_BF' ? 'Required. One opening balance per item, store, and term.' : 'Optional.'}
                      allowEmpty={form.type !== 'BALANCE_BF'}
                      emptyLabel="Not set"
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
                      hint="No terms in the academic calendar yet."
                      required={form.type === 'BALANCE_BF'}
                    />
                  )
                ) : null}
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
              required
            />
            <GoogleDrivePhotoField
              label="Receipt"
              value={form.receiptLink}
              onChange={(url) => setField('receiptLink', url)}
              hint="Optional. Typically used for supplier additions."
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
