import type { ReactNode } from 'react'

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
import type { Visitor } from '@/features/visitors/api/visitors.api'
import { displayValue, formatDateTime, formatPersonName } from '@/lib/format'

export interface VisitorDetailDialogProps {
  visitor: Visitor | null
  onOpenChange: (open: boolean) => void
}

export function VisitorDetailDialog({ visitor, onOpenChange }: VisitorDetailDialogProps): ReactNode {
  const onSite = visitor?.status !== 'OUT'
  return (
    <Dialog open={visitor !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {visitor?.fullName ?? 'Visitor'}
            {visitor ? (
              <Badge variant={onSite ? 'success' : 'neutral'}>{onSite ? 'On site' : visitor.stayDuration || 'Checked out'}</Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>Contact, host, and check-in details for this visit.</DialogDescription>
        </DialogHeader>
        {visitor ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 type-caption text-muted-foreground">
              <Detail label="Phone" value={displayValue(visitor.phoneNumber)} />
              <Detail label="National ID" value={displayValue(visitor.nationalId)} />
              <Detail label="Email" value={displayValue(visitor.emailAddress)} />
              <Detail label="Number plate" value={displayValue(visitor.numberPlate)} />
              <Detail label="Title" value={displayValue(visitor.titleName ?? visitor.title?.name)} />
              <Detail label="Gender" value={displayValue(visitor.genderName ?? visitor.gender?.name)} />
              <Detail label="Category" value={displayValue(visitor.categoryName ?? visitor.category?.name)} />
              <Detail label="Purpose" value={displayValue(visitor.purposeName ?? visitor.purpose?.name)} />
              <Detail label="Campus" value={displayValue(visitor.campusName ?? visitor.campus?.name)} />
              <Detail label="Department" value={displayValue(visitor.departmentName ?? visitor.department?.name)} />
              <Detail label="Staff visited" value={displayValue(visitor.staffName ?? personLabel(visitor.staffToVisit))} />
              <Detail label="Learner visited" value={displayValue(visitor.learnerName ?? personLabel(visitor.learnerToVisit))} />
              <Detail label="Checked in" value={formatDateTime(visitor.checkInTime)} />
              <Detail label="Checked out" value={formatDateTime(visitor.checkOutTime)} />
              <Detail label="Stay" value={displayValue(visitor.stayDuration)} />
            </dl>
            <div className="mt-4">
              <p className="type-caption font-medium text-muted-foreground">Comments</p>
              <p className="type-body mt-1 whitespace-pre-wrap">{displayValue(visitor.comments)}</p>
            </div>
          </div>
        ) : null}
        <DialogFooter className="border-t border-border px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Detail({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="min-w-0">
      <dt>{label}</dt>
      <dd className="font-medium break-words text-foreground">{value}</dd>
    </div>
  )
}

function personLabel(person: { firstName?: string | null; lastName?: string | null } | null | undefined): string | null {
  if (!person) return null
  const name = formatPersonName(person)
  return name.trim() ? name : null
}
