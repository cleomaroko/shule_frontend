import type { ReactNode } from 'react'

import { DataTable, type DataColumn } from '@/components/data/DataTable'
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
  asMoney,
  fulfillmentLabel,
  formatKes,
  requisitionStatusLabel,
  requisitionTypeLabel,
  statusBadgeVariant,
  type Requisition,
  type RequisitionItem,
} from '@/features/requisitions/types/requisition.types'
import { displayValue, formatDate, formatDateTime, formatPersonName } from '@/lib/format'

export interface RequisitionDetailDialogProps {
  requisition: Requisition | null
  canReview: boolean
  canApprove: boolean
  canReceive: boolean
  onOpenChange: (open: boolean) => void
  onReview: () => void
  onApprove: () => void
  onReceive: () => void
  onReject: () => void
}

function staffName(staff: Requisition['createdBy']): string {
  if (!staff) return '—'
  return formatPersonName(staff)
}

export function RequisitionDetailDialog({
  requisition,
  canReview,
  canApprove,
  canReceive,
  onOpenChange,
  onReview,
  onApprove,
  onReceive,
  onReject,
}: RequisitionDetailDialogProps): ReactNode {
  const items = requisition?.items ?? []
  const status = requisition?.status
  const showReview = canReview && status === 'SUBMITTED'
  const showApprove = canApprove && status === 'REVIEWED'
  const showReceive = canReceive && status === 'APPROVED'
  const showReject = (canReview || canApprove) && (status === 'SUBMITTED' || status === 'REVIEWED')

  const columns: Array<DataColumn<RequisitionItem>> = [
    { id: 'desc', header: 'Item', cell: (row) => displayValue(row.description) },
    { id: 'qty', header: 'Qty', cell: (row) => displayValue(row.quantity) },
    { id: 'unit', header: 'Unit', hideOnMobile: true, cell: (row) => displayValue(row.unit?.name) },
    { id: 'price', header: 'Unit price', hideOnMobile: true, cell: (row) => formatKes(row.unitPrice) },
    { id: 'total', header: 'Total', cell: (row) => formatKes(row.totalPrice ?? asMoney(row.unitPrice) * (row.quantity ?? 0)) },
    {
      id: 'source',
      header: 'Fulfillment',
      hideOnMobile: true,
      cell: (row) => fulfillmentLabel(row.fulfillmentSource),
    },
  ]

  return (
    <Dialog open={requisition !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-3xl flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {requisition?.requisitionNumber ?? 'Requisition'}
            {requisition ? (
              <Badge variant={statusBadgeVariant(requisition.status)}>
                {requisitionStatusLabel(requisition.status)}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {requisition
              ? `${requisitionTypeLabel(requisition.type)} · ${formatDate(requisition.requisitionDate)}`
              : 'Requisition detail'}
          </DialogDescription>
        </DialogHeader>
        {requisition ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-4 sm:px-6">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 type-caption text-muted-foreground">
              <div>
                <dt>Campus</dt>
                <dd className="font-medium text-foreground">{displayValue(requisition.campus?.name)}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd className="font-medium text-foreground">{displayValue(requisition.department?.name)}</dd>
              </div>
              <div>
                <dt>Cost center</dt>
                <dd className="font-medium text-foreground">{displayValue(requisition.costCenter?.name)}</dd>
              </div>
              <div>
                <dt>Source store</dt>
                <dd className="font-medium text-foreground">{displayValue(requisition.sourceStore?.name)}</dd>
              </div>
              <div>
                <dt>Destination store</dt>
                <dd className="font-medium text-foreground">{displayValue(requisition.destinationStore?.name)}</dd>
              </div>
              <div>
                <dt>Supplier</dt>
                <dd className="font-medium text-foreground">{displayValue(requisition.supplier?.name)}</dd>
              </div>
              <div>
                <dt>Estimated</dt>
                <dd className="font-medium text-foreground">{formatKes(requisition.totalEstimatedAmount)}</dd>
              </div>
              <div>
                <dt>Approved</dt>
                <dd className="font-medium text-foreground">{formatKes(requisition.approvedAmount)}</dd>
              </div>
              <div>
                <dt>Requested by</dt>
                <dd className="font-medium text-foreground">{staffName(requisition.createdBy)}</dd>
              </div>
            </dl>
            <div>
              <p className="type-caption font-medium text-muted-foreground">Purpose</p>
              <p className="type-body mt-1 whitespace-pre-wrap">{displayValue(requisition.purpose)}</p>
            </div>
            {isHttpUrl(requisition.documentUrl) ? (
              <p className="type-caption">
                Document:{' '}
                <a
                  href={requisition.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {requisition.documentUrl}
                </a>
              </p>
            ) : requisition.documentUrl ? (
              <p className="type-caption break-all">Document: {requisition.documentUrl}</p>
            ) : null}
            {requisition.status === 'REJECTED' && requisition.rejectionReason ? (
              <div className="rounded-xl border border-destructive/25 bg-destructive-subtle px-3 py-2">
                <p className="type-caption font-medium text-destructive">Rejection reason</p>
                <p className="type-body mt-1">{requisition.rejectionReason}</p>
              </div>
            ) : null}
            <div>
              <p className="type-caption mb-2 font-medium text-muted-foreground">Items</p>
              <DataTable
                columns={columns}
                rows={items}
                getRowId={(row) => row.id}
                page={1}
                pageSize={Math.max(items.length, 1)}
                total={items.length}
                onPageChange={() => undefined}
                mobileCard={(row) => (
                  <div className="flex flex-col gap-1">
                    <p className="type-heading">{displayValue(row.description)}</p>
                    <p className="type-caption text-muted-foreground">
                      Qty {displayValue(row.quantity)}
                      {row.unit?.name ? ` ${row.unit.name}` : ''} · {formatKes(row.totalPrice)}
                    </p>
                    <p className="type-caption text-muted-foreground">
                      {fulfillmentLabel(row.fulfillmentSource)}
                      {showPriceHint(row) ? ` · ${formatKes(row.unitPrice)} each` : ''}
                    </p>
                  </div>
                )}
              />
            </div>
            <ol className="space-y-2 type-caption text-muted-foreground">
              <li>
                Submitted {formatDateTime(requisition.createdAt)} by {staffName(requisition.createdBy)}
              </li>
              {requisition.reviewedAt ? (
                <li>
                  Reviewed {formatDateTime(requisition.reviewedAt)} by {staffName(requisition.reviewedBy)}
                  {requisition.reviewComment ? ` — ${requisition.reviewComment}` : ''}
                </li>
              ) : null}
              {requisition.approvedAt ? (
                <li>
                  Approved {formatDateTime(requisition.approvedAt)} by {staffName(requisition.approvedBy)}
                  {requisition.approvalComment ? ` — ${requisition.approvalComment}` : ''}
                </li>
              ) : null}
              {requisition.receivedAt ? (
                <li>
                  Received {formatDateTime(requisition.receivedAt)} by {staffName(requisition.receivedBy)}
                </li>
              ) : null}
            </ol>
          </div>
        ) : null}
        <DialogFooter className="flex-wrap gap-2 border-t border-border px-5 py-4 sm:px-6">
          {showReject ? (
            <Button type="button" variant="outline" onClick={onReject}>
              Reject
            </Button>
          ) : null}
          {showReview ? (
            <Button type="button" onClick={onReview}>
              Review
            </Button>
          ) : null}
          {showApprove ? (
            <Button type="button" onClick={onApprove}>
              Approve
            </Button>
          ) : null}
          {showReceive ? (
            <Button type="button" onClick={onReceive}>
              Confirm receipt
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function showPriceHint(row: RequisitionItem): boolean {
  return asMoney(row.unitPrice) > 0
}

function isHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false
  return /^https?:\/\//i.test(value)
}
