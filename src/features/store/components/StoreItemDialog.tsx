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
import type {
  InventoryCategory,
  ItemUnit,
  StoreItem,
  StoreItemWritePayload,
} from '@/features/store/types/store.types'

export interface StoreItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: StoreItem | null
  units: ItemUnit[]
  categories: InventoryCategory[]
  isSaving: boolean
  onSubmit: (body: StoreItemWritePayload) => void
}

export function StoreItemDialog({
  open,
  onOpenChange,
  editing,
  units,
  categories,
  isSaving,
  onSubmit,
}: StoreItemDialogProps): ReactNode {
  const [name, setName] = useState('')
  const [itemCode, setItemCode] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [unitId, setUnitId] = useState('')

  useEffect(() => {
    if (!open) return
    setName(editing?.name ?? '')
    setItemCode(editing?.itemCode ?? '')
    setPrice(editing?.price == null ? '' : String(editing.price))
    setCategoryId(editing?.category?.id ? String(editing.category.id) : '')
    setUnitId(editing?.unit?.id ? String(editing.unit.id) : units[0] ? String(units[0].id) : '')
  }, [editing, open, units])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    const body: StoreItemWritePayload = { name: trimmedName }
    const code = itemCode.trim()
    if (code && !editing) body.itemCode = code
    const parsedPrice = Number(price)
    if (price.trim() && Number.isFinite(parsedPrice)) body.price = parsedPrice
    const parsedCategory = Number(categoryId)
    if (parsedCategory) body.category = { id: parsedCategory }
    const parsedUnit = Number(unitId)
    if (parsedUnit) body.unit = { id: parsedUnit }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>{editing ? 'Edit store item' : 'Add store item'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Name, price, category, and unit can be changed. Item code is not updated.'
                : 'Item code is unique. Units come from GET /api/store/units. Add more units on the Units tab.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="3 Quire counter books"
              required
            />
            <TextField
              label="Item code"
              value={itemCode}
              onChange={(event) => setItemCode(event.target.value)}
              placeholder="ST-001"
              disabled={Boolean(editing)}
            />
            <TextField
              label="Price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
            <SelectField
              label="Category"
              value={categoryId}
              onChange={setCategoryId}
              options={categories.map((item) => ({
                value: String(item.id),
                label: item.parentCategory?.name ? `${item.parentCategory.name} / ${item.name}` : item.name,
              }))}
              placeholder={categories.length ? 'Select category' : 'No categories available'}
              emptyMessage="No categories available"
              emptyLabel="Not set"
            />
            <SelectField
              label="Unit"
              value={unitId}
              onChange={setUnitId}
              options={units.map((unit) => ({ value: String(unit.id), label: unit.name }))}
              placeholder={units.length ? 'Select unit' : 'No units available'}
              emptyMessage="Add a unit on the Units tab first."
              emptyLabel="Not set"
              allowEmpty={false}
            />
          </div>
          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              {editing ? 'Save item' : 'Create item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
