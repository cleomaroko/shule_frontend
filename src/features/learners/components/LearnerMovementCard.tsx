import { useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Button } from '@/components/ui/button'
import { useLearnerHistory, useLearnerMutations } from '@/features/learners/hooks/useLearners'
import type { Learner } from '@/features/learners/types/learner.types'
import { useCampuses } from '@/features/lookups/useLookups'
import { displayValue, formatCalendarDate, formatPersonName } from '@/lib/format'

export function LearnerMovementCard({
  learner,
  canWrite,
}: {
  learner: Learner
  canWrite: boolean
}): ReactNode {
  const history = useLearnerHistory(learner.id, canWrite)
  const campuses = useCampuses()
  const { transferCampus, transferExternal } = useLearnerMutations()
  const [targetCampusId, setTargetCampusId] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [exitReason, setExitReason] = useState('')

  if (!canWrite) return null

  const otherCampuses = (campuses.data ?? []).filter((campus) => campus.id !== learner.campus?.id)

  const handleTransfer = (event: FormEvent) => {
    event.preventDefault()
    const targetCampusIdNumber = Number(targetCampusId)
    if (!targetCampusIdNumber) return
    transferCampus.mutate(
      { learnerId: learner.id, targetCampusId: targetCampusIdNumber, reason: transferReason.trim() },
      {
        onSuccess: () => {
          setTargetCampusId('')
          setTransferReason('')
        },
      },
    )
  }

  const handleExit = (event: FormEvent) => {
    event.preventDefault()
    const name = schoolName.trim()
    if (!name) return
    transferExternal.mutate(
      { learnerId: learner.id, newSchoolName: name, reason: exitReason.trim() },
      {
        onSuccess: () => {
          setSchoolName('')
          setExitReason('')
        },
      },
    )
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-6">
      <div>
        <h2 className="type-heading">Campus and exit</h2>
        <p className="type-caption mt-1 text-muted-foreground">
          {formatPersonName(learner)} is at {displayValue(learner.campus?.name)}. A campus move keeps the learner enrolled.
          An external exit marks them transferred out today.
        </p>
      </div>

      {history.isError ? (
        <ErrorState message={toUserMessage(history.error)} onRetry={() => void history.refetch()} />
      ) : history.isLoading ? (
        <p className="type-caption text-muted-foreground">Loading placement history…</p>
      ) : (history.data?.length ?? 0) === 0 ? (
        <p className="type-caption text-muted-foreground">No promotion or transfer history yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {history.data?.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-border p-3">
              <p className="type-label">{displayValue(entry.status)}</p>
              <p className="type-caption mt-1 text-muted-foreground">
                {[entry.campus, entry.className, entry.stream].filter((part) => part && part !== '—' && part !== 'None').join(' · ') ||
                  'Placement not recorded'}
              </p>
              <p className="type-caption mt-1 text-muted-foreground">
                {[entry.academicYear, entry.term].filter((part) => part && part !== '—').join(' · ')}
                {entry.promotionDate ? ` · ${formatCalendarDate(entry.promotionDate)}` : ''}
                {entry.actionBy ? ` · ${entry.actionBy}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleTransfer} className="flex flex-col gap-4">
          <h3 className="type-label">Transfer campus</h3>
          <SelectField
            label="Target campus"
            value={targetCampusId}
            onChange={setTargetCampusId}
            options={otherCampuses.map((campus) => ({
              value: String(campus.id),
              label: [campus.name, campus.location].filter(Boolean).join(' · '),
            }))}
            placeholder={otherCampuses.length ? 'Select campus' : 'No other campus'}
            emptyLabel="Select campus"
            emptyMessage="No other campus is set up"
          />
          <TextField
            label="Reason"
            value={transferReason}
            onChange={(event) => setTransferReason(event.target.value)}
            placeholder="Family moved"
          />
          <Button
            type="submit"
            className="w-full sm:w-auto"
            isLoading={transferCampus.isPending}
            loadingLabel="Transferring"
            disabled={!otherCampuses.length}
          >
            Transfer campus
          </Button>
        </form>

        <form onSubmit={handleExit} className="flex flex-col gap-4">
          <h3 className="type-label">Leave for another school</h3>
          <TextField
            label="New school"
            value={schoolName}
            onChange={(event) => setSchoolName(event.target.value)}
            required
          />
          <TextField
            label="Reason"
            value={exitReason}
            onChange={(event) => setExitReason(event.target.value)}
          />
          <Button type="submit" variant="secondary" className="w-full sm:w-auto" isLoading={transferExternal.isPending} loadingLabel="Saving">
            Record exit
          </Button>
        </form>
      </div>
    </section>
  )
}
