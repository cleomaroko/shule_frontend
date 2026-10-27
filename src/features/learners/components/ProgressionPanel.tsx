import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { SelectField } from '@/components/forms/SelectField'
import { Button } from '@/components/ui/button'
import { useAcademicTermList, useAcademicYearList } from '@/features/academic/hooks/useAcademic'
import { academicTermLabel, calendarIsCurrent } from '@/features/academic/types/academic.types'
import { useLearnerList, useLearnerMutations } from '@/features/learners/hooks/useLearners'
import type { BulkPromotionBody, Learner } from '@/features/learners/types/learner.types'
import { useCampuses, useSchoolClasses } from '@/features/lookups/useLookups'
import { formatClassLabel, formatPersonName } from '@/lib/format'

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))),
  ).sort()
}

export function ProgressionPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const learners = useLearnerList()
  const campuses = useCampuses()
  const classes = useSchoolClasses()
  const years = useAcademicYearList()
  const terms = useAcademicTermList()
  const { promoteClass, graduateClass } = useLearnerMutations()

  const [campusId, setCampusId] = useState('')
  const [currentYearId, setCurrentYearId] = useState('')
  const [nextYearId, setNextYearId] = useState('')
  const [nextTermId, setNextTermId] = useState('')
  const [fromClass, setFromClass] = useState('')
  const [fromStream, setFromStream] = useState('')
  const [targetClass, setTargetClass] = useState('')
  const [targetStream, setTargetStream] = useState('')
  const [excluded, setExcluded] = useState<number[]>([])

  const [graduateCampusId, setGraduateCampusId] = useState('')
  const [graduateClassName, setGraduateClassName] = useState('')

  useEffect(() => {
    const currentYear = (years.data ?? []).find((year) => calendarIsCurrent(year))
    if (!currentYear) return
    setCurrentYearId((value) => value || String(currentYear.id))
    setNextYearId((value) => value || String(currentYear.id))
  }, [years.data])

  useEffect(() => {
    const current = (terms.data ?? []).find((term) => calendarIsCurrent(term))
    if (!current) return
    setNextTermId((value) => value || String(current.id))
  }, [terms.data])

  const campusLearners = useMemo(
    () => (learners.data ?? []).filter((learner) => String(learner.campus?.id ?? '') === campusId),
    [learners.data, campusId],
  )

  const fromClassOptions = useMemo(() => unique(campusLearners.map((learner) => learner.currentClass)), [campusLearners])

  const fromStreamOptions = useMemo(
    () =>
      unique(
        campusLearners
          .filter((learner) => learner.currentClass === fromClass)
          .map((learner) => learner.stream),
      ),
    [campusLearners, fromClass],
  )

  const candidates = useMemo(
    () =>
      campusLearners.filter((learner) => {
        if (learner.currentClass !== fromClass) return false
        if (fromStream && learner.stream !== fromStream) return false
        return true
      }),
    [campusLearners, fromClass, fromStream],
  )

  const nextTerms = useMemo(
    () => (terms.data ?? []).filter((term) => !nextYearId || term.academicYear?.id === Number(nextYearId)),
    [terms.data, nextYearId],
  )

  const targetClassRow = (classes.data ?? []).find((item) => item.className === targetClass)

  const graduateLearners = useMemo(
    () =>
      (learners.data ?? []).filter(
        (learner) =>
          String(learner.campus?.id ?? '') === graduateCampusId &&
          (learner.status ?? '').toUpperCase() === 'ACTIVE',
      ),
    [learners.data, graduateCampusId],
  )

  const graduateClasses = useMemo(
    () => unique(graduateLearners.map((learner) => learner.currentClass)),
    [graduateLearners],
  )

  const graduateCount = graduateLearners.filter((learner) => learner.currentClass === graduateClassName).length

  const toggleExcluded = (id: number) => {
    setExcluded((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const handlePromote = (event: FormEvent) => {
    event.preventDefault()
    const campus = Number(campusId)
    const currentYear = Number(currentYearId)
    const nextYear = Number(nextYearId)
    const nextTerm = Number(nextTermId)
    if (!campus || !currentYear || !nextYear || !nextTerm || !fromClass || !targetClass) return
    const body: BulkPromotionBody = {
      campusId: campus,
      currentYearId: currentYear,
      nextYearId: nextYear,
      nextTermId: nextTerm,
      fromClass,
      targetClass,
    }
    if (fromStream) body.fromStream = fromStream
    if (targetStream) body.targetStream = targetStream
    if (excluded.length) body.excludedLearnerIds = excluded
    promoteClass.mutate(body, {
      onSuccess: () => setExcluded([]),
    })
  }

  const handleGraduate = (event: FormEvent) => {
    event.preventDefault()
    const campus = Number(graduateCampusId)
    if (!campus || !graduateClassName) return
    graduateClass.mutate({ campusId: campus, className: graduateClassName })
  }

  if (!canWrite) {
    return (
      <p className="type-caption text-muted-foreground">
        Class promotion and graduation are available to administrators and heads.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handlePromote} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-6">
        <div>
          <h2 className="type-heading">Promote a class</h2>
          <p className="type-caption mt-1 text-muted-foreground">
            Moves every learner in the chosen class on this campus to the target class. Tick anyone who should stay behind.
            The target name must match a class in Academics.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Campus"
            value={campusId}
            onChange={(value) => {
              setCampusId(value)
              setFromClass('')
              setFromStream('')
              setExcluded([])
            }}
            options={(campuses.data ?? []).map((campus) => ({
              value: String(campus.id),
              label: [campus.name, campus.location].filter(Boolean).join(' · '),
            }))}
            placeholder="Select campus"
            emptyLabel="Select campus"
          />
          <SelectField
            label="Current academic year"
            value={currentYearId}
            onChange={setCurrentYearId}
            options={(years.data ?? []).map((year) => ({ value: String(year.id), label: year.name }))}
            placeholder="Select year"
            emptyLabel="Select year"
          />
          <SelectField
            label="Next academic year"
            value={nextYearId}
            onChange={(value) => {
              setNextYearId(value)
              setNextTermId('')
            }}
            options={(years.data ?? []).map((year) => ({ value: String(year.id), label: year.name }))}
            placeholder="Select year"
            emptyLabel="Select year"
          />
          <SelectField
            label="Next term"
            value={nextTermId}
            onChange={setNextTermId}
            options={nextTerms.map((term) => ({ value: String(term.id), label: academicTermLabel(term) }))}
            placeholder="Select term"
            emptyLabel="Select term"
          />
          <SelectField
            label="From class"
            value={fromClass}
            onChange={(value) => {
              setFromClass(value)
              setFromStream('')
              setExcluded([])
            }}
            options={fromClassOptions.map((name) => ({ value: name, label: name }))}
            placeholder={campusId ? 'Select class' : 'Select a campus first'}
            emptyLabel="Select class"
            emptyMessage="No current classes on this campus"
          />
          <SelectField
            label="From stream"
            value={fromStream}
            onChange={setFromStream}
            options={fromStreamOptions.map((name) => ({ value: name, label: name }))}
            placeholder="All streams"
            emptyLabel="All streams"
          />
          <SelectField
            label="Target class"
            value={targetClass}
            onChange={(value) => {
              setTargetClass(value)
              setTargetStream('')
            }}
            options={(classes.data ?? [])
              .filter((item) => item.className)
              .map((item) => ({
                value: item.className as string,
                label: formatClassLabel(item),
              }))}
            placeholder="Select class"
            emptyLabel="Select class"
          />
          <SelectField
            label="Target stream"
            value={targetStream}
            onChange={setTargetStream}
            options={(targetClassRow?.streams ?? []).map((stream) => ({ value: stream.name, label: stream.name }))}
            placeholder="Keep current stream"
            emptyLabel="Keep current stream"
          />
        </div>
        {candidates.length ? (
          <fieldset className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-xl border border-border p-3">
            <legend className="type-caption px-1 text-muted-foreground">
              Leave behind ({excluded.length} of {candidates.length})
            </legend>
            {candidates.map((learner) => (
              <LearnerCheck
                key={learner.id}
                learner={learner}
                checked={excluded.includes(learner.id)}
                onChange={() => toggleExcluded(learner.id)}
              />
            ))}
          </fieldset>
        ) : (
          <p className="type-caption text-muted-foreground">
            {fromClass ? 'No learners match this class and stream.' : 'Choose a class to see who will move.'}
          </p>
        )}
        <Button type="submit" className="w-full sm:w-auto" isLoading={promoteClass.isPending} loadingLabel="Promoting">
          Promote class
        </Button>
      </form>

      <form onSubmit={handleGraduate} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-6">
        <div>
          <h2 className="type-heading">Graduate a class</h2>
          <p className="type-caption mt-1 text-muted-foreground">
            Marks every active learner in the class as graduated alumni and stamps today as the date they left.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Campus"
            value={graduateCampusId}
            onChange={(value) => {
              setGraduateCampusId(value)
              setGraduateClassName('')
            }}
            options={(campuses.data ?? []).map((campus) => ({
              value: String(campus.id),
              label: campus.name,
            }))}
            placeholder="Select campus"
            emptyLabel="Select campus"
          />
          <SelectField
            label="Class"
            value={graduateClassName}
            onChange={setGraduateClassName}
            options={graduateClasses.map((name) => ({ value: name, label: name }))}
            placeholder={graduateCampusId ? 'Select class' : 'Select a campus first'}
            emptyLabel="Select class"
            emptyMessage="No active classes on this campus"
          />
        </div>
        <p className="type-caption text-muted-foreground">
          {graduateClassName ? `${graduateCount} active learner${graduateCount === 1 ? '' : 's'} will graduate.` : 'Choose a class to see the count.'}
        </p>
        <Button type="submit" className="w-full sm:w-auto" isLoading={graduateClass.isPending} loadingLabel="Graduating">
          Graduate class
        </Button>
      </form>
    </div>
  )
}

function LearnerCheck({
  learner,
  checked,
  onChange,
}: {
  learner: Learner
  checked: boolean
  onChange: () => void
}): ReactNode {
  return (
    <label className="flex items-start gap-3 rounded-lg px-1 py-1.5 hover:bg-muted/50">
      <input type="checkbox" className="mt-1 size-4 shrink-0" checked={checked} onChange={onChange} />
      <span className="min-w-0">
        <span className="type-body block">{formatPersonName(learner)}</span>
        <span className="type-caption text-muted-foreground">{learner.admissionNumber || 'No admission number'}</span>
      </span>
    </label>
  )
}
