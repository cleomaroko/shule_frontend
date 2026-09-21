import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { FormSection } from '@/components/forms/FormSection'
import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRequisitionList } from '@/features/requisitions/hooks/useRequisitions'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { useGrnList, useStoreLocations, useStoreMutations } from '@/features/store/hooks/useStore'
import { grnHasShortage, type CreateGrnPayload, type Grn } from '@/features/store/types/grn.types'
import { formatPersonName, todayIso } from '@/lib/format'

type LineDraft = {
  description: string
  quantityOrdered: string
  quantityReceived: string
}

function emptyLine(): LineDraft {
  return { description: '', quantityOrdered: '0', quantityReceived: '0' }
}

export function GrnPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useGrnList()
  const locations = useStoreLocations()
  const staff = useStaffList()
  const requisitions = useRequisitionList()
  const { createGrn } = useStoreMutations()
  const [page, setPage] = useState(1)
  const [poId, setPoId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [dateReceived, setDateReceived] = useState(todayIso())
  const [deliveredBy, setDeliveredBy] = useState('')
  const [releasedBy, setReleasedBy] = useState('')
  const [receivedBy, setReceivedBy] = useState('')
  const [remarks, setRemarks] = useState('')
  const [sourceReq, setSourceReq] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()])

  const selectedReq = (requisitions.data ?? []).find((item) => String(item.id) === sourceReq)

  const applyRequisitionItems = (requisitionId: string) => {
    setSourceReq(requisitionId)
    const next = (requisitions.data ?? []).find((item) => String(item.id) === requisitionId)
    if (!next?.items?.length) return
    setLines(
      next.items.map((item) => ({
        description: item.description || item.storeItem?.name || 'Item',
        quantityOrdered: String(item.quantity ?? 0),
        quantityReceived: String(item.quantity ?? 0),
      })),
    )
  }

  const handleSave = (event: FormEvent) => {
    event.preventDefault()
    if (!canWrite) return
    const parsedPo = Number(poId)
    const parsedStore = Number(storeId)
    if (!parsedPo || !parsedStore) {
      toast.error('Purchase order id and destination store are required.')
      return
    }
    const items = lines
      .map((line) => ({
        description: line.description.trim(),
        quantityOrdered: Number(line.quantityOrdered),
        quantityReceived: Number(line.quantityReceived),
      }))
      .filter((line) => line.description && Number.isFinite(line.quantityOrdered) && Number.isFinite(line.quantityReceived))
    if (items.length === 0) {
      toast.error('Add at least one line with a description.')
      return
    }
    const body: CreateGrnPayload = {
      purchaseOrder: { id: parsedPo },
      destinationStore: { id: parsedStore },
      items,
    }
    if (dateReceived) body.dateReceived = dateReceived
    if (deliveredBy.trim()) body.deliveredBy = deliveredBy.trim()
    if (releasedBy.trim()) body.releasedBy = releasedBy.trim()
    const staffId = Number(receivedBy)
    if (staffId) body.receivedBy = { id: staffId }
    if (remarks.trim()) body.remarks = remarks.trim()
    createGrn.mutate(body, {
      onSuccess: () => {
        setPoId('')
        setLines([emptyLine()])
        setRemarks('')
      },
    })
  }

  const columns: Array<DataColumn<Grn>> = useMemo(
    () => [
      { id: 'no', header: 'GRN', cell: (row) => row.grnNumber || `#${row.id}` },
      { id: 'date', header: 'Received', cell: (row) => row.dateReceived || '—' },
      {
        id: 'po',
        header: 'PO',
        cell: (row) => row.purchaseOrder?.poNumber || (row.purchaseOrder?.id ? `#${row.purchaseOrder.id}` : '—'),
        hideOnMobile: true,
      },
      {
        id: 'store',
        header: 'Store',
        cell: (row) => row.destinationStore?.name || '—',
        hideOnMobile: true,
      },
      {
        id: 'short',
        header: 'Lines',
        cell: (row) => {
          const shortage = (row.items ?? []).some(grnHasShortage)
          return shortage ? <Badge variant="warning">Shortage</Badge> : <Badge variant="success">{row.items?.length ?? 0}</Badge>
        },
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-6">
      <Alert variant="info">
        <AlertTitle>Goods received notes</AlertTitle>
        <AlertDescription>
          POST /api/store/grn sets grnNumber and recordedBy from your login. GET returns the full list. The controller
          does not mark the linked purchase order as RECEIVED.
        </AlertDescription>
      </Alert>

      {canWrite ? (
        <form onSubmit={handleSave}>
          <FormSection title="Record GRN" description="receivedBy is the staff member who physically checked the goods.">
            <TextField
              label="Purchase order id"
              type="number"
              min="1"
              value={poId}
              onChange={(event) => setPoId(event.target.value)}
              hint="There is no PO list endpoint. Use the id from Finance."
              required
            />
            <SelectField
              label="Prefill from requisition"
              value={sourceReq}
              onChange={applyRequisitionItems}
              options={(requisitions.data ?? []).map((item) => ({
                value: String(item.id),
                label: item.requisitionNumber || `REQ #${item.id}`,
              }))}
              emptyLabel="Skip"
              hint="Copies descriptions and ordered quantities. Does not replace the PO id."
            />
            <SelectField
              label="Destination store"
              value={storeId}
              onChange={setStoreId}
              options={(locations.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
              allowEmpty={false}
              placeholder="Select store"
            />
            <TextField
              label="Date received"
              type="date"
              value={dateReceived}
              onChange={(event) => setDateReceived(event.target.value)}
            />
            <TextField label="Delivered by" value={deliveredBy} onChange={(event) => setDeliveredBy(event.target.value)} />
            <TextField label="Released by" value={releasedBy} onChange={(event) => setReleasedBy(event.target.value)} />
            <SelectField
              label="Received by"
              value={receivedBy}
              onChange={setReceivedBy}
              options={(staff.data ?? []).map((item) => ({
                value: String(item.id),
                label: formatPersonName(item),
              }))}
              emptyLabel="Not set"
            />
            <TextareaField
              label="Remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              containerClassName="sm:col-span-2"
            />
            <div className="flex flex-col gap-3 sm:col-span-2">
              {selectedReq ? (
                <p className="type-caption text-muted-foreground">
                  Prefilling from {selectedReq.requisitionNumber || `requisition ${selectedReq.id}`}. Highlight shortages
                  by lowering quantity received.
                </p>
              ) : null}
              {lines.map((line, index) => {
                const ordered = Number(line.quantityOrdered)
                const received = Number(line.quantityReceived)
                const short = Number.isFinite(ordered) && Number.isFinite(received) && received < ordered
                return (
                  <div key={index} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_8rem_8rem_auto]">
                    <TextField
                      label="Description"
                      value={line.description}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)),
                        )
                      }
                    />
                    <TextField
                      label="Ordered"
                      type="number"
                      min="0"
                      value={line.quantityOrdered}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item, i) => (i === index ? { ...item, quantityOrdered: event.target.value } : item)),
                        )
                      }
                    />
                    <TextField
                      label="Received"
                      type="number"
                      min="0"
                      value={line.quantityReceived}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item, i) => (i === index ? { ...item, quantityReceived: event.target.value } : item)),
                        )
                      }
                      error={short ? 'Shortage' : undefined}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="self-end"
                      onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                      aria-label="Remove line"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )
              })}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setLines((current) => [...current, emptyLine()])}>
                  <Plus />
                  Add line
                </Button>
                <Button type="submit" isLoading={createGrn.isPending} loadingLabel="Recording">
                  Record GRN
                </Button>
              </div>
            </div>
          </FormSection>
        </form>
      ) : (
        <EmptyState title="View only" description="Recording a GRN needs store or procurement write access." />
      )}

      {list.isError ? (
        <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
      ) : (list.data ?? []).length === 0 && !list.isLoading ? (
        <EmptyState title="No GRNs yet" description="Record the first goods received note for an approved purchase order." />
      ) : (
        <DataTable
          columns={columns}
          rows={list.data ?? []}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={10}
          total={(list.data ?? []).length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div>
              <p className="type-heading">{row.grnNumber || `GRN #${row.id}`}</p>
              <p className="type-caption text-muted-foreground">
                {row.dateReceived || 'No date'} · {row.destinationStore?.name || 'No store'}
              </p>
            </div>
          )}
        />
      )}
    </div>
  )
}
