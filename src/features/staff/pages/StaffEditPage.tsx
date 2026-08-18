import { useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { Skeleton } from '@/components/ui/skeleton'
import { StaffForm } from '@/features/staff/components/StaffForm'
import { useStaff, useStaffMutations } from '@/features/staff/hooks/useStaff'
import type { StaffWritePayload } from '@/features/staff/types/staff.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export function StaffEditPage(): ReactNode {
  useDocumentTitle('Edit staff')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'staff:write')
  const params = useParams()
  const id = Number(params.id)
  const { staff, isLoading, isError, error, isMissing, refetch } = useStaff(Number.isFinite(id) ? id : undefined)
  const { update } = useStaffMutations()
  const navigate = useNavigate()

  if (!canWrite) {
    return <PageHeader title="Edit staff" description="Your account does not have permission to update staff." />
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError) return <ErrorState message={toUserMessage(error)} onRetry={() => void refetch()} />
  if (!staff || isMissing) return <ErrorState title="Staff not found" message="That staff record is not in the current list." />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Edit staff" description="The backend overwrites copied fields, so the full current profile is submitted." />
      <StaffForm
        staff={staff}
        isSubmitting={update.isPending}
        submitLabel="Save changes"
        onSubmit={(payload: StaffWritePayload) => {
          update.mutate(
            { id: staff.id, body: payload },
            { onSuccess: () => navigate(paths.staffDetail(staff.id)) },
          )
        }}
      />
    </div>
  )
}
