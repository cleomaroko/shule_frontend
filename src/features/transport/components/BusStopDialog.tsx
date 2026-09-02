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
import type { TransportZone } from '@/features/logistics/types/logistics.types'
import type { BusStopWritePayload } from '@/features/transport/types/transport.types'

export interface BusStopDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zones: TransportZone[]
  isSaving: boolean
  onSubmit: (body: BusStopWritePayload) => void
}

export function BusStopDialog({
  open,
  onOpenChange,
  zones,
  isSaving,
  onSubmit,
}: BusStopDialogProps): ReactNode {
  const [stopName, setStopName] = useState('')
  const [stopCode, setStopCode] = useState('')
  const [zoneId, setZoneId] = useState('')

  useEffect(() => {
    if (!open) return
    setStopName('')
    setStopCode('')
    setZoneId('')
  }, [open])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const name = stopName.trim()
    if (!name) return
    const body: BusStopWritePayload = {
      stopName: name,
      stopCode: stopCode.trim() || null,
    }
    const parsedZone = Number(zoneId)
    if (parsedZone) body.zone = { id: parsedZone }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>Add bus stop</DialogTitle>
            <DialogDescription>
              Stops belong to a transport zone from Logistics, for example Zimmerman in Kasarani.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            <TextField
              label="Stop name"
              value={stopName}
              onChange={(event) => setStopName(event.target.value)}
              placeholder="Zimmerman"
              required
            />
            <TextField
              label="Stop code"
              value={stopCode}
              onChange={(event) => setStopCode(event.target.value)}
              placeholder="36"
            />
            <SelectField
              label="Zone"
              value={zoneId}
              onChange={setZoneId}
              options={zones.map((zone) => ({ value: String(zone.id), label: zone.zoneName }))}
              placeholder="Select zone"
              emptyLabel="Not set"
            />
          </div>
          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              Add stop
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
