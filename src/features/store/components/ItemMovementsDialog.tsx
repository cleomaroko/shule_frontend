import { History } from 'lucide-react'
import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useItemMovements } from '@/features/store/hooks/useStore'
import {
  formatStoreQty,
  issuedToLabel,
  transactionTypeLabel,
  type StockLog,
  type StoreItem,
  type TransactionType,
} from '@/features/store/types/store.types'
import { displayValue, formatDate } from '@/lib/format'

function typeBadgeVariant(type: TransactionType | null | undefined) {
  switch (type) {
    case 'ADDITION':
      return 'success' as const
    case 'TRANSFER':
      return 'primary' as const
    case 'CONSUMPTION':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

function movementTo(log: StockLog): string {
  if (log.type === 'TRANSFER') return displayValue(log.destinationStore?.name)
  if (log.type === 'CONSUMPTION') return issuedToLabel(log)
  if (log.type === 'ADDITION') return displayValue(log.sourceStore?.name)
  return issuedToLabel(log)
}

export function ItemMovementsDialog({
  item,
  onOpenChange,
}: {
  item: StoreItem | null
  onOpenChange: (open: boolean) => void
}): ReactNode {
  const list = useItemMovements(item?.id ?? null)
  const rows = list.data ?? []

  const columns: Array<DataColumn<StockLog>> = [
    { id: 'date', header: 'Date', cell: (row) => formatDate(row.logDate) },
    {
      id: 'type',
      header: 'Type',
      cell: (row) => <Badge variant={typeBadgeVariant(row.type)}>{transactionTypeLabel(row.type)}</Badge>,
    },
    { id: 'from', header: 'From', cell: (row) => displayValue(row.sourceStore?.name) },
    { id: 'to', header: 'To / issued', cell: (row) => movementTo(row) },
    { id: 'qty', header: 'Qty', cell: (row) => formatStoreQty(row.quantity) },
    { id: 'by', header: 'Recorded by', hideOnMobile: true, cell: (row) => displayValue(row.recordedBy) },
  ]

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4" aria-hidden="true" />
            Movements · {item?.name}
          </DialogTitle>
          <DialogDescription>Every receipt, transfer, and issue for this item across all stores.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
          {list.isError ? (
            <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
          ) : rows.length === 0 && !list.isLoading ? (
            <EmptyState title="No movements yet" description="Receipts, transfers, and issues for this item will appear here." />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              getRowId={(row) => row.id}
              isLoading={list.isLoading}
              page={1}
              pageSize={Math.max(rows.length, 1)}
              total={rows.length}
              onPageChange={() => undefined}
              mobileCard={(row) => (
                <div>
                  <p className="type-heading">{transactionTypeLabel(row.type)}</p>
                  <p className="type-caption text-muted-foreground">
                    {formatDate(row.logDate)} · {displayValue(row.sourceStore?.name)} · Qty {formatStoreQty(row.quantity)}
                  </p>
                </div>
              )}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
