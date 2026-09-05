import { Pencil } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
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
  useExpiryReport,
  useExpiringSoon,
  useStoreItems,
  useStoreLocations,
  useStoreMutations,
} from '@/features/store/hooks/useStore'
import {
  BATCH_STATUSES,
  formatStoreQty,
  type ItemBatch,
} from '@/features/store/types/store.types'
import { displayValue, formatDate } from '@/lib/format'

const PAGE_SIZE = 10

function batchStatusVariant(status: string | null | undefined) {
  switch ((status ?? '').toUpperCase()) {
    case 'AVAILABLE':
      return 'success' as const
    case 'EXPIRED':
      return 'destructive' as const
    case 'CONSUMED':
      return 'neutral' as const
    default:
      return 'warning' as const
  }
}

export function ExpiryPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const alerts = useExpiringSoon()
  const items = useStoreItems()
  const stores = useStoreLocations()
  const { correctExpiry } = useStoreMutations()
  const [itemId, setItemId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<ItemBatch | null>(null)
  const [expiryDate, setExpiryDate] = useState('')

  const reportParams = useMemo(
    () => ({
      ...(Number(itemId) ? { itemId: Number(itemId) } : {}),
      ...(Number(storeId) ? { storeId: Number(storeId) } : {}),
      ...(status ? { status } : {}),
    }),
    [itemId, status, storeId],
  )
  const report = useExpiryReport(reportParams)
  const alertRows = alerts.data ?? []
  const rows = report.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<ItemBatch>> = [
    { id: 'item', header: 'Item', cell: (row) => displayValue(row.item?.name) },
    { id: 'store', header: 'Store', cell: (row) => displayValue(row.store?.name) },
    { id: 'qty', header: 'Qty', cell: (row) => formatStoreQty(row.quantity) },
    { id: 'expiry', header: 'Expiry', cell: (row) => formatDate(row.expiryDate) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={batchStatusVariant(row.status)}>{displayValue(row.status)}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      className: 'w-16 text-right',
      cell: (row) =>
        canWrite ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Correct expiry date"
            onClick={() => {
              setEditing(row)
              setExpiryDate(row.expiryDate ?? '')
            }}
          >
            <Pencil aria-hidden="true" />
          </Button>
        ) : null,
    },
  ]

  const handleCorrect = (event: FormEvent) => {
    event.preventDefault()
    if (!editing || !expiryDate) return
    correctExpiry.mutate(
      { id: editing.id, expiryDate },
      { onSuccess: () => setEditing(null) },
    )
  }

  if (alerts.isError) {
    return <ErrorState message={toUserMessage(alerts.error)} onRetry={() => void alerts.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="type-section-title">Expiring within 30 days</h2>
          <p className="type-caption mt-1 text-muted-foreground">
            GET /api/store/alerts/expiring-soon. Available batches whose expiry is before today plus 30 days.
          </p>
        </div>
        {alertRows.length === 0 && !alerts.isLoading ? (
          <EmptyState title="No batches expiring soon" description="Additions with expiry dates will appear here." />
        ) : (
          <DataTable
            columns={columns.filter((column) => column.id !== 'actions')}
            rows={alertRows}
            getRowId={(row) => `alert-${row.id}`}
            isLoading={alerts.isLoading}
            page={1}
            pageSize={Math.max(alertRows.length, 1)}
            total={alertRows.length}
            onPageChange={() => undefined}
            mobileCard={(row) => (
              <div>
                <p className="type-heading">{displayValue(row.item?.name)}</p>
                <p className="type-caption text-muted-foreground">
                  {formatDate(row.expiryDate)} · {displayValue(row.store?.name)}
                </p>
              </div>
            )}
          />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="type-section-title">Expiry report</h2>
          <p className="type-caption mt-1 text-muted-foreground">
            GET /api/store/reports/expiries. Leave filters empty to list every batch.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField
            label="Item"
            value={itemId}
            onChange={(value) => {
              setItemId(value)
              setPage(1)
            }}
            options={(items.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
            emptyLabel="All items"
          />
          <SelectField
            label="Store"
            value={storeId}
            onChange={(value) => {
              setStoreId(value)
              setPage(1)
            }}
            options={(stores.data ?? []).map((store) => ({ value: String(store.id), label: store.name }))}
            emptyLabel="All stores"
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={BATCH_STATUSES.map((value) => ({ value, label: value }))}
            emptyLabel="All statuses"
          />
        </div>
        {report.isError ? (
          <ErrorState message={toUserMessage(report.error)} onRetry={() => void report.refetch()} />
        ) : rows.length === 0 && !report.isLoading ? (
          <EmptyState title="No matching batches" description="Record an addition with expiry dates, or clear a filter." />
        ) : (
          <DataTable
            columns={columns}
            rows={paged}
            getRowId={(row) => row.id}
            isLoading={report.isLoading}
            page={page}
            pageSize={PAGE_SIZE}
            total={rows.length}
            onPageChange={setPage}
            mobileCard={(row) => (
              <div>
                <p className="type-heading">{displayValue(row.item?.name)}</p>
                <p className="type-caption text-muted-foreground">
                  {formatDate(row.expiryDate)} · {displayValue(row.status)}
                </p>
              </div>
            )}
          />
        )}
      </section>

      <Dialog open={editing !== null} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent>
          <form onSubmit={handleCorrect}>
            <DialogHeader>
              <DialogTitle>Correct expiry date</DialogTitle>
              <DialogDescription>
                Updates this batch through the correct-expiry endpoint. Use this if the manufacturing date was entered
                by mistake.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <TextField
                label="Expiry date"
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={correctExpiry.isPending} loadingLabel="Saving">
                Save date
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
