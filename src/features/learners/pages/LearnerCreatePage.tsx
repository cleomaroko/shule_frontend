import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/feedback/PageStates'
import { LearnerForm } from '@/features/learners/components/LearnerForm'
import { useLearnerMutations } from '@/features/learners/hooks/useLearners'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export function LearnerCreatePage(): ReactNode {
  useDocumentTitle('Add learner')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'learner:write')
  const { create } = useLearnerMutations()
  const navigate = useNavigate()

  if (!canWrite) {
    return <PageHeader title="Add learner" description="Your account does not have permission to enrol learners." />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add learner"
        description="Complete the steps below. Leave the admission number blank to let the system generate one."
      />
      <LearnerForm
        isSubmitting={create.isPending}
        submitLabel="Enrol learner"
        onSubmit={(payload) => {
          create.mutate(payload, {
            onSuccess: (learner) => navigate(paths.learnerDetail(learner.id)),
          })
        }}
      />
    </div>
  )
}
