import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/feedback/PageStates'
import { StaffForm } from '@/features/staff/components/StaffForm'
import { useStaffMutations } from '@/features/staff/hooks/useStaff'
import type { StaffWritePayload } from '@/features/staff/types/staff.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export function StaffCreatePage(): ReactNode {
  useDocumentTitle('Add staff')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'staff:write')
  const navigate = useNavigate()
  const { create } = useStaffMutations()

  if (!canWrite) {
    return (
      <PageHeader
        title="Add staff"
        description="Your account does not have permission to register staff."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add staff"
        description="Creates a staff profile and a login account. The work email becomes the username; the backend sets the default password."
      />
      <StaffForm
        isSubmitting={create.isPending}
        submitLabel="Create staff"
        onSubmit={(payload: StaffWritePayload) => {
          create.mutate(payload, {
            onSuccess: (staff) => navigate(paths.staffDetail(staff.id)),
          })
        }}
      />
    </div>
  )
}
