import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { FormSection } from '@/components/forms/FormSection'
import { SelectField } from '@/components/forms/SelectField'
import { SwitchField } from '@/components/forms/SwitchField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import { GoogleDrivePhotoField } from '@/components/forms/GoogleDrivePhotoField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Asset, AssetWritePayload } from '@/features/assets/types/asset.types'
import { assetIsDepreciable } from '@/features/assets/types/asset.types'
import type { Campus, Department } from '@/features/lookups/lookups.types'
import type { Staff } from '@/features/staff/types/staff.types'
import { formatPersonName } from '@/lib/format'

export interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Asset | null
  categories: Array<{ id: number; name: string }>
  campuses: Campus[]
  departments: Department[]
  staff: Staff[]
  isSaving: boolean
  onSubmit: (body: AssetWritePayload) => void
}

interface AssetFormState {
  assetTagId: string
  description: string
  brand: string
  model: string
  serialNumber: string
  categoryId: string
  campusId: string
  departmentId: string
  assignedToId: string
  purchaseDate: string
  costPrice: string
  assetCondition: string
  status: string
  isDepreciable: boolean
  assetLifeMonths: string
  salvageValue: string
  comments: string
  googleDrivePhotoLink: string
}

const emptyForm = (): AssetFormState => ({
  assetTagId: '',
  description: '',
  brand: '',
  model: '',
  serialNumber: '',
  categoryId: '',
  campusId: '',
  departmentId: '',
  assignedToId: '',
  purchaseDate: '',
  costPrice: '',
  assetCondition: '',
  status: '',
  isDepreciable: false,
  assetLifeMonths: '',
  salvageValue: '',
  comments: '',
  googleDrivePhotoLink: '',
})

function formFromAsset(asset: Asset): AssetFormState {
  return {
    assetTagId: asset.assetTagId ?? '',
    description: asset.description ?? '',
    brand: asset.brand ?? '',
    model: asset.model ?? '',
    serialNumber: asset.serialNumber ?? '',
    categoryId: asset.category?.id ? String(asset.category.id) : '',
    campusId: asset.campus?.id ? String(asset.campus.id) : '',
    departmentId: asset.department?.id ? String(asset.department.id) : '',
    assignedToId: asset.assignedTo?.id ? String(asset.assignedTo.id) : '',
    purchaseDate: asset.purchaseDate ?? '',
    costPrice: asset.costPrice == null ? '' : String(asset.costPrice),
    assetCondition: asset.assetCondition ?? '',
    status: asset.status ?? '',
    isDepreciable: assetIsDepreciable(asset),
    assetLifeMonths: asset.assetLifeMonths == null ? '' : String(asset.assetLifeMonths),
    salvageValue: asset.salvageValue == null ? '' : String(asset.salvageValue),
    comments: asset.comments ?? '',
    googleDrivePhotoLink: asset.googleDrivePhotoLink ?? '',
  }
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function optionalRelation(id: string): { id: number } | undefined {
  const parsed = Number(id)
  return parsed ? { id: parsed } : undefined
}

function buildPayload(form: AssetFormState, includeTag: boolean): AssetWritePayload {
  const payload: AssetWritePayload = {
    isDepreciable: form.isDepreciable,
    depreciable: form.isDepreciable,
  }

  if (includeTag) {
    payload.assetTagId = form.assetTagId.trim()
  }

  const description = optionalText(form.description)
  if (description) payload.description = description
  const brand = optionalText(form.brand)
  if (brand) payload.brand = brand
  const model = optionalText(form.model)
  if (model) payload.model = model
  const serialNumber = optionalText(form.serialNumber)
  if (serialNumber) payload.serialNumber = serialNumber
  const category = optionalRelation(form.categoryId)
  if (category) payload.category = category
  const campus = optionalRelation(form.campusId)
  if (campus) payload.campus = campus
  const department = optionalRelation(form.departmentId)
  if (department) payload.department = department
  const assignedTo = optionalRelation(form.assignedToId)
  if (assignedTo) payload.assignedTo = assignedTo
  const purchaseDate = optionalText(form.purchaseDate)
  if (purchaseDate) payload.purchaseDate = purchaseDate
  const costPrice = optionalNumber(form.costPrice)
  if (costPrice !== undefined) payload.costPrice = costPrice
  const assetCondition = optionalText(form.assetCondition)
  if (assetCondition) payload.assetCondition = assetCondition
  const status = optionalText(form.status)
  if (status) payload.status = status
  const assetLifeMonths = optionalNumber(form.assetLifeMonths)
  if (assetLifeMonths !== undefined) payload.assetLifeMonths = Math.round(assetLifeMonths)
  const salvageValue = optionalNumber(form.salvageValue)
  if (salvageValue !== undefined) payload.salvageValue = salvageValue
  const comments = optionalText(form.comments)
  if (comments) payload.comments = comments
  const photo = optionalText(form.googleDrivePhotoLink)
  if (photo) payload.googleDrivePhotoLink = photo

  return payload
}

export function AssetFormDialog({
  open,
  onOpenChange,
  editing,
  categories,
  campuses,
  departments,
  staff,
  isSaving,
  onSubmit,
}: AssetFormDialogProps): ReactNode {
  const [form, setForm] = useState<AssetFormState>(emptyForm)
  const isEdit = editing !== null

  useEffect(() => {
    if (!open) return
    setForm(editing ? formFromAsset(editing) : emptyForm())
  }, [open, editing])

  const setField = <K extends keyof AssetFormState>(key: K, value: AssetFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!isEdit && !form.assetTagId.trim()) return
    onSubmit(buildPayload(form, !isEdit))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-2xl flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>{isEdit ? 'Edit asset' : 'Register asset'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Tag ID cannot be changed. Empty fields are left as they are.'
                : 'Tag ID must be unique. Optional fields can be filled in later.'}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4">
              <FormSection title="Identity" className="shadow-none">
                <TextField
                  label="Asset tag ID"
                  value={form.assetTagId}
                  onChange={(event) => setField('assetTagId', event.target.value)}
                  placeholder="MGA-ICT-2026-001"
                  required={!isEdit}
                  disabled={isEdit}
                  hint={isEdit ? 'The backend does not allow changing the tag ID.' : undefined}
                />
                <TextField
                  label="Description"
                  value={form.description}
                  onChange={(event) => setField('description', event.target.value)}
                  placeholder="HP ProBook 450 G10"
                />
                <TextField
                  label="Brand"
                  value={form.brand}
                  onChange={(event) => setField('brand', event.target.value)}
                  placeholder="HP"
                />
                <TextField
                  label="Model"
                  value={form.model}
                  onChange={(event) => setField('model', event.target.value)}
                  placeholder="ProBook"
                />
                <TextField
                  label="Serial number"
                  value={form.serialNumber}
                  onChange={(event) => setField('serialNumber', event.target.value)}
                />
                <SelectField
                  label="Category"
                  value={form.categoryId}
                  onChange={(value) => setField('categoryId', value)}
                  options={categories.map((item) => ({ value: String(item.id), label: item.name }))}
                  placeholder="Select category"
                  emptyLabel="Not set"
                />
              </FormSection>

              <FormSection title="Assignment" className="shadow-none">
                <SelectField
                  label="Campus"
                  value={form.campusId}
                  onChange={(value) => setField('campusId', value)}
                  options={campuses.map((item) => ({ value: String(item.id), label: item.name }))}
                  placeholder="Select campus"
                  emptyLabel="Not set"
                />
                <SelectField
                  label="Department"
                  value={form.departmentId}
                  onChange={(value) => setField('departmentId', value)}
                  options={departments.map((item) => ({ value: String(item.id), label: item.name }))}
                  placeholder="Select department"
                  emptyLabel="Not set"
                />
                <SelectField
                  label="Assigned to"
                  value={form.assignedToId}
                  onChange={(value) => setField('assignedToId', value)}
                  options={staff.map((item) => ({
                    value: String(item.id),
                    label: [formatPersonName(item), item.staffNumber].filter(Boolean).join(' · '),
                  }))}
                  placeholder="Select staff"
                  emptyLabel="Not set"
                  containerClassName="sm:col-span-2"
                />
              </FormSection>

              <FormSection title="Condition and value" className="shadow-none">
                <TextField
                  label="Condition"
                  value={form.assetCondition}
                  onChange={(event) => setField('assetCondition', event.target.value)}
                  placeholder="Good"
                />
                <TextField
                  label="Status"
                  value={form.status}
                  onChange={(event) => setField('status', event.target.value)}
                  placeholder="In Use"
                />
                <TextField
                  label="Purchase date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(event) => setField('purchaseDate', event.target.value)}
                />
                <TextField
                  label="Cost price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(event) => setField('costPrice', event.target.value)}
                />
                <div className="sm:col-span-2">
                  <SwitchField
                    label="Depreciable"
                    description="Turn on if this item loses value over a set life."
                    checked={form.isDepreciable}
                    onCheckedChange={(checked) => setField('isDepreciable', checked)}
                  />
                </div>
                <TextField
                  label="Asset life (months)"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={form.assetLifeMonths}
                  onChange={(event) => setField('assetLifeMonths', event.target.value)}
                  disabled={!form.isDepreciable}
                />
                <TextField
                  label="Salvage value"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.salvageValue}
                  onChange={(event) => setField('salvageValue', event.target.value)}
                  disabled={!form.isDepreciable}
                />
              </FormSection>

              <FormSection title="Notes" className="shadow-none">
                <GoogleDrivePhotoField
                  value={form.googleDrivePhotoLink}
                  onChange={(url) => setField('googleDrivePhotoLink', url)}
                  containerClassName="sm:col-span-2"
                />
                <TextareaField
                  label="Comments"
                  value={form.comments}
                  onChange={(event) => setField('comments', event.target.value)}
                  rows={3}
                  containerClassName="sm:col-span-2"
                />
              </FormSection>
            </div>
          </div>

          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              {isEdit ? 'Save changes' : 'Register asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
