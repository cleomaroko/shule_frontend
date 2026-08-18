import { useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { Skeleton } from '@/components/ui/skeleton'
import { LearnerForm } from '@/features/learners/components/LearnerForm'
import { useLearner, useLearnerMutations } from '@/features/learners/hooks/useLearners'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export function LearnerEditPage(): ReactNode {
  useDocumentTitle('Edit learner')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'learner:write')
  const params = useParams()
  const id = Number(params.id)
  const { learner, isLoading, isError, error, isMissing, refetch } = useLearner(Number.isFinite(id) ? id : undefined)
  const { update } = useLearnerMutations()
  const navigate = useNavigate()

  if (!canWrite) {
    return <PageHeader title="Edit learner" description="Your account does not have permission to update learners." />
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
  if (!learner || isMissing) return <ErrorState title="Learner not found" message="That learner record is not in the current list." />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit learner"
        description="Only changed fields are sent. Null values are ignored by the backend; clearing a field sends an empty string."
      />
      <LearnerForm
        learner={learner}
        isSubmitting={update.isPending}
        submitLabel="Save changes"
        onSubmit={(payload) => {
          update.mutate(
            { id: learner.id, body: payload },
            { onSuccess: () => navigate(paths.learnerDetail(learner.id)) },
          )
        }}
      />
    </div>
  )
}
