import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

import { FormSection } from '@/components/forms/FormSection'
import { SelectField } from '@/components/forms/SelectField'
import { SwitchField } from '@/components/forms/SwitchField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import {
  GoogleDrivePhotoField,
  type GoogleDrivePhotoFieldHandle,
} from '@/components/forms/GoogleDrivePhotoField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Asset, AssetNamedLookup, AssetWritePayload } from '@/features/assets/types/asset.types'
import { assetIsDepreciable } from '@/features/assets/types/asset.types'
import type { Campus, Department } from '@/features/lookups/lookups.types'
import type { Staff } from '@/features/staff/types/staff.types'
import type { Supplier } from '@/features/suppliers/types/supplier.types'
import { formatPersonName } from '@/lib/format'

export interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Asset | null
  categories: AssetNamedLookup[]
  descriptions: AssetNamedLookup[]
  conditions: AssetNamedLookup[]
  statuses: AssetNamedLookup[]
  campuses: Campus[]
  departments: Department[]
  staff: Staff[]
  suppliers: Supplier[]
  isSaving: boolean
  onSubmit: (body: AssetWritePayload) => void
}

interface AssetFormState {
  assetTagId: string
  descriptionId: string
  brand: string
  model: string
  serialNumber: string
  categoryId: string
  campusId: string
  departmentId: string
  assignedToId: string
  supplierId: string
  purchaseDate: string
  costPrice: string
  conditionId: string
  statusId: string
  isDepreciable: boolean
  assetLifeMonths: string
  salvageValue: string
  comments: string
  googleDrivePhotoLink: string
}

const emptyForm = (): AssetFormState => ({
  assetTagId: '',
  descriptionId: '',
  brand: '',
  model: '',
  serialNumber: '',
  categoryId: '',
  campusId: '',
  departmentId: '',
  assignedToId: '',
  supplierId: '',
  purchaseDate: '',
  costPrice: '',
  conditionId: '',
  statusId: '',
  isDepreciable: false,
  assetLifeMonths: '',
  salvageValue: '',
  comments: '',
  googleDrivePhotoLink: '',
})

function formFromAsset(asset: Asset): AssetFormState {
  return {
    assetTagId: asset.assetTagId ?? '',
    descriptionId: asset.description?.id ? String(asset.description.id) : '',
    brand: asset.brand ?? '',
    model: asset.model ?? '',
    serialNumber: asset.serialNumber ?? '',
    categoryId: asset.category?.id ? String(asset.category.id) : '',
    campusId: asset.campus?.id ? String(asset.campus.id) : '',
    departmentId: asset.department?.id ? String(asset.department.id) : '',
    assignedToId: asset.assignedTo?.id ? String(asset.assignedTo.id) : '',
    supplierId: asset.supplier?.id ? String(asset.supplier.id) : '',
    purchaseDate: asset.purchaseDate ?? '',
    costPrice: asset.costPrice == null ? '' : String(asset.costPrice),
    conditionId: asset.assetCondition?.id ? String(asset.assetCondition.id) : '',
    statusId: asset.status?.id ? String(asset.status.id) : '',
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
    const tag = optionalText(form.assetTagId)
    if (tag) payload.assetTagId = tag
  }

  const description = optionalRelation(form.descriptionId)
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
  const supplier = optionalRelation(form.supplierId)
  if (supplier) payload.supplier = supplier
  const purchaseDate = optionalText(form.purchaseDate)
  if (purchaseDate) payload.purchaseDate = purchaseDate
  const costPrice = optionalNumber(form.costPrice)
  if (costPrice !== undefined) payload.costPrice = costPrice
  const assetCondition = optionalRelation(form.conditionId)
  if (assetCondition) payload.assetCondition = assetCondition
  const status = optionalRelation(form.statusId)
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
  descriptions,
  conditions,
  statuses,
  campuses,
  departments,
  staff,
  suppliers,
  isSaving,
  onSubmit,
}: AssetFormDialogProps): ReactNode {
  const [form, setForm] = useState<AssetFormState>(emptyForm)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoRef = useRef<GoogleDrivePhotoFieldHandle>(null)
  const isEdit = editing !== null
  const busy = isSaving || uploadingPhoto

  useEffect(() => {
    if (!open) return
    setForm(editing ? formFromAsset(editing) : emptyForm())
  }, [open, editing])

  const setField = <K extends keyof AssetFormState>(key: K, value: AssetFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setUploadingPhoto(true)
    try {
      const url = (await photoRef.current?.commit()) ?? form.googleDrivePhotoLink
      onSubmit(buildPayload({ ...form, googleDrivePhotoLink: url }, !isEdit))
    } catch {
      return
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-2xl flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>{isEdit ? 'Edit asset' : 'Register asset'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Tag ID is not sent on update. Empty fields are left as they are.'
                : 'Tag ID is optional. If provided, it must be unique. Supplier name is snapshotted by the backend.'}
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
                  disabled={isEdit}
                  hint={isEdit ? 'Tag ID is not changed on update.' : 'Leave blank to let the record exist without a tag.'}
                />
                <SelectField
                  label="Description"
                  value={form.descriptionId}
                  onChange={(value) => setField('descriptionId', value)}
                  options={descriptions.map((item) => ({ value: String(item.id), label: item.name }))}
                  placeholder={descriptions.length ? 'Select description' : 'No descriptions available'}
                  emptyMessage="No descriptions available"
                  emptyLabel="Not set"
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
                  placeholder={categories.length ? 'Select category' : 'No categories available'}
                  emptyMessage="No categories available"
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
                <SelectField
                  label="Supplier"
                  value={form.supplierId}
                  onChange={(value) => setField('supplierId', value)}
                  options={suppliers.map((item) => ({
                    value: String(item.id),
                    label: [item.name, item.supplierCode].filter(Boolean).join(' · '),
                  }))}
                  placeholder={suppliers.length ? 'Select supplier' : 'No suppliers yet'}
                  emptyMessage="No suppliers available"
                  emptyLabel="Not set"
                  hint="The supplier name is stored as a snapshot for history."
                  containerClassName="sm:col-span-2"
                />
              </FormSection>

              <FormSection title="Condition and value" className="shadow-none">
                <SelectField
                  label="Condition"
                  value={form.conditionId}
                  onChange={(value) => setField('conditionId', value)}
                  options={conditions.map((item) => ({ value: String(item.id), label: item.name }))}
                  placeholder={conditions.length ? 'Select condition' : 'No conditions available'}
                  emptyMessage="No conditions available"
                  emptyLabel="Not set"
                />
                <SelectField
                  label="Status"
                  value={form.statusId}
                  onChange={(value) => setField('statusId', value)}
                  options={statuses.map((item) => ({ value: String(item.id), label: item.name }))}
                  placeholder={statuses.length ? 'Select status' : 'No statuses available'}
                  emptyMessage="No statuses available"
                  emptyLabel="Not set"
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
                  key={open ? `asset-${editing?.id ?? 'new'}` : 'asset-closed'}
                  ref={photoRef}
                  value={form.googleDrivePhotoLink}
                  onChange={(url) => setField('googleDrivePhotoLink', url)}
                  disabled={busy}
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
            <Button type="submit" isLoading={busy} loadingLabel={uploadingPhoto ? 'Uploading photo' : 'Saving'}>
              {isEdit ? 'Save changes' : 'Register asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
