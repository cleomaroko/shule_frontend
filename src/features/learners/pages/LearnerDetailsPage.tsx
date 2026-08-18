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
import { LearnerProfile } from '@/features/learners/components/LearnerProfile'
import { useLearner, useLearnerMutations } from '@/features/learners/hooks/useLearners'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatPersonName } from '@/lib/format'
import { paths } from '@/routes/paths'

export function LearnerDetailsPage(): ReactNode {
  const params = useParams()
  const id = Number(params.id)
  const { learner, isLoading, isError, error, isMissing, refetch } = useLearner(Number.isFinite(id) ? id : undefined)
  const { user } = useAuth()
  const canWrite = can(user?.role, 'learner:write')
  const { remove } = useLearnerMutations()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  useDocumentTitle(learner ? formatPersonName(learner) : 'Learner')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError) return <ErrorState message={toUserMessage(error)} onRetry={() => void refetch()} />
  if (!learner || isMissing) return <ErrorState title="Learner not found" message="That learner record could not be found." />

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        {canWrite ? (
          <Button variant="outline" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        ) : null}
      </div>
      <LearnerProfile learner={learner} canWrite={canWrite} />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete learner?"
        description={`This will permanently remove ${formatPersonName(learner)}. This action cannot be undone.`}
        confirmLabel="Delete learner"
        isConfirming={remove.isPending}
        onConfirm={() => {
          remove.mutate(learner.id, { onSuccess: () => navigate(paths.learners) })
        }}
      />
    </div>
  )
}
