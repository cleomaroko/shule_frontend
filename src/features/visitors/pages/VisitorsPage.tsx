import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { NamedLookupManager } from '@/components/data/NamedLookupManager'
import { FilterChip, SearchField } from '@/components/data/FilterBar'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
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
import { useLearnerList } from '@/features/learners/hooks/useLearners'
import { useCampuses, useDepartments, useGenders, useTitles } from '@/features/lookups/useLookups'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import type { Visitor, VisitorAnalyticsQuery, VisitorCheckInPayload } from '@/features/visitors/api/visitors.api'
import { notificationIsRead, type StaffVisitorNotification } from '@/features/visitors/api/visitors.api'
import {
  useMyVisitorNotifications,
  useMyVisitors,
  useVisitorAnalytics,
  useVisitorCategoryList,
  useVisitorMutations,
  useVisitorPurposeList,
} from '@/features/visitors/hooks/useVisitors'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDateTime, formatPersonName } from '@/lib/format'
import { currentMonthRange, todayIso } from '@/features/reports/lib/summaries'

const PAGE_SIZE = 10

export function VisitorsPage(): ReactNode {
  useDocumentTitle('Visitors')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'visitor:write')
  const [params, setParams] = useSearchParams()
  const rawTab = params.get('tab')
  const tab = rawTab === 'lookups' || rawTab === 'mine' || rawTab === 'alerts' ? rawTab : 'log'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Visitor Management"
        description="Check visitors in and out. History comes from the analytics window. Staff see their own visits and live alerts when their work email matches the login."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="log">Visits</TabsTrigger>
          <TabsTrigger value="mine">My visitors</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="lookups">Lookups</TabsTrigger>
        </TabsList>
        <TabsContent value="log">
          <LogPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="mine">
          <MyVisitorsPanel />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertsPanel />
        </TabsContent>
        <TabsContent value="lookups">
          <LookupsPanel canWrite={canWrite} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LogPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const campuses = useCampuses()
  const departments = useDepartments()
  const staff = useStaffList()
  const { checkOut, remove } = useVisitorMutations()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'IN' | 'OUT'>('all')
  const [windowMode, setWindowMode] = useState<'day' | 'month' | 'range'>('day')
  const [day, setDay] = useState(todayIso())
  const [month, setMonth] = useState(todayIso().slice(0, 7))
  const initialRange = currentMonthRange()
  const [startDate, setStartDate] = useState(initialRange.start)
  const [endDate, setEndDate] = useState(initialRange.end)
  const [campusId, setCampusId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Visitor | null>(null)

  const analyticsQuery = useMemo<VisitorAnalyticsQuery>(() => {
    const next: VisitorAnalyticsQuery = { page: page - 1, size: PAGE_SIZE }
    if (windowMode === 'day' && day) next.day = day
    if (windowMode === 'month' && month) next.month = month
    if (windowMode === 'range') {
      if (startDate) next.startDate = startDate
      if (endDate) next.endDate = endDate
    }
    if (status !== 'all') next.status = status
    if (Number(campusId)) next.campusId = Number(campusId)
    if (Number(departmentId)) next.departmentId = Number(departmentId)
    if (Number(staffId)) next.staffId = Number(staffId)
    return next
  }, [campusId, day, departmentId, endDate, month, page, staffId, startDate, status, windowMode])

  const list = useVisitorAnalytics(analyticsQuery)
  const rows = list.data?.visitors.content ?? []
  const total = list.data?.visitors.totalElements ?? 0
  const summary = list.data?.summary
  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? rows.filter((row) =>
        [row.fullName, row.phoneNumber, row.nationalId, row.categoryName, row.purposeName, row.campusName, row.staffName, row.learnerName]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
    : rows

  const columns: Array<DataColumn<Visitor>> = [
    {
      id: 'name',
      header: 'Visitor',
      cell: (row) => (
        <span>
          <span className="block font-medium">{row.fullName}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.phoneNumber)}</span>
        </span>
      ),
    },
    { id: 'campus', header: 'Campus', cell: (row) => displayValue(row.campusName) },
    { id: 'purpose', header: 'Purpose', hideOnMobile: true, cell: (row) => displayValue(row.purposeName) },
    { id: 'in', header: 'In', hideOnMobile: true, cell: (row) => formatDateTime(row.checkInTime) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) =>
        row.status === 'OUT' ? (
          <Badge variant="neutral">{row.stayDuration || 'OUT'}</Badge>
        ) : (
          <Badge variant="success">IN</Badge>
        ),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-36 text-right',
      cell: (row) =>
        canWrite ? (
          <span className="flex justify-end gap-1">
            {row.status !== 'OUT' ? (
              <Button size="sm" variant="outline" onClick={() => checkOut.mutate(row.id)}>
                Check out
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" aria-label={`Delete ${row.fullName}`} onClick={() => setPendingDelete(row)}>
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
      <p className="type-caption text-muted-foreground">
        {summary?.totalVisits != null
          ? `${summary.totalVisits.toLocaleString()} visits, ${summary.uniqueVisitors?.toLocaleString() ?? '0'} people, ${summary.onPremisesNow?.toLocaleString() ?? '0'} still on site in this date window.`
          : 'Counts follow the selected dates. With no dates the server uses today.'}{' '}
        Status is applied inside that window, so “On site” with today only lists people who checked in today.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Filter this page…" />
        {canWrite ? (
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            Check in
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['day', 'Day'],
            ['month', 'Month'],
            ['range', 'Range'],
          ] as const
        ).map(([value, label]) => (
          <FilterChip
            key={value}
            label={label}
            active={windowMode === value}
            onClick={() => {
              setWindowMode(value)
              setPage(1)
            }}
          />
        ))}
        {(['all', 'IN', 'OUT'] as const).map((value) => (
          <FilterChip
            key={value}
            label={value === 'all' ? 'All' : value === 'IN' ? 'On site' : 'Checked out'}
            active={status === value}
            onClick={() => {
              setStatus(value)
              setPage(1)
            }}
          />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {windowMode === 'day' ? (
          <TextField label="Day" type="date" value={day} onChange={(event) => { setDay(event.target.value); setPage(1) }} />
        ) : null}
        {windowMode === 'month' ? (
          <TextField label="Month" type="month" value={month} onChange={(event) => { setMonth(event.target.value); setPage(1) }} />
        ) : null}
        {windowMode === 'range' ? (
          <>
            <TextField label="From" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1) }} />
            <TextField label="To" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1) }} />
          </>
        ) : null}
        <SelectField
          label="Campus"
          value={campusId}
          onChange={(value) => { setCampusId(value); setPage(1) }}
          options={(campuses.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
          emptyLabel="All campuses"
        />
        <SelectField
          label="Department"
          value={departmentId}
          onChange={(value) => { setDepartmentId(value); setPage(1) }}
          options={(departments.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
          emptyLabel="All departments"
        />
        <SelectField
          label="Staff visited"
          value={staffId}
          onChange={(value) => { setStaffId(value); setPage(1) }}
          options={(staff.data ?? []).map((item) => ({ value: String(item.id), label: formatPersonName(item) }))}
          emptyLabel="Anyone"
        />
      </div>
      {total === 0 && !list.isLoading ? (
        <EmptyState
          title="No visitors in this window"
          description="Widen the dates, or check a guest in with campus, category, and purpose."
          {...(canWrite ? { actionLabel: 'Check in', onAction: () => setOpen(true) } : {})}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div>
              <p className="type-heading">{row.fullName}</p>
              <p className="type-caption text-muted-foreground">
                {[row.campusName, row.purposeName, row.status === 'OUT' ? row.stayDuration : 'IN']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          )}
        />
      )}
      <CheckInDialog open={open} onOpenChange={setOpen} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Delete visitor record?"
        description={pendingDelete ? `This will remove ${pendingDelete.fullName}.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          remove.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function MyVisitorsPanel(): ReactNode {
  const [page, setPage] = useState(1)
  const list = useMyVisitors(page - 1, PAGE_SIZE)
  const rows = list.data?.content ?? []
  const total = list.data?.totalElements ?? 0

  const columns: Array<DataColumn<Visitor>> = [
    { id: 'name', header: 'Visitor', cell: (row) => row.fullName },
    { id: 'purpose', header: 'Purpose', hideOnMobile: true, cell: (row) => displayValue(row.purposeName) },
    { id: 'in', header: 'In', cell: (row) => formatDateTime(row.checkInTime) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) =>
        row.status === 'OUT' ? <Badge variant="neutral">{row.stayDuration || 'OUT'}</Badge> : <Badge variant="success">IN</Badge>,
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  if (total === 0 && !list.isLoading) {
    return (
      <EmptyState
        title="No visitors for you"
        description="This list is the visits where you are the staff being visited. It needs a staff profile whose work email matches your login."
      />
    )
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      isLoading={list.isLoading}
      page={page}
      pageSize={PAGE_SIZE}
      total={total}
      onPageChange={setPage}
      mobileCard={(row) => (
        <div>
          <p className="type-heading">{row.fullName}</p>
          <p className="type-caption text-muted-foreground">
            {[row.purposeName, row.status === 'OUT' ? row.stayDuration : 'IN'].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}
    />
  )
}

function AlertsPanel(): ReactNode {
  const [page, setPage] = useState(1)
  const list = useMyVisitorNotifications(page - 1, PAGE_SIZE)
  const rows = list.data?.content ?? []
  const total = list.data?.totalElements ?? 0

  const columns: Array<DataColumn<StaffVisitorNotification>> = [
    {
      id: 'title',
      header: 'Alert',
      cell: (row) => (
        <span>
          <span className="block font-medium">{displayValue(row.title)}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.message)}</span>
        </span>
      ),
    },
    { id: 'when', header: 'When', hideOnMobile: true, cell: (row) => formatDateTime(row.createdAt) },
    {
      id: 'read',
      header: 'Status',
      cell: (row) =>
        notificationIsRead(row) ? <Badge variant="neutral">Read</Badge> : <Badge variant="warning">New</Badge>,
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  if (total === 0 && !list.isLoading) {
    return (
      <EmptyState
        title="No alerts yet"
        description="A visitor checked in to see you will appear here, and a live notice appears while you stay signed in."
      />
    )
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      isLoading={list.isLoading}
      page={page}
      pageSize={PAGE_SIZE}
      total={total}
      onPageChange={setPage}
      mobileCard={(row) => (
        <div>
          <p className="type-heading">{displayValue(row.title)}</p>
          <p className="type-caption text-muted-foreground">{displayValue(row.message)}</p>
        </div>
      )}
    />
  )
}

function CheckInDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }): ReactNode {
  const titles = useTitles()
  const genders = useGenders()
  const campuses = useCampuses()
  const categories = useVisitorCategoryList()
  const purposes = useVisitorPurposeList()
  const staff = useStaffList()
  const learners = useLearnerList()
  const departments = useDepartments()
  const { checkIn } = useVisitorMutations()
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [numberPlate, setNumberPlate] = useState('')
  const [titleId, setTitleId] = useState('')
  const [genderId, setGenderId] = useState('')
  const [campusId, setCampusId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [purposeId, setPurposeId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [learnerId, setLearnerId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [comments, setComments] = useState('')

  useEffect(() => {
    if (!open) return
    setFullName('')
    setPhoneNumber('')
    setNationalId('')
    setEmailAddress('')
    setNumberPlate('')
    setTitleId('')
    setGenderId('')
    setCampusId('')
    setCategoryId('')
    setPurposeId('')
    setStaffId('')
    setLearnerId('')
    setDepartmentId('')
    setComments('')
  }, [open])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const name = fullName.trim()
    if (!name) return
    const body: VisitorCheckInPayload = { fullName: name }
    if (phoneNumber.trim()) body.phoneNumber = phoneNumber.trim()
    if (nationalId.trim()) body.nationalId = nationalId.trim()
    if (emailAddress.trim()) body.emailAddress = emailAddress.trim()
    if (numberPlate.trim()) body.numberPlate = numberPlate.trim()
    if (Number(titleId)) body.title = { id: Number(titleId) }
    if (Number(genderId)) body.gender = { id: Number(genderId) }
    if (Number(campusId)) body.campus = { id: Number(campusId) }
    if (Number(categoryId)) body.category = { id: Number(categoryId) }
    if (Number(purposeId)) body.purpose = { id: Number(purposeId) }
    if (Number(staffId)) body.staffToVisit = { id: Number(staffId) }
    if (Number(learnerId)) body.learnerToVisit = { id: Number(learnerId) }
    if (Number(departmentId)) body.department = { id: Number(departmentId) }
    if (comments.trim()) body.comments = comments.trim()
    checkIn.mutate(body, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>Check in visitor</DialogTitle>
            <DialogDescription>Lookup names are copied onto the visit record for history.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            <TextField label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            <TextField label="Phone" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
            <TextField label="National ID" value={nationalId} onChange={(event) => setNationalId(event.target.value)} />
            <TextField
              label="Email"
              type="email"
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
            />
            <TextField
              label="Vehicle plate"
              value={numberPlate}
              onChange={(event) => setNumberPlate(event.target.value)}
            />
            <SelectField
              label="Title"
              value={titleId}
              onChange={setTitleId}
              options={(titles.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
              emptyLabel="Not set"
            />
            <SelectField
              label="Gender"
              value={genderId}
              onChange={setGenderId}
              options={(genders.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
              emptyLabel="Not set"
            />
            <SelectField
              label="Campus"
              value={campusId}
              onChange={setCampusId}
              options={(campuses.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
              emptyLabel="Not set"
            />
            <SelectField
              label="Category"
              value={categoryId}
              onChange={setCategoryId}
              options={(categories.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
              placeholder={categories.data?.length ? 'Select category' : 'No categories available'}
              emptyMessage="No categories available"
              emptyLabel="Not set"
            />
            <SelectField
              label="Purpose"
              value={purposeId}
              onChange={setPurposeId}
              options={(purposes.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
              placeholder={purposes.data?.length ? 'Select purpose' : 'No purposes available'}
              emptyMessage="No purposes available"
              emptyLabel="Not set"
            />
            <SelectField
              label="Staff to visit"
              value={staffId}
              onChange={setStaffId}
              options={(staff.data ?? []).map((item) => ({
                value: String(item.id),
                label: formatPersonName(item),
              }))}
              emptyLabel="Not set"
            />
            <SelectField
              label="Learner to visit"
              value={learnerId}
              onChange={setLearnerId}
              options={(learners.data ?? []).map((item) => ({
                value: String(item.id),
                label: formatPersonName(item),
              }))}
              emptyLabel="Not set"
            />
            <SelectField
              label="Department"
              value={departmentId}
              onChange={setDepartmentId}
              options={(departments.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
              emptyLabel="Not set"
            />
            <TextareaField label="Comments" value={comments} onChange={(event) => setComments(event.target.value)} rows={3} />
          </div>
          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={checkIn.isPending} loadingLabel="Checking in">
              Check in
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LookupsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const categories = useVisitorCategoryList()
  const purposes = useVisitorPurposeList()
  const { createCategory, createPurpose } = useVisitorMutations()
  const [params, setParams] = useSearchParams()
  const lookup = params.get('lookup') === 'purposes' ? 'purposes' : 'categories'

  return (
    <Tabs value={lookup} onValueChange={(value) => setParams({ tab: 'lookups', lookup: value }, { replace: true })}>
      <TabsList>
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="purposes">Purposes</TabsTrigger>
      </TabsList>
      <TabsContent value="categories">
        <NamedLookupManager
          title="Category"
          description="Visitor kinds, for example Parent or Contractor."
          emptyTitle="No categories yet"
          emptyDescription="Add categories before checking visitors in."
          items={categories.data}
          isLoading={categories.isLoading}
          isError={categories.isError}
          errorMessage={toUserMessage(categories.error)}
          onRetry={() => void categories.refetch()}
          canWrite={canWrite}
          isSaving={createCategory.isPending}
          onCreate={(name) => createCategory.mutate({ name })}
        />
      </TabsContent>
      <TabsContent value="purposes">
        <NamedLookupManager
          title="Purpose"
          description="Why the visit is happening, for example Interview or Delivery."
          emptyTitle="No purposes yet"
          emptyDescription="Add purposes before checking visitors in."
          items={purposes.data}
          isLoading={purposes.isLoading}
          isError={purposes.isError}
          errorMessage={toUserMessage(purposes.error)}
          onRetry={() => void purposes.refetch()}
          canWrite={canWrite}
          isSaving={createPurpose.isPending}
          onCreate={(name) => createPurpose.mutate({ name })}
        />
      </TabsContent>
    </Tabs>
  )
}
