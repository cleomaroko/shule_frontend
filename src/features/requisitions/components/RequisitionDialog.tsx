import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { SelectField } from '@/components/forms/SelectField'
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
import type { Campus, Department } from '@/features/lookups/lookups.types'
import {
  FULFILLMENT_SOURCES,
  REQUISITION_TYPES,
  asMoney,
  defaultFulfillment,
  fulfillmentLabel,
  formatKes,
  requisitionTypeLabel,
  todayIso,
  type CostCenter,
  type CreateRequisitionPayload,
  type FulfillmentSource,
  type RequisitionType,
} from '@/features/requisitions/types/requisition.types'
import type { ItemUnit, StoreItem, StoreLocation } from '@/features/store/types/store.types'
import type { Supplier } from '@/features/suppliers/types/supplier.types'

export interface RequisitionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  campuses: Campus[]
  departments: Department[]
  costCenters: CostCenter[]
  stores: StoreLocation[]
  items: StoreItem[]
  units: ItemUnit[]
  suppliers: Supplier[]
  onSubmit: (body: CreateRequisitionPayload) => void
}

interface LineForm {
  key: string
  storeItemId: string
  description: string
  quantity: string
  unitId: string
  unitPrice: string
  fulfillmentSource: FulfillmentSource
}

interface FormState {
  requisitionDate: string
  type: RequisitionType
  campusId: string
  departmentId: string
  costCenterId: string
  sourceStoreId: string
  destinationStoreId: string
  supplierId: string
  purpose: string
  documentUrl: string
  lines: LineForm[]
}

function newLine(type: RequisitionType): LineForm {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    storeItemId: '',
    description: '',
    quantity: '1',
    unitId: '',
    unitPrice: '0',
    fulfillmentSource: defaultFulfillment(type),
  }
}

function emptyForm(): FormState {
  const type: RequisitionType = 'PURCHASE_SUPPLIER'
  return {
    requisitionDate: todayIso(),
    type,
    campusId: '',
    departmentId: '',
    costCenterId: '',
    sourceStoreId: '',
    destinationStoreId: '',
    supplierId: '',
    purpose: '',
    documentUrl: '',
    lines: [newLine(type)],
  }
}

function optionalId(value: string): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function lineTotal(line: LineForm): number {
  const qty = Number(line.quantity)
  const price = Number(line.unitPrice)
  if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0
  return qty * price
}

export function RequisitionDialog({
  open,
  onOpenChange,
  isSaving,
  campuses,
  departments,
  costCenters,
  stores,
  items,
  units,
  suppliers,
  onSubmit,
}: RequisitionDialogProps): ReactNode {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')

  const showPrice = form.type !== 'INTERNAL_STORE_TRANSFER'
  const showSourceStore =
    form.type === 'INTERNAL_STORE_TRANSFER' ||
    form.type === 'STORE_ISSUANCE' ||
    form.type === 'MIXED_CAMPUS_EVENT'
  const showDestStore = form.type === 'INTERNAL_STORE_TRANSFER'
  const showSupplier = form.type === 'PURCHASE_SUPPLIER'
  const showFulfillment = form.type === 'MIXED_CAMPUS_EVENT'
  const showStoreItem =
    form.type === 'INTERNAL_STORE_TRANSFER' ||
    form.type === 'STORE_ISSUANCE' ||
    form.type === 'MIXED_CAMPUS_EVENT'

  const estimated = useMemo(
    () => form.lines.reduce((sum, line) => sum + lineTotal(line), 0),
    [form.lines],
  )

  useEffect(() => {
    if (open) {
      setForm(emptyForm())
      setError('')
    }
  }, [open])

  const setType = (value: string) => {
    const type = value as RequisitionType
    setForm((current) => ({
      ...current,
      type,
      sourceStoreId: showSourceFor(type) ? current.sourceStoreId : '',
      destinationStoreId: type === 'INTERNAL_STORE_TRANSFER' ? current.destinationStoreId : '',
      supplierId: type === 'PURCHASE_SUPPLIER' ? current.supplierId : '',
      lines: current.lines.map((line) => ({
        ...line,
        unitPrice: type === 'INTERNAL_STORE_TRANSFER' ? '0' : line.unitPrice,
        fulfillmentSource: type === 'MIXED_CAMPUS_EVENT' ? line.fulfillmentSource : defaultFulfillment(type),
      })),
    }))
  }

  const updateLine = (key: string, patch: Partial<LineForm>) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    }))
  }

  const pickStoreItem = (key: string, storeItemId: string) => {
    const item = items.find((row) => String(row.id) === storeItemId)
    updateLine(key, {
      storeItemId,
      description: item?.name ?? '',
      unitId: item?.unit?.id ? String(item.unit.id) : '',
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const purpose = form.purpose.trim()
    if (!purpose) {
      setError('Purpose is required.')
      return
    }
    if (form.type === 'INTERNAL_STORE_TRANSFER' && (!form.sourceStoreId || !form.destinationStoreId)) {
      setError('Source and destination stores are required for a transfer.')
      return
    }
    if ((form.type === 'STORE_ISSUANCE' || form.type === 'MIXED_CAMPUS_EVENT') && !form.sourceStoreId) {
      setError('Select the source store.')
      return
    }
    if (form.type === 'PURCHASE_SUPPLIER' && !form.supplierId) {
      setError('Select a supplier.')
      return
    }

    const itemsPayload = form.lines
      .map((line) => {
        const description = line.description.trim()
        const quantity = Number(line.quantity)
        if (!description || !Number.isFinite(quantity) || quantity <= 0) return null
        const item: CreateRequisitionPayload['items'][number] = {
          description,
          quantity,
          unitPrice: showPrice ? asMoney(line.unitPrice) : 0,
          fulfillmentSource: showFulfillment ? line.fulfillmentSource : defaultFulfillment(form.type),
        }
        const storeItemId = optionalId(line.storeItemId)
        const unitId = optionalId(line.unitId)
        if (storeItemId) item.storeItemId = storeItemId
        if (unitId) item.unitId = unitId
        return item
      })
      .filter((line): line is NonNullable<typeof line> => line != null)

    if (itemsPayload.length === 0) {
      setError('Add at least one line with a description and quantity.')
      return
    }

    setError('')
    const body: CreateRequisitionPayload = {
      requisitionDate: form.requisitionDate || todayIso(),
      type: form.type,
      purpose,
      items: itemsPayload,
    }
    const campusId = optionalId(form.campusId)
    const departmentId = optionalId(form.departmentId)
    const costCenterId = optionalId(form.costCenterId)
    const sourceStoreId = showSourceStore ? optionalId(form.sourceStoreId) : undefined
    const destinationStoreId = showDestStore ? optionalId(form.destinationStoreId) : undefined
    const supplierId = showSupplier ? optionalId(form.supplierId) : undefined
    const documentUrl = form.documentUrl.trim()
    if (campusId) body.campusId = campusId
    if (departmentId) body.departmentId = departmentId
    if (costCenterId) body.costCenterId = costCenterId
    if (sourceStoreId) body.sourceStoreId = sourceStoreId
    if (destinationStoreId) body.destinationStoreId = destinationStoreId
    if (supplierId) body.supplierId = supplierId
    if (documentUrl) body.documentUrl = documentUrl
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-3xl flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle>New requisition</DialogTitle>
          <DialogDescription>
            Submitted immediately. The creator is taken from your signed-in staff profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Type"
                value={form.type}
                onChange={setType}
                options={REQUISITION_TYPES.map((type) => ({
                  value: type,
                  label: requisitionTypeLabel(type),
                }))}
                allowEmpty={false}
              />
              <TextField
                label="Date"
                type="date"
                value={form.requisitionDate}
                onChange={(event) => setForm((current) => ({ ...current, requisitionDate: event.target.value }))}
              />
              <SelectField
                label="Campus"
                value={form.campusId}
                onChange={(value) => setForm((current) => ({ ...current, campusId: value }))}
                options={campuses.map((row) => ({ value: String(row.id), label: row.name }))}
                placeholder="Select campus"
              />
              <SelectField
                label="Department"
                value={form.departmentId}
                onChange={(value) => setForm((current) => ({ ...current, departmentId: value }))}
                options={departments.map((row) => ({ value: String(row.id), label: row.name }))}
                placeholder="Select department"
              />
              <SelectField
                label="Cost center"
                value={form.costCenterId}
                onChange={(value) => setForm((current) => ({ ...current, costCenterId: value }))}
                options={costCenters.map((row) => ({ value: String(row.id), label: row.name }))}
                placeholder="Select cost center"
              />
              {showSourceStore ? (
                <SelectField
                  label="Source store"
                  value={form.sourceStoreId}
                  onChange={(value) => setForm((current) => ({ ...current, sourceStoreId: value }))}
                  options={stores.map((row) => ({ value: String(row.id), label: row.name }))}
                  placeholder="Select store"
                />
              ) : null}
              {showDestStore ? (
                <SelectField
                  label="Destination store"
                  value={form.destinationStoreId}
                  onChange={(value) => setForm((current) => ({ ...current, destinationStoreId: value }))}
                  options={stores.map((row) => ({ value: String(row.id), label: row.name }))}
                  placeholder="Select store"
                />
              ) : null}
              {showSupplier ? (
                <SelectField
                  label="Supplier"
                  value={form.supplierId}
                  onChange={(value) => setForm((current) => ({ ...current, supplierId: value }))}
                  options={suppliers.map((row) => ({ value: String(row.id), label: row.name }))}
                  placeholder="Select supplier"
                />
              ) : null}
            </div>
            <TextareaField
              label="Purpose"
              name="purpose"
              value={form.purpose}
              onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))}
              rows={3}
            />
            <TextField
              label="Document URL"
              value={form.documentUrl}
              onChange={(event) => setForm((current) => ({ ...current, documentUrl: event.target.value }))}
              placeholder="Optional quotation or form link"
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="type-heading">Line items</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((current) => ({ ...current, lines: [...current.lines, newLine(current.type)] }))}
                >
                  <Plus aria-hidden="true" />
                  Add line
                </Button>
              </div>
              {form.lines.map((line, index) => (
                <div key={line.key} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="type-caption font-medium text-muted-foreground">Line {index + 1}</p>
                    {form.lines.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove line ${index + 1}`}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            lines: current.lines.filter((row) => row.key !== line.key),
                          }))
                        }
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {showStoreItem ? (
                      <SelectField
                        label="Catalogue item"
                        value={line.storeItemId}
                        onChange={(value) => pickStoreItem(line.key, value)}
                        options={items.map((row) => ({ value: String(row.id), label: row.name }))}
                        placeholder="Optional catalogue link"
                      />
                    ) : null}
                    <TextField
                      label="Description"
                      value={line.description}
                      onChange={(event) => updateLine(line.key, { description: event.target.value })}
                      {...(showStoreItem ? {} : { containerClassName: 'sm:col-span-2' })}
                    />
                    <TextField
                      label="Quantity"
                      type="number"
                      min="0"
                      step="any"
                      value={line.quantity}
                      onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                    />
                    <SelectField
                      label="Unit"
                      value={line.unitId}
                      onChange={(value) => updateLine(line.key, { unitId: value })}
                      options={units.map((row) => ({ value: String(row.id), label: row.name }))}
                      placeholder="Select unit"
                    />
                    {showPrice ? (
                      <TextField
                        label={form.type === 'SERVICE_EXPENSE' ? 'Cost' : 'Unit price'}
                        type="number"
                        min="0"
                        step="any"
                        value={line.unitPrice}
                        onChange={(event) => updateLine(line.key, { unitPrice: event.target.value })}
                      />
                    ) : null}
                    {showFulfillment ? (
                      <SelectField
                        label="Fulfillment"
                        value={line.fulfillmentSource}
                        onChange={(value) =>
                          updateLine(line.key, { fulfillmentSource: value as FulfillmentSource })
                        }
                        options={FULFILLMENT_SOURCES.map((source) => ({
                          value: source,
                          label: fulfillmentLabel(source),
                        }))}
                        allowEmpty={false}
                      />
                    ) : null}
                  </div>
                  <p className="type-caption mt-2 text-muted-foreground">
                    Line total {formatKes(lineTotal(line))}
                  </p>
                </div>
              ))}
              <p className="type-heading">Estimated total {formatKes(estimated)}</p>
            </div>
            {error ? <p className="type-caption text-destructive">{error}</p> : null}
          </div>
          <DialogFooter className="border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Submitting…' : 'Submit requisition'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function showSourceFor(type: RequisitionType): boolean {
  return type === 'INTERNAL_STORE_TRANSFER' || type === 'STORE_ISSUANCE' || type === 'MIXED_CAMPUS_EVENT'
}
