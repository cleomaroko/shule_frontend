import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip, SearchField } from '@/components/data/FilterBar'
import { NamedLookupManager } from '@/components/data/NamedLookupManager'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useClassList, useLearningAreaList, useStreamList } from '@/features/academic/hooks/useAcademic'
import {
  useAttendanceActivityList,
  useAttendanceMutations,
  useAttendanceReport,
  useAttendanceSessionList,
} from '@/features/attendance/hooks/useAttendance'
import { isPresent, type AttendanceMarkPayload, type AttendanceRecord } from '@/features/attendance/types/attendance.types'
import { useLearnerList } from '@/features/learners/hooks/useLearners'
import { useCampuses } from '@/features/lookups/useLookups'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { learnerMatchesClassStream } from '@/lib/learner-class'
import { displayValue, formatClassLabel, formatDate, formatPersonName, todayIso } from '@/lib/format'

const PAGE_SIZE = 10
const TABS = ['register', 'report', 'lookups'] as const
type AttendanceTab = (typeof TABS)[number]

function isTab(value: string | null): value is AttendanceTab {
  return TABS.some((tab) => tab === value)
}

function joinRequired(items: string[]): string {
  if (items.length === 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

export function AttendancePage(): ReactNode {
  useDocumentTitle('Attendance')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const rawTab = params.get('tab')
  const tab: AttendanceTab = isTab(rawTab) ? rawTab : 'register'
  const canWrite = can(user?.role, 'attendance:write')
  const canSettings = can(user?.role, 'attendance:settings')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Mark the class register and review who was present. Year and term default to the ones flagged current if you leave them off the payload."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="lookups">Sessions & activities</TabsTrigger>
        </TabsList>
        <TabsContent value="register">
          <RegisterPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="report">
          <ReportPanel />
        </TabsContent>
        <TabsContent value="lookups">
          <LookupsPanel canWrite={canSettings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RegisterPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const classes = useClassList()
  const streams = useStreamList()
  const sessions = useAttendanceSessionList()
  const activities = useAttendanceActivityList()
  const subjects = useLearningAreaList()
  const campuses = useCampuses()
  const learners = useLearnerList()
  const { markMany } = useAttendanceMutations()

  const [classId, setClassId] = useState('')
  const [streamId, setStreamId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [activityId, setActivityId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [campusId, setCampusId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [query, setQuery] = useState('')
  const [presentMap, setPresentMap] = useState<Record<number, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<{
    classId?: string | undefined
    streamId?: string | undefined
    sessionId?: string | undefined
    date?: string | undefined
  }>({})

  const selectedClass = (classes.data ?? []).find((item) => String(item.id) === classId)
  const streamOptions = (selectedClass?.streams?.length ? selectedClass.streams : streams.data) ?? []
  const selectedStream = streamOptions.find((item) => String(item.id) === streamId)

  const matchedRoster = useMemo(() => {
    const all = learners.data ?? []
    if (!selectedClass || !selectedStream) return []
    return all.filter((learner) => learnerMatchesClassStream(learner, selectedClass, selectedStream))
  }, [learners.data, selectedClass, selectedStream])

  const roster = useMemo(() => {
    const source = matchedRoster.length > 0 ? matchedRoster : selectedClass && selectedStream ? (learners.data ?? []) : []
    const needle = query.trim().toLowerCase()
    return source.filter((learner) => {
      if (!needle) return true
      return [formatPersonName(learner), learner.admissionNumber, learner.currentClass, learner.stream]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [learners.data, matchedRoster, query, selectedClass, selectedStream])

  useEffect(() => {
    setPresentMap((current) => {
      const next: Record<number, boolean> = {}
      for (const learner of roster) {
        next[learner.id] = current[learner.id] ?? true
      }
      return next
    })
  }, [roster])

  const usedFullList = Boolean(selectedClass && selectedStream) && matchedRoster.length === 0 && (learners.data ?? []).length > 0

  const handleSave = (event: FormEvent) => {
    event.preventDefault()
    if (!canWrite) return

    const nextErrors: typeof fieldErrors = {}
    const missing: string[] = []
    if (!classId) {
      nextErrors.classId = 'Select a class.'
      missing.push('class')
    }
    if (!streamId) {
      nextErrors.streamId = 'Select a stream.'
      missing.push('stream')
    }
    if (!sessionId) {
      nextErrors.sessionId =
        (sessions.data ?? []).length === 0
          ? 'Add a session under Sessions & activities first.'
          : 'Select a session.'
      missing.push('session')
    }
    if (!date.trim()) {
      nextErrors.date = 'Pick the attendance date.'
      missing.push('date')
    }
    setFieldErrors(nextErrors)

    if (missing.length > 0) {
      toast.error(`${joinRequired(missing)} ${missing.length === 1 ? 'is' : 'are'} required to save the register.`)
      return
    }

    const schoolClass = Number(classId)
    const stream = Number(streamId)
    const session = Number(sessionId)
    if (roster.length === 0) {
      toast.error('No learners to mark for this class and stream.')
      return
    }

    const rows: AttendanceMarkPayload[] = roster.map((learner) => {
      const body: AttendanceMarkPayload = {
        learner: { id: learner.id },
        schoolClass: { id: schoolClass },
        stream: { id: stream },
        session: { id: session },
        attendanceDate: date,
        present: presentMap[learner.id] ?? true,
      }
      if (activityId) body.activity = { id: Number(activityId) }
      if (unitId) body.unit = { id: Number(unitId) }
      if (campusId) body.campusId = Number(campusId)
      return body
    })
    markMany.mutate(rows)
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Class"
          value={classId}
          onChange={(value) => {
            setClassId(value)
            setStreamId('')
            setFieldErrors((current) => ({ ...current, classId: undefined, streamId: undefined }))
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
          onChange={(value) => {
            setStreamId(value)
            setFieldErrors((current) => ({ ...current, streamId: undefined }))
          }}
          options={streamOptions.map((item) => ({ value: String(item.id), label: item.name }))}
          allowEmpty={false}
          placeholder="Select stream"
          hint="Required"
          error={fieldErrors.streamId}
        />
        <SelectField
          label="Session"
          value={sessionId}
          onChange={(value) => {
            setSessionId(value)
            setFieldErrors((current) => ({ ...current, sessionId: undefined }))
          }}
          options={(sessions.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
          allowEmpty={false}
          placeholder="Select session"
          hint="Required"
          error={fieldErrors.sessionId}
          emptyMessage="Add a session under Sessions & activities first."
        />
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value)
            setFieldErrors((current) => ({ ...current, date: undefined }))
          }}
          required
          hint="Required"
          error={fieldErrors.date}
        />
        <SelectField
          label="Activity"
          value={activityId}
          onChange={setActivityId}
          options={(activities.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
          emptyLabel="None"
        />
        <SelectField
          label="Learning area"
          value={unitId}
          onChange={setUnitId}
          options={(subjects.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
          emptyLabel="None"
        />
        <SelectField
          label="Campus"
          value={campusId}
          onChange={setCampusId}
          options={(campuses.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
          emptyLabel="Not set"
        />
      </div>

      {usedFullList ? (
        <p className="type-caption text-muted-foreground">
          No learners have this class and stream on their profile names, so the full learner list is shown. Filter
          before saving.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search learner or admission number" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setPresentMap(Object.fromEntries(roster.map((row) => [row.id, true])))}>
            All present
          </Button>
          <Button type="button" variant="secondary" onClick={() => setPresentMap(Object.fromEntries(roster.map((row) => [row.id, false])))}>
            All absent
          </Button>
          {canWrite ? (
            <Button type="submit" isLoading={markMany.isPending} loadingLabel="Saving">
              Save register
            </Button>
          ) : null}
        </div>
      </div>

      {roster.length === 0 ? (
        <EmptyState
          title={classId && streamId ? 'No learners to mark' : 'Choose class and stream'}
          description="Class, stream, session, and date are required. The backend only accepts one POST per learner."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {roster.map((learner) => {
            const present = presentMap[learner.id] ?? true
            return (
              <li key={learner.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="type-heading truncate">{formatPersonName(learner)}</p>
                  <p className="type-caption text-muted-foreground">
                    {displayValue(learner.admissionNumber)}
                    {learner.currentClass ? ` · ${learner.currentClass}` : ''}
                    {learner.stream ? ` · ${learner.stream}` : ''}
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2">
                  <span className="type-caption text-muted-foreground">{present ? 'Present' : 'Absent'}</span>
                  <Switch
                    checked={present}
                    onCheckedChange={(checked) => setPresentMap((current) => ({ ...current, [learner.id]: checked }))}
                    disabled={!canWrite}
                    aria-label={`${formatPersonName(learner)} present`}
                  />
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </form>
  )
}

function ReportPanel(): ReactNode {
  const classes = useClassList()
  const streams = useStreamList()
  const learners = useLearnerList()
  const [classId, setClassId] = useState('')
  const [streamId, setStreamId] = useState('')
  const [learnerId, setLearnerId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [query, setQuery] = useState('')
  const [presence, setPresence] = useState<'all' | 'present' | 'absent'>('all')
  const [page, setPage] = useState(1)

  const report = useAttendanceReport({
    ...(classId ? { classId: Number(classId) } : {}),
    ...(streamId ? { streamId: Number(streamId) } : {}),
    ...(learnerId ? { learnerId: Number(learnerId) } : {}),
    ...(date ? { date } : {}),
  })

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (report.data ?? []).filter((row) => {
      if (presence === 'present' && !isPresent(row)) return false
      if (presence === 'absent' && isPresent(row)) return false
      if (!needle) return true
      return [
        row.learner ? formatPersonName(row.learner) : '',
        row.learner?.admissionNumber,
        row.schoolClass ? formatClassLabel(row.schoolClass) : '',
        row.stream?.name,
        row.session?.name,
        row.activity?.name,
        row.recordedBy,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [presence, query, report.data])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<AttendanceRecord>> = [
    {
      id: 'learner',
      header: 'Learner',
      cell: (row) => (
        <span>
          <span className="block font-medium">{row.learner ? formatPersonName(row.learner) : '—'}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.learner?.admissionNumber)}</span>
        </span>
      ),
    },
    { id: 'date', header: 'Date', cell: (row) => formatDate(row.attendanceDate) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={isPresent(row) ? 'success' : 'destructive'}>{isPresent(row) ? 'Present' : 'Absent'}</Badge>
      ),
    },
    {
      id: 'class',
      header: 'Class',
      hideOnMobile: true,
      cell: (row) => (row.schoolClass ? formatClassLabel(row.schoolClass) : '—'),
    },
    { id: 'session', header: 'Session', hideOnMobile: true, cell: (row) => displayValue(row.session?.name) },
    { id: 'recordedBy', header: 'Recorded by', hideOnMobile: true, cell: (row) => displayValue(row.recordedBy) },
  ]

  if (report.isError) {
    return <ErrorState message={toUserMessage(report.error)} onRetry={() => void report.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Class"
          value={classId}
          onChange={(value) => {
            setClassId(value)
            setPage(1)
          }}
          options={(classes.data ?? []).map((item) => ({ value: String(item.id), label: formatClassLabel(item) }))}
          emptyLabel="Any class"
        />
        <SelectField
          label="Stream"
          value={streamId}
          onChange={(value) => {
            setStreamId(value)
            setPage(1)
          }}
          options={(streams.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
          emptyLabel="Any stream"
        />
        <SelectField
          label="Learner"
          value={learnerId}
          onChange={(value) => {
            setLearnerId(value)
            setPage(1)
          }}
          options={(learners.data ?? []).map((item) => ({
            value: String(item.id),
            label: `${formatPersonName(item)}${item.admissionNumber ? ` · ${item.admissionNumber}` : ''}`,
          }))}
          emptyLabel="Any learner"
        />
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value)
            setPage(1)
          }}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search learner or session" />
        <div className="flex flex-wrap gap-2">
          <FilterChip label="All" active={presence === 'all'} onClick={() => setPresence('all')} />
          <FilterChip label="Present" active={presence === 'present'} onClick={() => setPresence('present')} />
          <FilterChip label="Absent" active={presence === 'absent'} onClick={() => setPresence('absent')} />
        </div>
      </div>
      {filtered.length === 0 && !report.isLoading ? (
        <EmptyState
          title="No attendance rows"
          description="GET /api/attendance/report only filters by learner, class, stream, and date. Try a broader date or class."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={report.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="type-heading truncate">{row.learner ? formatPersonName(row.learner) : '—'}</p>
                <p className="type-caption text-muted-foreground">
                  {formatDate(row.attendanceDate)} · {displayValue(row.session?.name)}
                </p>
              </div>
              <Badge variant={isPresent(row) ? 'success' : 'destructive'}>{isPresent(row) ? 'Present' : 'Absent'}</Badge>
            </div>
          )}
        />
      )}
    </div>
  )
}

function LookupsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const sessions = useAttendanceSessionList()
  const activities = useAttendanceActivityList()
  const { createSession, updateSession, deleteSession, createActivity, updateActivity, deleteActivity } =
    useAttendanceMutations()
  const [params, setParams] = useSearchParams()
  const lookup = params.get('lookup') === 'activities' ? 'activities' : 'sessions'

  return (
    <Tabs value={lookup} onValueChange={(value) => setParams({ tab: 'lookups', lookup: value }, { replace: true })}>
      <TabsList>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
        <TabsTrigger value="activities">Activities</TabsTrigger>
      </TabsList>
      <TabsContent value="sessions">
        <NamedLookupManager
          title="Session"
          description="For example Morning or Afternoon. Required when marking the register."
          emptyTitle="No sessions yet"
          emptyDescription="Add a session before marking attendance."
          items={sessions.data}
          isLoading={sessions.isLoading}
          isError={sessions.isError}
          errorMessage={toUserMessage(sessions.error)}
          onRetry={() => void sessions.refetch()}
          canWrite={canWrite}
          canUpdate
          canDelete
          isSaving={createSession.isPending || updateSession.isPending}
          isDeleting={deleteSession.isPending}
          onCreate={(name) => createSession.mutate({ name })}
          onUpdate={(id, name) => updateSession.mutate({ id, name })}
          onDelete={(id) => deleteSession.mutate(id)}
        />
      </TabsContent>
      <TabsContent value="activities">
        <NamedLookupManager
          title="Activity"
          description="Optional context on a register, for example Assembly or Games."
          emptyTitle="No activities yet"
          emptyDescription="Activities are optional on POST /api/attendance."
          items={activities.data}
          isLoading={activities.isLoading}
          isError={activities.isError}
          errorMessage={toUserMessage(activities.error)}
          onRetry={() => void activities.refetch()}
          canWrite={canWrite}
          canUpdate
          canDelete
          isSaving={createActivity.isPending || updateActivity.isPending}
          isDeleting={deleteActivity.isPending}
          onCreate={(name) => createActivity.mutate({ name })}
          onUpdate={(id, name) => updateActivity.mutate({ id, name })}
          onDelete={(id) => deleteActivity.mutate(id)}
        />
      </TabsContent>
    </Tabs>
  )
}
