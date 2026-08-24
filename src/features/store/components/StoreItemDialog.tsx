import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

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
import type { ItemUnit, StoreItemWritePayload } from '@/features/store/types/store.types'

export interface StoreItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  units: ItemUnit[]
  categories: string[]
  isSaving: boolean
  onSubmit: (body: StoreItemWritePayload) => void
}

export function StoreItemDialog({
  open,
  onOpenChange,
  units,
  categories,
  isSaving,
  onSubmit,
}: StoreItemDialogProps): ReactNode {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unitId, setUnitId] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setCategory('')
    setUnitId(units[0] ? String(units[0].id) : '')
  }, [open, units])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedCategory = category.trim()
    const parsedUnit = Number(unitId)
    if (!trimmedName || !trimmedCategory || !parsedUnit) return
    onSubmit({ name: trimmedName, category: trimmedCategory, unit: { id: parsedUnit } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>Add store item</DialogTitle>
            <DialogDescription>
              Items can be created but not edited or deleted — the backend has no PUT or DELETE for them.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="A5 Single Line 48pgs"
              required
            />
            <TextField
              label="Category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="STATIONERY"
              hint={categories.length ? `Used so far: ${categories.join(', ')}` : 'Free text, for example STATIONERY.'}
              required
            />
            {units.length > 0 ? (
              <SelectField
                label="Unit"
                value={unitId}
                onChange={setUnitId}
                options={units.map((unit) => ({ value: String(unit.id), label: unit.name }))}
                placeholder="Select unit"
                allowEmpty
                emptyLabel="Enter ID below"
              />
            ) : null}
            <TextField
              label="Unit ID"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
              hint={
                units.length > 0
                  ? 'Use the list above or type the numeric unit id if it has not been used on an item yet.'
                  : 'There is no list-units endpoint. After a fresh seed the ids are usually 1 Kg, 2 Pcs, 3 Liters, 4 Bales.'
              }
              required
            />
          </div>
          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              Create item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
