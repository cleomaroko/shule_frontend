import { ClipboardList } from 'lucide-react'
import type { ReactNode } from 'react'

import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState } from '@/components/feedback/PageStates'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { weekdayLabel } from '@/features/store/lib/store-report'
import {
  formatStoreQty,
  isPendingTransfer,
  issuedToLabel,
  transactionTypeLabel,
  transferStatusLabel,
  type StockLog,
  type StoreReportRow,
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

function storeLine(store: StockLog['sourceStore']): string {
  if (!store?.name) return '—'
  const campus = store.campus?.name?.trim()
  return campus ? `${store.name} · ${campus}` : store.name
}

function logFrom(log: StockLog): string {
  if (log.type === 'ADDITION') return displayValue(log.supplier?.name)
  return storeLine(log.sourceStore)
}

function logTo(log: StockLog): string {
  if (log.type === 'TRANSFER') return storeLine(log.destinationStore)
  if (log.type === 'CONSUMPTION') return issuedToLabel(log)
  if (log.type === 'ADDITION' || log.type === 'BALANCE_BF') return storeLine(log.sourceStore)
  return issuedToLabel(log)
}

function categoryLine(row: StoreReportRow): string {
  return [row.parentCategoryName, row.categoryName].filter(Boolean).join(' · ')
}

export function WeeklyReportDetailDialog({
  row,
  days,
  onOpenChange,
}: {
  row: StoreReportRow | null
  days: string[]
  onOpenChange: (open: boolean) => void
}): ReactNode {
  const logs = row?.weeklyLogs ?? []

  const columns: Array<DataColumn<StockLog>> = [
    { id: 'date', header: 'Date', cell: (log) => formatDate(log.logDate) },
    {
      id: 'type',
      header: 'Type',
      cell: (log) => <Badge variant={typeBadgeVariant(log.type)}>{transactionTypeLabel(log.type)}</Badge>,
    },
    { id: 'from', header: 'From', cell: (log) => logFrom(log) },
    { id: 'to', header: 'To / issued', cell: (log) => logTo(log) },
    { id: 'qty', header: 'Qty', cell: (log) => formatStoreQty(log.quantity) },
    {
      id: 'status',
      header: 'Status',
      cell: (log) =>
        log.type === 'TRANSFER' ? (
          <Badge variant={isPendingTransfer(log) ? 'warning' : 'success'}>{transferStatusLabel(log.status)}</Badge>
        ) : (
          '—'
        ),
    },
    { id: 'by', header: 'Recorded by', hideOnMobile: true, cell: (log) => displayValue(log.recordedBy) },
  ]

  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-3xl flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="size-4" aria-hidden="true" />
            {row?.itemName ?? 'Weekly detail'}
          </DialogTitle>
          <DialogDescription>
            {row
              ? [row.unitName, categoryLine(row)].filter(Boolean).join(' · ') ||
                'Week totals and logs from GET /api/store/stock-take.'
              : 'Week totals and logs from GET /api/store/stock-take.'}
          </DialogDescription>
        </DialogHeader>
        {row ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5 sm:px-6">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 type-caption text-muted-foreground">
              <div>
                <dt>Balance B/F</dt>
                <dd className="type-heading text-foreground">{formatStoreQty(row.balanceBf)}</dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd className="type-heading text-foreground">{formatStoreQty(row.additionalStock)}</dd>
              </div>
              <div>
                <dt>Total stock</dt>
                <dd className="type-heading text-foreground">{formatStoreQty(row.totalStock)}</dd>
              </div>
              <div>
                <dt>Week release</dt>
                <dd className="type-heading text-foreground">{formatStoreQty(row.weekRelease)}</dd>
              </div>
              <div>
                <dt>Closing</dt>
                <dd className="type-heading text-foreground">{formatStoreQty(row.closingBalance)}</dd>
              </div>
            </dl>
            <div>
              <p className="type-caption mb-2 font-medium text-muted-foreground">Daily usage</p>
              <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6 type-caption text-muted-foreground">
                {days.map((day) => (
                  <div key={day} className="rounded-lg border border-border bg-muted/40 px-2.5 py-2">
                    <dt>{weekdayLabel(day)}</dt>
                    <dd className="font-medium text-foreground">{formatStoreQty(row.byDate[day] ?? 0)}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <p className="type-caption mb-2 font-medium text-muted-foreground">This week’s logs</p>
              {logs.length === 0 ? (
                <EmptyState
                  title="No logs this week"
                  description="Receipts, transfers, and issues for this item in the selected week will appear here."
                />
              ) : (
                <DataTable
                  columns={columns}
                  rows={logs}
                  getRowId={(log) => log.id}
                  page={1}
                  pageSize={Math.max(logs.length, 1)}
                  total={logs.length}
                  onPageChange={() => undefined}
                  mobileCard={(log) => (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="type-heading">{transactionTypeLabel(log.type)}</p>
                          <p className="type-caption text-muted-foreground">{formatDate(log.logDate)}</p>
                        </div>
                        <p className="font-medium">{formatStoreQty(log.quantity)}</p>
                      </div>
                      <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                        <div>
                          <dt>From</dt>
                          <dd className="font-medium text-foreground">{logFrom(log)}</dd>
                        </div>
                        <div>
                          <dt>To</dt>
                          <dd className="font-medium text-foreground">{logTo(log)}</dd>
                        </div>
                        {log.recordedBy ? (
                          <div className="col-span-2">
                            <dt>Recorded by</dt>
                            <dd className="font-medium text-foreground">{log.recordedBy}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
