import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { KeyboardEvent, ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { isActiveStatus } from '@/lib/format'

export interface DataColumn<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
  hideOnMobile?: boolean
}

export interface DataTableProps<T> {
  columns: Array<DataColumn<T>>
  rows: T[]
  getRowId: (row: T) => string | number
  isLoading?: boolean
  mobileCard?: (row: T) => ReactNode
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onRowClick?: (row: T) => void
  rowAriaLabel?: (row: T) => string
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  mobileCard,
  page,
  pageSize,
  total,
  onPageChange,
  onRowClick,
  rowAriaLabel,
}: DataTableProps<T>): ReactNode {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const actionColumn = columns.find((column) => column.id === 'actions')

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'type-caption px-4 py-3 font-semibold tracking-wide text-muted-foreground uppercase',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowId(row)}
                className={cn(
                  'border-b border-border last:border-0 hover:bg-muted/40',
                  onRowClick ? 'cursor-pointer' : undefined,
                )}
                {...(onRowClick
                  ? {
                      tabIndex: 0,
                      role: 'button',
                      'aria-label': rowAriaLabel?.(row) ?? 'View details',
                      onClick: () => onRowClick(row),
                      onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onRowClick(row)
                        }
                      },
                    }
                  : {})}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn('type-body px-4 py-3.5 align-middle', column.className)}
                    onClick={
                      column.id === 'actions'
                        ? (event) => {
                            event.stopPropagation()
                          }
                        : undefined
                    }
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 p-3 md:hidden">
        {rows.map((row) => (
          <div
            key={getRowId(row)}
            className={cn(
              'rounded-xl border border-border p-4',
              onRowClick ? 'cursor-pointer hover:bg-muted/40' : undefined,
            )}
            {...(onRowClick
              ? {
                  tabIndex: 0,
                  role: 'button',
                  'aria-label': rowAriaLabel?.(row) ?? 'View details',
                  onClick: () => onRowClick(row),
                  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onRowClick(row)
                    }
                  },
                }
              : {})}
          >
            {mobileCard ? mobileCard(row) : null}
            {actionColumn ? (
              <div
                className="mt-3 flex justify-end border-t border-border pt-3"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {actionColumn.cell(row)}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="type-caption text-muted-foreground">
          {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="type-caption min-w-16 text-center text-muted-foreground">
            {page} / {pageCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string | null | undefined }): ReactNode {
  const label = status?.trim() || 'Unknown'
  const active = isActiveStatus(status)
  const inactive = ['inactive', 'left', 'cleared', 'exited'].includes(label.toLowerCase())

  return (
    <Badge variant={active ? 'success' : inactive ? 'neutral' : 'warning'}>{label}</Badge>
  )
}
