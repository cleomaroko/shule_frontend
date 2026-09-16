import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { SearchField } from '@/components/data/FilterBar'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { SwitchField } from '@/components/forms/SwitchField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { academicTermLabel } from '@/features/academic/types/academic.types'
import {
  useAcademicTermList,
  useClassList,
  useLearningAreaList,
  useStreamList,
} from '@/features/academic/hooks/useAcademic'
import {
  useExamAnalysis,
  useExamConfig,
  useExamMutations,
  useExamTypeList,
  useGradingScaleList,
  usePathwayDistribution,
} from '@/features/exams/hooks/useExams'
import {
  configContributesToTotal,
  examTypeIncludedInFinal,
  gradeForMark,
  markPercent,
  type ExamMarkPayload,
  type ExamRecord,
  type ExamSubjectConfig,
  type ExamType,
  type ExamTypeWritePayload,
  type GradingScale,
} from '@/features/exams/types/exam.types'
import { useLearnerList } from '@/features/learners/hooks/useLearners'
import { BreakdownCard, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatClassLabel, formatPersonName } from '@/lib/format'
import { learnerMatchesClass, learnerMatchesClassStream } from '@/lib/learner-class'

const PAGE_SIZE = 10
const TABS = ['marks', 'analysis', 'pathways', 'setup'] as const
type ExamTab = (typeof TABS)[number]

function isTab(value: string | null): value is ExamTab {
  return TABS.some((tab) => tab === value)
}

function percentLabel(row: Pick<ExamRecord, 'marksScored' | 'outOf'>): string {
  const percent = markPercent(row)
  if (percent == null) return '—'
  return `${percent.toFixed(1)}%`
}

function joinRequired(items: string[]): string {
  if (items.length === 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

export function ExamsPage(): ReactNode {
  useDocumentTitle('Exams')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: ExamTab = isTab(raw) ? raw : 'marks'
  const canWrite = can(user?.role, 'exam:write')
  const canSetup = can(user?.role, 'exam:setup')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exams"
        description="Enter marks, configure which subjects count, and view pathway analysis. Analysis requires a learner and term; distribution requires a class and term."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="marks">Marks</TabsTrigger>
          <TabsTrigger value="analysis">Learner analysis</TabsTrigger>
          <TabsTrigger value="pathways">Pathways</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>
        <TabsContent value="marks">
          <MarksPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="analysis">
          <AnalysisPanel />
        </TabsContent>
        <TabsContent value="pathways">
          <PathwaysPanel />
        </TabsContent>
        <TabsContent value="setup">
          <SetupPanel canWrite={canSetup} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MarksPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const classes = useClassList()
  const streams = useStreamList()
  const types = useExamTypeList()
  const subjects = useLearningAreaList()
  const terms = useAcademicTermList()
  const learners = useLearnerList()
  const scales = useGradingScaleList()
  const { addMarksBatch } = useExamMutations()

  const [classId, setClassId] = useState('')
  const [streamId, setStreamId] = useState('')
  const [examTypeId, setExamTypeId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [termId, setTermId] = useState('')
  const [outOf, setOutOf] = useState('100')
  const [query, setQuery] = useState('')
  const [scores, setScores] = useState<Record<number, string>>({})
  const [scoreErrors, setScoreErrors] = useState<Record<number, string>>({})
  const [fieldErrors, setFieldErrors] = useState<{
    classId?: string | undefined
    examTypeId?: string | undefined
    subjectId?: string | undefined
    termId?: string | undefined
    outOf?: string | undefined
  }>({})

  const selectedClass = (classes.data ?? []).find((item) => String(item.id) === classId)
  const streamOptions = (selectedClass?.streams?.length ? selectedClass.streams : streams.data) ?? []
  const selectedStream = streamOptions.find((item) => String(item.id) === streamId)

  const roster = useMemo(() => {
    const all = learners.data ?? []
    if (!selectedClass) return []
    const matched = selectedStream
      ? all.filter((learner) => learnerMatchesClassStream(learner, selectedClass, selectedStream))
      : all.filter((learner) => learnerMatchesClass(learner, selectedClass))
    const source = matched.length > 0 ? matched : all
    const needle = query.trim().toLowerCase()
    return source.filter((learner) => {
      if (!needle) return true
      return [formatPersonName(learner), learner.admissionNumber].join(' ').toLowerCase().includes(needle)
    })
  }, [learners.data, query, selectedClass, selectedStream])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canWrite) return

    const nextErrors: typeof fieldErrors = {}
    const missing: string[] = []
    if (!classId) {
      nextErrors.classId = 'Select a class.'
      missing.push('class')
    }
    if (!examTypeId) {
      nextErrors.examTypeId =
        (types.data ?? []).length === 0 ? 'Add an exam type under Setup first.' : 'Select an exam type.'
      missing.push('exam type')
    }
    if (!subjectId) {
      nextErrors.subjectId = 'Select a learning area.'
      missing.push('learning area')
    }
    if (!termId) {
      nextErrors.termId = 'Select a term.'
      missing.push('term')
    }
    const max = Number(outOf)
    if (!outOf.trim() || !Number.isFinite(max) || max <= 0) {
      nextErrors.outOf = 'Enter a maximum mark greater than 0.'
      missing.push('out of')
    }
    setFieldErrors(nextErrors)

    if (missing.length > 0) {
      toast.error(`${joinRequired(missing)} ${missing.length === 1 ? 'is' : 'are'} required to save exam records.`)
      return
    }

    if (roster.length === 0) {
      toast.error('Choose a class with learners before entering marks.')
      return
    }

    const schoolClass = Number(classId)
    const examType = Number(examTypeId)
    const subject = Number(subjectId)
    const term = Number(termId)
    const nextScoreErrors: Record<number, string> = {}
    const rows: ExamMarkPayload[] = []
    let typedCount = 0

    for (const learner of roster) {
      const rawScore = scores[learner.id]?.trim() ?? ''
      if (!rawScore) continue
      typedCount += 1
      const marksScored = Number(rawScore)
      if (!Number.isFinite(marksScored)) {
        nextScoreErrors[learner.id] = 'Enter a number.'
        continue
      }
      if (marksScored < 0) {
        nextScoreErrors[learner.id] = 'Marks cannot be negative.'
        continue
      }
      if (marksScored > max) {
        nextScoreErrors[learner.id] = `Cannot be more than ${max}.`
        continue
      }
      const body: ExamMarkPayload = {
        learner: { id: learner.id },
        examType: { id: examType },
        subject: { id: subject },
        term: { id: term },
        schoolClass: { id: schoolClass },
        marksScored,
        outOf: max,
      }
      if (streamId) body.stream = { id: Number(streamId) }
      rows.push(body)
    }

    setScoreErrors(nextScoreErrors)

    if (typedCount === 0) {
      toast.error('Enter at least one mark. Blank rows are skipped and nothing is sent until a number is typed.')
      return
    }
    if (Object.keys(nextScoreErrors).length > 0) {
      toast.error('Some marks are not valid numbers between 0 and the out-of total. Fix the highlighted rows.')
      return
    }

    addMarksBatch.mutate(rows)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SelectField
          label="Class"
          value={classId}
          onChange={(value) => {
            setClassId(value)
            setStreamId('')
            setFieldErrors((current) => ({ ...current, classId: undefined }))
          }}
          options={(classes.data ?? []).map((item) => ({ value: String(item.id), label: formatClassLabel(item) }))}
          allowEmpty={false}
          placeholder="Select class"
          hint="Required"
          error={fieldErrors.classId}
        />
        <SelectField
          label="Stream"
          value={streamId}
          onChange={setStreamId}
          options={streamOptions.map((item) => ({ value: String(item.id), label: item.name }))}
          emptyLabel="Optional"
        />
        <SelectField
          label="Exam type"
          value={examTypeId}
          onChange={(value) => {
            setExamTypeId(value)
            setFieldErrors((current) => ({ ...current, examTypeId: undefined }))
          }}
          options={(types.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
          allowEmpty={false}
          placeholder="Select type"
          hint="Required"
          error={fieldErrors.examTypeId}
          emptyMessage="Add exam types under Setup first."
        />
        <SelectField
          label="Learning area"
          value={subjectId}
          onChange={(value) => {
            setSubjectId(value)
            setFieldErrors((current) => ({ ...current, subjectId: undefined }))
          }}
          options={(subjects.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
          allowEmpty={false}
          placeholder="Select subject"
          hint="Required"
          error={fieldErrors.subjectId}
        />
        <SelectField
          label="Term"
          value={termId}
          onChange={(value) => {
            setTermId(value)
            setFieldErrors((current) => ({ ...current, termId: undefined }))
          }}
          options={(terms.data ?? []).map((item) => ({ value: String(item.id), label: academicTermLabel(item) }))}
          allowEmpty={false}
          placeholder="Select term"
          hint="Required"
          error={fieldErrors.termId}
        />
        <TextField
          label="Out of"
          type="number"
          min="1"
          step="0.01"
          value={outOf}
          onChange={(event) => {
            setOutOf(event.target.value)
            setFieldErrors((current) => ({ ...current, outOf: undefined }))
          }}
          required
          hint="Required"
          error={fieldErrors.outOf}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search learner" />
        {canWrite ? (
          <Button type="submit" isLoading={addMarksBatch.isPending} loadingLabel="Saving">
            Save entered marks
          </Button>
        ) : null}
      </div>

      {roster.length === 0 ? (
        <EmptyState
          title="Choose class to enter marks"
          description="Class, exam type, learning area, term, and out-of are required. Type a number in at least one Marks field; blank rows are skipped."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {roster.map((learner) => {
            const raw = scores[learner.id] ?? ''
            const scored = raw === '' ? null : Number(raw)
            const percent = scored == null || !Number.isFinite(scored) ? null : markPercent({ marksScored: scored, outOf: Number(outOf) || 0 })
            const grade = gradeForMark(percent, scales.data ?? [])
            return (
              <li key={learner.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="type-heading truncate">{formatPersonName(learner)}</p>
                  <p className="type-caption text-muted-foreground">{displayValue(learner.admissionNumber)}</p>
                </div>
                <div className="flex items-end gap-3">
                  <TextField
                    label="Marks"
                    type="number"
                    min="0"
                    step="0.01"
                    value={raw}
                    onChange={(event) => {
                      setScores((current) => ({ ...current, [learner.id]: event.target.value }))
                      setScoreErrors((current) => {
                        const next = { ...current }
                        delete next[learner.id]
                        return next
                      })
                    }}
                    containerClassName="w-36"
                    disabled={!canWrite}
                    error={scoreErrors[learner.id]}
                  />
                  <p className="type-caption w-24 pb-2.5 text-muted-foreground">
                    {percent == null ? '—' : `${percent.toFixed(0)}%`}
                    {grade?.descriptiveLevel ? ` · ${grade.descriptiveLevel}` : ''}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </form>
  )
}

function AnalysisPanel(): ReactNode {
  const learners = useLearnerList()
  const terms = useAcademicTermList()
  const scales = useGradingScaleList()
  const [learnerId, setLearnerId] = useState('')
  const [termId, setTermId] = useState('')
  const analysis = useExamAnalysis(learnerId ? Number(learnerId) : null, termId ? Number(termId) : null)
  const results = analysis.data?.results ?? []

  const columns: Array<DataColumn<ExamRecord>> = [
    { id: 'subject', header: 'Learning area', cell: (row) => displayValue(row.subject?.name) },
    { id: 'type', header: 'Exam', hideOnMobile: true, cell: (row) => displayValue(row.examType?.name) },
    {
      id: 'marks',
      header: 'Marks',
      cell: (row) => `${displayValue(row.marksScored)} / ${displayValue(row.outOf)}`,
    },
    {
      id: 'percent',
      header: '%',
      cell: (row) => {
        const grade = gradeForMark(markPercent(row), scales.data ?? [])
        return grade?.descriptiveLevel ? `${percentLabel(row)} · ${grade.descriptiveLevel}` : percentLabel(row)
      },
    },
  ]

  if (analysis.isError) {
    return <ErrorState message={toUserMessage(analysis.error)} onRetry={() => void analysis.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Learner"
          value={learnerId}
          onChange={setLearnerId}
          options={(learners.data ?? []).map((item) => ({
            value: String(item.id),
            label: `${formatPersonName(item)}${item.admissionNumber ? ` · ${item.admissionNumber}` : ''}`,
          }))}
          allowEmpty={false}
          placeholder="Select learner"
        />
        <SelectField
          label="Term"
          value={termId}
          onChange={setTermId}
          options={(terms.data ?? []).map((item) => ({ value: String(item.id), label: academicTermLabel(item) }))}
          allowEmpty={false}
          placeholder="Select term"
        />
      </div>

      {!learnerId || !termId ? (
        <EmptyState
          title="Select learner and term"
          description="GET /api/exams/report/analysis requires learnerId and termId. It returns pathway, track, and the exam records for that term."
        />
      ) : analysis.isLoading ? (
        <EmptyState title="Loading analysis" description="Fetching pathway and results." />
      ) : (
        <>
          <StatGrid
            items={[
              { label: 'Pathway', value: analysis.data?.pathway || '—', hint: 'From subject-name grouping on the server' },
              { label: 'Track', value: analysis.data?.track || '—', hint: 'Returned with the analysis payload' },
              { label: 'Papers', value: results.length.toLocaleString(), hint: 'Exam records in this term' },
            ]}
          />
          {results.length === 0 ? (
            <EmptyState title="No papers for this term" description="Enter marks first, then reopen this analysis." />
          ) : (
            <DataTable
              columns={columns}
              rows={results}
              getRowId={(row) => row.id}
              page={1}
              pageSize={Math.max(results.length, 1)}
              total={results.length}
              onPageChange={() => undefined}
              mobileCard={(row) => (
                <div>
                  <p className="type-heading">{displayValue(row.subject?.name)}</p>
                  <p className="type-caption text-muted-foreground">
                    {percentLabel(row)} · {displayValue(row.examType?.name)}
                  </p>
                </div>
              )}
            />
          )}
        </>
      )}
    </div>
  )
}

function PathwaysPanel(): ReactNode {
  const classes = useClassList()
  const terms = useAcademicTermList()
  const [classId, setClassId] = useState('')
  const [termId, setTermId] = useState('')
  const distribution = usePathwayDistribution(classId ? Number(classId) : null, termId ? Number(termId) : null)
  const entries = Object.entries(distribution.data ?? {}).map(([label, count]) => ({
    label,
    count: Number(count) || 0,
  }))

  if (distribution.isError) {
    return <ErrorState message={toUserMessage(distribution.error)} onRetry={() => void distribution.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Class"
          value={classId}
          onChange={setClassId}
          options={(classes.data ?? []).map((item) => ({ value: String(item.id), label: formatClassLabel(item) }))}
          allowEmpty={false}
          placeholder="Select class"
        />
        <SelectField
          label="Term"
          value={termId}
          onChange={setTermId}
          options={(terms.data ?? []).map((item) => ({ value: String(item.id), label: academicTermLabel(item) }))}
          allowEmpty={false}
          placeholder="Select term"
        />
      </div>
      {!classId || !termId ? (
        <EmptyState
          title="Select class and term"
          description="GET /api/exams/report/pathway-distribution requires classId and termId."
        />
      ) : (
        <BreakdownCard
          title="Pathway distribution"
          rows={entries}
          empty="The endpoint returned no pathway counts for this class and term."
          loading={distribution.isLoading}
        />
      )}
    </div>
  )
}

function SetupPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const [params, setParams] = useSearchParams()
  const lookup = params.get('lookup') === 'grading' ? 'grading' : params.get('lookup') === 'config' ? 'config' : 'types'

  return (
    <Tabs value={lookup} onValueChange={(value) => setParams({ tab: 'setup', lookup: value }, { replace: true })}>
      <TabsList>
        <TabsTrigger value="types">Exam types</TabsTrigger>
        <TabsTrigger value="grading">Grading</TabsTrigger>
        <TabsTrigger value="config">Subject config</TabsTrigger>
      </TabsList>
      <TabsContent value="types">
        <ExamTypesManager canWrite={canWrite} />
      </TabsContent>
      <TabsContent value="grading">
        <GradingManager canWrite={canWrite} />
      </TabsContent>
      <TabsContent value="config">
        <ConfigManager canWrite={canWrite} />
      </TabsContent>
    </Tabs>
  )
}

function ExamTypesManager({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useExamTypeList()
  const { createType, updateType, deleteType } = useExamMutations()
  const [name, setName] = useState('')
  const [included, setIncluded] = useState(true)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<ExamType | null>(null)
  const [editName, setEditName] = useState('')
  const [editIncluded, setEditIncluded] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ExamType | null>(null)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const payload = (typeName: string, includedInFinal: boolean): ExamTypeWritePayload => ({
    name: typeName,
    includedInFinal,
    isIncludedInFinal: includedInFinal,
  })

  const columns: Array<DataColumn<ExamType>> = [
    { id: 'name', header: 'Name', cell: (row) => row.name },
    {
      id: 'final',
      header: 'In final',
      cell: (row) => (
        <Badge variant={examTypeIncludedInFinal(row) ? 'success' : 'neutral'}>
          {examTypeIncludedInFinal(row) ? 'Included' : 'Not included'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (row) =>
        canWrite ? (
          <span className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${row.name}`}
              onClick={() => {
                setEditing(row)
                setEditName(row.name)
                setEditIncluded(examTypeIncludedInFinal(row))
              }}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Delete ${row.name}`} onClick={() => setPendingDelete(row)}>
              <Trash2 aria-hidden="true" />
            </Button>
          </span>
        ) : null,
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const trimmed = name.trim()
            if (!trimmed) return
            createType.mutate(payload(trimmed, included), { onSuccess: () => setName('') })
          }}
          className="flex flex-col gap-3 lg:flex-row lg:items-end"
        >
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} containerClassName="flex-1" required />
          <SwitchField label="Count in final" checked={included} onCheckedChange={setIncluded} />
          <Button type="submit" isLoading={createType.isPending} loadingLabel="Adding">
            <Plus aria-hidden="true" />
            Add type
          </Button>
        </form>
      ) : null}

      {rows.length === 0 && !list.isLoading ? (
        <EmptyState title="No exam types" description="Add Mid Term, End Term, or other types before entering marks." />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div className="flex items-center justify-between gap-3">
              <p className="type-heading">{row.name}</p>
              <Badge variant={examTypeIncludedInFinal(row) ? 'success' : 'neutral'}>
                {examTypeIncludedInFinal(row) ? 'Included' : 'Not included'}
              </Badge>
            </div>
          )}
        />
      )}

      <Dialog open={editing !== null} onOpenChange={(next) => { if (!next) setEditing(null) }}>
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!editing) return
              const trimmed = editName.trim()
              if (!trimmed) return
              updateType.mutate({ id: editing.id, body: payload(trimmed, editIncluded) }, { onSuccess: () => setEditing(null) })
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit exam type</DialogTitle>
              <DialogDescription>PUT /api/exams/types/{'{id}'} updates name and includedInFinal.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex flex-col gap-3">
              <TextField label="Name" value={editName} onChange={(event) => setEditName(event.target.value)} required />
              <SwitchField label="Count in final" checked={editIncluded} onCheckedChange={setEditIncluded} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={updateType.isPending} loadingLabel="Saving">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => { if (!next) setPendingDelete(null) }}
        title="Delete exam type?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteType.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteType.mutate(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function GradingManager({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useGradingScaleList()
  const { createGrading } = useExamMutations()
  const [name, setName] = useState('')
  const [level, setLevel] = useState('')
  const [points, setPoints] = useState('')
  const [minMark, setMinMark] = useState('')
  const [maxMark, setMaxMark] = useState('')
  const [page, setPage] = useState(1)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<GradingScale>> = [
    { id: 'name', header: 'Scale', cell: (row) => displayValue(row.name) },
    { id: 'level', header: 'Level', cell: (row) => displayValue(row.descriptiveLevel) },
    { id: 'points', header: 'Points', hideOnMobile: true, cell: (row) => displayValue(row.points) },
    {
      id: 'range',
      header: 'Range',
      cell: (row) => `${displayValue(row.minMark)}–${displayValue(row.maxMark)}`,
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        POST /api/exams/grading creates a band. There is no update or delete endpoint.
      </p>
      {canWrite ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const pointsValue = Number(points)
            const min = Number(minMark)
            const max = Number(maxMark)
            if (!name.trim() || !Number.isFinite(pointsValue) || !Number.isFinite(min) || !Number.isFinite(max)) return
            createGrading.mutate(
              {
                name: name.trim(),
                descriptiveLevel: level.trim(),
                points: pointsValue,
                minMark: min,
                maxMark: max,
              },
              {
                onSuccess: () => {
                  setName('')
                  setLevel('')
                  setPoints('')
                  setMinMark('')
                  setMaxMark('')
                },
              },
            )
          }}
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6 xl:items-end"
        >
          <TextField label="Scale name" value={name} onChange={(event) => setName(event.target.value)} required />
          <TextField label="Level" value={level} onChange={(event) => setLevel(event.target.value)} placeholder="EE1" required />
          <TextField label="Points" type="number" value={points} onChange={(event) => setPoints(event.target.value)} required />
          <TextField label="Min mark" type="number" step="0.01" value={minMark} onChange={(event) => setMinMark(event.target.value)} required />
          <TextField label="Max mark" type="number" step="0.01" value={maxMark} onChange={(event) => setMaxMark(event.target.value)} required />
          <Button type="submit" isLoading={createGrading.isPending} loadingLabel="Saving">
            Add band
          </Button>
        </form>
      ) : null}

      {rows.length === 0 && !list.isLoading ? (
        <EmptyState title="No grading bands" description="Add CBC or 8-4-4 ranges so mark entry can show a descriptive level." />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div>
              <p className="type-heading">{displayValue(row.descriptiveLevel)}</p>
              <p className="type-caption text-muted-foreground">
                {displayValue(row.minMark)}–{displayValue(row.maxMark)} · {displayValue(row.name)}
              </p>
            </div>
          )}
        />
      )}
    </div>
  )
}

function ConfigManager({ canWrite }: { canWrite: boolean }): ReactNode {
  const classes = useClassList()
  const subjects = useLearningAreaList()
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [totalMarks, setTotalMarks] = useState('100')
  const [contributes, setContributes] = useState(true)
  const config = useExamConfig(classId ? Number(classId) : null)
  const { saveConfig } = useExamMutations()
  const rows = config.data ?? []

  const columns: Array<DataColumn<ExamSubjectConfig>> = [
    { id: 'subject', header: 'Learning area', cell: (row) => displayValue(row.subject?.name) },
    { id: 'total', header: 'Total marks', cell: (row) => displayValue(row.totalMarks) },
    {
      id: 'counts',
      header: 'In total',
      cell: (row) => (
        <Badge variant={configContributesToTotal(row) ? 'success' : 'neutral'}>
          {configContributesToTotal(row) ? 'Counts' : 'Excluded'}
        </Badge>
      ),
    },
  ]

  if (config.isError) {
    return <ErrorState message={toUserMessage(config.error)} onRetry={() => void config.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label="Class"
        value={classId}
        onChange={setClassId}
        options={(classes.data ?? []).map((item) => ({ value: String(item.id), label: formatClassLabel(item) }))}
        allowEmpty={false}
        placeholder="Select class"
      />
      {canWrite && classId ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const subject = Number(subjectId)
            const total = Number(totalMarks)
            if (!subject || !Number.isFinite(total)) return
            saveConfig.mutate({
              schoolClass: { id: Number(classId) },
              subject: { id: subject },
              totalMarks: total,
              contributesToTotal: contributes,
              isContributesToTotal: contributes,
            })
          }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <SelectField
            label="Learning area"
            value={subjectId}
            onChange={setSubjectId}
            options={(subjects.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
            allowEmpty={false}
            placeholder="Select subject"
          />
          <TextField label="Total marks" type="number" step="0.01" value={totalMarks} onChange={(event) => setTotalMarks(event.target.value)} required />
          <SwitchField label="Counts toward total" checked={contributes} onCheckedChange={setContributes} />
          <Button type="submit" isLoading={saveConfig.isPending} loadingLabel="Saving">
            Save config
          </Button>
        </form>
      ) : null}

      {!classId ? (
        <EmptyState title="Select a class" description="GET /api/exams/config/{classId} lists subject totals for that class." />
      ) : rows.length === 0 && !config.isLoading ? (
        <EmptyState title="No subject config" description="Add each learning area that should appear on the report card." />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          isLoading={config.isLoading}
          page={1}
          pageSize={Math.max(rows.length, 1)}
          total={rows.length}
          onPageChange={() => undefined}
          mobileCard={(row) => (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="type-heading">{displayValue(row.subject?.name)}</p>
                <p className="type-caption text-muted-foreground">Out of {displayValue(row.totalMarks)}</p>
              </div>
              <Badge variant={configContributesToTotal(row) ? 'success' : 'neutral'}>
                {configContributesToTotal(row) ? 'Counts' : 'Excluded'}
              </Badge>
            </div>
          )}
        />
      )}
    </div>
  )
}
