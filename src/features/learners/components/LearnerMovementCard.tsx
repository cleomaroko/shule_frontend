import { useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Button } from '@/components/ui/button'
import { useAcademicTermList, useAcademicYearList } from '@/features/academic/hooks/useAcademic'
import { academicTermLabel } from '@/features/academic/types/academic.types'
import { useLearnerHistory, useLearnerMutations } from '@/features/learners/hooks/useLearners'
import type { DemotionBody, Learner } from '@/features/learners/types/learner.types'
import { useCampuses, useSchoolClasses } from '@/features/lookups/useLookups'
import { displayValue, formatCalendarDate, formatClassLabel, formatPersonName } from '@/lib/format'

export function LearnerMovementCard({
  learner,
  canWrite,
}: {
  learner: Learner
  canWrite: boolean
}): ReactNode {
  const history = useLearnerHistory(learner.id, canWrite)
  const campuses = useCampuses()
  const classes = useSchoolClasses()
  const years = useAcademicYearList()
  const terms = useAcademicTermList()
  const { transferCampus, transferExternal, rollbackSingle, demote } = useLearnerMutations()
  const [targetCampusId, setTargetCampusId] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [exitReason, setExitReason] = useState('')
  const [rollbackReason, setRollbackReason] = useState('')
  const [demoteCampusId, setDemoteCampusId] = useState(learner.campus?.id ? String(learner.campus.id) : '')
  const [demoteYearId, setDemoteYearId] = useState(learner.academicYear?.id ? String(learner.academicYear.id) : '')
  const [demoteTermId, setDemoteTermId] = useState('')
  const [demoteClass, setDemoteClass] = useState('')
  const [demoteStream, setDemoteStream] = useState('')
  const [demoteReason, setDemoteReason] = useState('')

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

  const demoteTerms = (terms.data ?? []).filter((term) => !demoteYearId || term.academicYear?.id === Number(demoteYearId))

  const handleRollback = (event: FormEvent) => {
    event.preventDefault()
    if (!rollbackReason.trim()) return
    rollbackSingle.mutate(
      { learnerId: learner.id, reason: rollbackReason.trim() },
      { onSuccess: () => setRollbackReason('') },
    )
  }

  const handleDemote = (event: FormEvent) => {
    event.preventDefault()
    const campusId = Number(demoteCampusId)
    const academicYearId = Number(demoteYearId)
    if (!campusId || !academicYearId || !demoteClass || !demoteReason.trim()) return
    const body: DemotionBody = {
      learnerId: learner.id,
      campusId,
      academicYearId,
      targetClass: demoteClass,
      reason: demoteReason.trim(),
    }
    if (demoteTermId) body.termId = Number(demoteTermId)
    if (demoteStream.trim()) body.targetStream = demoteStream.trim()
    demote.mutate(body, { onSuccess: () => setDemoteReason('') })
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

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleRollback} className="flex flex-col gap-4">
          <h3 className="type-label">Undo the last promotion</h3>
          <TextField
            label="Reason"
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            required
          />
          <Button type="submit" variant="secondary" className="w-full sm:w-auto" isLoading={rollbackSingle.isPending} loadingLabel="Reversing">
            Reverse last move
          </Button>
        </form>

        <form onSubmit={handleDemote} className="flex flex-col gap-4">
          <h3 className="type-label">Repeat or move down</h3>
          <SelectField
            label="Campus"
            value={demoteCampusId}
            onChange={setDemoteCampusId}
            options={(campuses.data ?? []).map((campus) => ({ value: String(campus.id), label: campus.name }))}
            emptyLabel="Select campus"
          />
          <SelectField
            label="Academic year"
            value={demoteYearId}
            onChange={(value) => {
              setDemoteYearId(value)
              setDemoteTermId('')
            }}
            options={(years.data ?? []).map((year) => ({ value: String(year.id), label: year.name }))}
            emptyLabel="Select year"
          />
          <SelectField
            label="Term"
            value={demoteTermId}
            onChange={setDemoteTermId}
            options={demoteTerms.map((term) => ({ value: String(term.id), label: academicTermLabel(term) }))}
            emptyLabel="Not set"
          />
          <SelectField
            label="Target class"
            value={demoteClass}
            onChange={setDemoteClass}
            options={(classes.data ?? []).map((item) => ({
              value: item.className?.trim() || formatClassLabel(item),
              label: formatClassLabel(item),
            }))}
            emptyLabel="Select class"
          />
          <TextField
            label="Target stream"
            value={demoteStream}
            onChange={(event) => setDemoteStream(event.target.value)}
          />
          <TextField
            label="Reason"
            value={demoteReason}
            onChange={(event) => setDemoteReason(event.target.value)}
            required
          />
          <Button type="submit" className="w-full sm:w-auto" isLoading={demote.isPending} loadingLabel="Saving">
            Update placement
          </Button>
        </form>
      </div>
    </section>
  )
}
