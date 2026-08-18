import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { ErrorState } from '@/components/feedback/PageStates'
import { Button } from '@/components/ui/button'
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
  const { remove } = useStaffMutations()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

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
      <div className="flex justify-end">
        {canWrite ? (
          <Button variant="outline" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        ) : null}
      </div>
      <StaffProfile staff={staff} canWrite={canWrite} />
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
