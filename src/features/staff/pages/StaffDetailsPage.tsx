import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { ErrorState } from '@/components/feedback/PageStates'
import { TextareaField } from '@/components/forms/TextareaField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { StaffProfile } from '@/features/staff/components/StaffProfile'
import { useStaff, useStaffMutations } from '@/features/staff/hooks/useStaff'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatPersonName } from '@/lib/format'
import { paths } from '@/routes/paths'

export function StaffDetailsPage(): ReactNode {
  const params = useParams()
  const id = Number(params.id)
  const { staff, isLoading, isError, error, isMissing, refetch } = useStaff(Number.isFinite(id) ? id : undefined)
  const { user } = useAuth()
  const canWrite = can(user?.role, 'staff:write')
  const { remove, resign } = useStaffMutations()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [resignOpen, setResignOpen] = useState(false)
  const [reason, setReason] = useState('')
  const resigned = (staff?.status ?? '').trim().toUpperCase() === 'RESIGNED'

  useDocumentTitle(staff ? formatPersonName(staff) : 'Staff')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError) return <ErrorState message={toUserMessage(error)} onRetry={() => void refetch()} />
  if (!staff || isMissing) return <ErrorState title="Staff not found" message="That staff record could not be found." />

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {canWrite && !resigned ? (
          <Button variant="outline" onClick={() => setResignOpen(true)}>
            Record resignation
          </Button>
        ) : null}
        {canWrite ? (
          <Button variant="outline" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        ) : null}
      </div>
      <StaffProfile staff={staff} canWrite={canWrite} />
      <Dialog
        open={resignOpen}
        onOpenChange={(next) => {
          setResignOpen(next)
          if (!next) setReason('')
        }}
      >
        <DialogContent className="w-[calc(100%-1rem)] max-w-md">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const trimmed = reason.trim()
              if (!trimmed) return
              resign.mutate(
                { id: staff.id, reason: trimmed },
                {
                  onSuccess: () => {
                    setResignOpen(false)
                    setReason('')
                  },
                },
              )
            }}
          >
            <DialogHeader>
              <DialogTitle>Record resignation</DialogTitle>
              <DialogDescription>
                This marks {formatPersonName(staff)} as resigned, sets today as the date they left, and removes their
                login.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <TextareaField
                label="Reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setResignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={resign.isPending} loadingLabel="Saving" disabled={!reason.trim()}>
                Record resignation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete staff member?"
        description={`This will permanently remove ${formatPersonName(staff)}. This action cannot be undone.`}
        confirmLabel="Delete staff"
        isConfirming={remove.isPending}
        onConfirm={() => {
          remove.mutate(staff.id, { onSuccess: () => navigate(paths.staff) })
        }}
      />
    </div>
  )
}
