import { useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { can, hasRole } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { FormSection } from '@/components/forms/FormSection'
import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useHrLeaves,
  useHrMutations,
  useMyAppraisals,
  useMyAttendance,
  useMyPayroll,
  useStaffAttendanceReport,
} from '@/features/hr/hooks/useHr'
import {
  leaveBadgeVariant,
  leaveStatusLabel,
  payrollBadgeVariant,
  payrollStatusLabel,
  staffDisplayName,
  type PayrollRecord,
  type StaffAttendanceFilters,
  type StaffAttendanceRecord,
  type StaffAppraisal,
  type StaffAttendanceStatus,
  type StaffLeave,
} from '@/features/hr/types/hr.types'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import type { Staff } from '@/features/staff/types/staff.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatKes, todayIso } from '@/lib/format'

const ATTENDANCE_STATUSES: Array<{ value: StaffAttendanceStatus; label: string }> = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LATE', label: 'Late' },
]

const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
]

function dateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return todayIso(date)
}

function currentPayPeriod(): string {
  return `${MONTHS[new Date().getMonth()]}-${new Date().getFullYear()}`
}

export function HrPage(): ReactNode {
  useDocumentTitle('Human resources')
  const { user } = useAuth()
  const canManage = can(user?.role, 'finance:access')
  const hasStaffProfile = !hasRole(user?.role, 'ROLE_SUPER_ADMIN')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Human resources" description="Staff leave, attendance, appraisals, and payroll." />
      {canManage ? (
        <Tabs defaultValue="self" className="min-w-0">
          <div className="overflow-x-auto">
            <TabsList className="w-max min-w-full justify-start sm:w-auto sm:min-w-0">
              <TabsTrigger value="self">My HR</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="leave">Leave review</TabsTrigger>
              <TabsTrigger value="salary">Salary & processing</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="self"><SelfServicePanel hasStaffProfile={hasStaffProfile} /></TabsContent>
          <TabsContent value="attendance"><AttendancePanel /></TabsContent>
          <TabsContent value="leave"><LeaveReviewPanel /></TabsContent>
          <TabsContent value="salary"><SalaryPanel /></TabsContent>
        </Tabs>
      ) : (
        <SelfServicePanel hasStaffProfile={hasStaffProfile} />
      )}
    </div>
  )
}

function SelfServicePanel({ hasStaffProfile }: { hasStaffProfile: boolean }): ReactNode {
  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-2">
      {hasStaffProfile ? <LeaveApplicationPanel /> : <StaffProfileRequired title="Staff leave self-service unavailable" />}
      <PersonalRecordsPanel hasStaffProfile={hasStaffProfile} />
      {hasStaffProfile ? <MyAttendancePanel /> : <StaffProfileRequired title="Staff attendance unavailable" />}
    </div>
  )
}

function StaffProfileRequired({ title }: { title: string }): ReactNode {
  return (
    <FormSection title={title}>
      <p className="type-body text-muted-foreground sm:col-span-2">
        This super-admin login is not linked to a staff profile. Ask an administrator to link the account to a staff
        record before using staff self-service.
      </p>
    </FormSection>
  )
}

function LeaveApplicationPanel(): ReactNode {
  const { applyLeave } = useHrMutations()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!reason.trim()) {
      toast.error('Enter a reason for your leave request.')
      return
    }
    if (startDate > endDate) {
      toast.error('The end date must be on or after the start date.')
      return
    }
    applyLeave.mutate(
      { startDate, endDate, reason: reason.trim() },
      { onSuccess: () => { setStartDate(''); setEndDate(''); setReason('') } },
    )
  }

  return (
    <form onSubmit={submit}>
      <FormSection title="Request leave" description="Your request will be sent for review.">
        <TextField label="First day" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
        <TextField label="Last day" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required min={startDate || undefined} />
        <TextareaField label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} containerClassName="sm:col-span-2" rows={4} />
        <div className="sm:col-span-2">
          <Button type="submit" isLoading={applyLeave.isPending} loadingLabel="Submitting">Submit request</Button>
        </div>
      </FormSection>
    </form>
  )
}

function PersonalRecordsPanel({ hasStaffProfile }: { hasStaffProfile: boolean }): ReactNode {
  const appraisals = useMyAppraisals(hasStaffProfile)
  const payroll = useMyPayroll(hasStaffProfile)
  const [appraisalPage, setAppraisalPage] = useState(1)
  const [payrollPage, setPayrollPage] = useState(1)
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null)

  const appraisalColumns: Array<DataColumn<StaffAppraisal>> = [
    { id: 'period', header: 'Period', cell: (row) => row.period || '—' },
    { id: 'dates', header: 'Dates', cell: (row) => [row.fromDate, row.toDate].filter(Boolean).join(' – ') || '—' },
    { id: 'summary', header: 'Summary', cell: (row) => row.noteSummary || '—' },
  ]
  const payrollColumns: Array<DataColumn<PayrollRecord>> = [
    { id: 'period', header: 'Pay period', cell: (row) => row.payPeriod || '—' },
    { id: 'net', header: 'Net pay', cell: (row) => formatKes(row.netSalary) },
    { id: 'status', header: 'Status', cell: (row) => <Badge variant={payrollBadgeVariant(row.status)}>{payrollStatusLabel(row.status)}</Badge> },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <FormSection title="My appraisals" description="Appraisal records linked to your staff profile.">
        {!hasStaffProfile ? <p className="type-body text-muted-foreground sm:col-span-2">Unavailable until this account is linked to a staff profile.</p> : appraisals.isError ? <ErrorState message={toUserMessage(appraisals.error)} onRetry={() => void appraisals.refetch()} /> :
          (appraisals.data?.length ?? 0) === 0 && !appraisals.isLoading ? <p className="type-body text-muted-foreground">No appraisals are available.</p> : (
            <div className="sm:col-span-2">
              <DataTable columns={appraisalColumns} rows={(appraisals.data ?? []).slice((appraisalPage - 1) * 5, appraisalPage * 5)} getRowId={(row) => row.id} isLoading={appraisals.isLoading} page={appraisalPage} pageSize={5} total={appraisals.data?.length ?? 0} onPageChange={setAppraisalPage}
                mobileCard={(row) => <div className="space-y-1"><p className="type-label">{row.period || 'Appraisal'}</p><p className="type-caption text-muted-foreground">{[row.fromDate, row.toDate].filter(Boolean).join(' – ') || 'Dates not set'}</p><p className="type-body pt-2">{row.noteSummary || 'No summary provided.'}</p></div>} />
            </div>
          )}
      </FormSection>
      <FormSection title="My payroll" description="Your processed salary records.">
        {!hasStaffProfile ? <p className="type-body text-muted-foreground sm:col-span-2">Unavailable until this account is linked to a staff profile.</p> : payroll.isError ? <ErrorState message={toUserMessage(payroll.error)} onRetry={() => void payroll.refetch()} /> :
          (payroll.data?.length ?? 0) === 0 && !payroll.isLoading ? <p className="type-body text-muted-foreground">No payroll records are available.</p> : (
            <div className="sm:col-span-2">
              <DataTable columns={payrollColumns} rows={(payroll.data ?? []).slice((payrollPage - 1) * 5, payrollPage * 5)} getRowId={(row) => row.id} isLoading={payroll.isLoading} page={payrollPage} pageSize={5} total={payroll.data?.length ?? 0} onPageChange={setPayrollPage}
                onRowClick={setSelectedPayroll} rowAriaLabel={(row) => `View payroll details for ${row.payPeriod || 'payment'}`}
                mobileCard={(row) => <div className="flex items-center justify-between gap-3"><div><p className="type-label">{row.payPeriod || 'Payroll'}</p><p className="type-caption text-muted-foreground">Net pay · {formatKes(row.netSalary)}</p><p className="type-caption mt-1 text-primary">View payment details</p></div><Badge variant={payrollBadgeVariant(row.status)}>{payrollStatusLabel(row.status)}</Badge></div>} />
            </div>
          )}
      </FormSection>
      <Dialog open={selectedPayroll !== null} onOpenChange={(open) => { if (!open) setSelectedPayroll(null) }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {selectedPayroll ? (
            <>
              <DialogHeader>
                <DialogTitle>Payroll details</DialogTitle>
                <DialogDescription>{selectedPayroll.payPeriod || 'Payment record'}</DialogDescription>
              </DialogHeader>
              <div className="mt-5 space-y-5">
                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3">
                  <span className="type-label">Payment status</span>
                  <Badge variant={payrollBadgeVariant(selectedPayroll.status)}>{payrollStatusLabel(selectedPayroll.status)}</Badge>
                </div>
                <dl className="divide-y divide-border rounded-lg border border-border px-4">
                  <PayrollDetail label="Pay period" value={selectedPayroll.payPeriod || '—'} />
                  <PayrollDetail label="Payment date" value={selectedPayroll.paymentDate || 'Not recorded'} />
                  <PayrollDetail label="Basic salary" value={formatKes(selectedPayroll.basicSalary)} />
                  <PayrollDetail label="Allowances" value={formatKes(selectedPayroll.allowances)} />
                  <PayrollDetail label="Gross salary" value={formatKes(selectedPayroll.grossSalary)} emphasize />
                </dl>
                <div>
                  <h3 className="type-label mb-2">Deductions</h3>
                  <dl className="divide-y divide-border rounded-lg border border-border px-4">
                    <PayrollDetail label="NHIF" value={formatKes(selectedPayroll.nhif)} />
                    <PayrollDetail label="NSSF" value={formatKes(selectedPayroll.nssf)} />
                    <PayrollDetail label="PAYE" value={formatKes(selectedPayroll.paye)} />
                    <PayrollDetail label="HELB" value={formatKes(selectedPayroll.helb)} />
                    <PayrollDetail label="Total deductions" value={formatKes(selectedPayroll.totalDeductions)} emphasize />
                  </dl>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <span className="type-label">Net pay</span>
                  <span className="type-heading text-primary">{formatKes(selectedPayroll.netSalary)}</span>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PayrollDetail({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }): ReactNode {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="type-caption text-muted-foreground">{label}</dt>
      <dd className={emphasize ? 'type-label text-right' : 'type-body text-right'}>{value}</dd>
    </div>
  )
}

function AttendancePanel(): ReactNode {
  return (
    <Tabs defaultValue="mark" className="min-w-0">
      <TabsList>
        <TabsTrigger value="mark">Mark attendance</TabsTrigger>
        <TabsTrigger value="report">Attendance report</TabsTrigger>
      </TabsList>
      <TabsContent value="mark"><AttendanceUploadPanel /></TabsContent>
      <TabsContent value="report"><AttendanceReportPanel /></TabsContent>
    </Tabs>
  )
}

function AttendanceUploadPanel(): ReactNode {
  const staff = useStaffList()
  const { uploadAttendance } = useHrMutations()
  const [attendanceDate, setAttendanceDate] = useState(todayIso())
  const [statuses, setStatuses] = useState<Record<number, StaffAttendanceStatus | ''>>({})
  const activeStaff = (staff.data ?? []).filter((person) => person.status?.toLowerCase() === 'active')
  const markedCount = Object.values(statuses).filter(Boolean).length

  const setAllPresent = () => setStatuses(Object.fromEntries(activeStaff.map((person) => [person.id, 'PRESENT'])))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const records = activeStaff.flatMap((person) => {
      const status = statuses[person.id]
      return status ? [{ staff: { id: person.id }, attendanceDate, status }] : []
    })
    if (!attendanceDate || records.length === 0) {
      toast.error('Choose a date and mark at least one staff member.')
      return
    }
    uploadAttendance.mutate(records)
  }

  return (
    <form onSubmit={submit}>
      <FormSection title="Staff attendance" description="Select a date and mark each staff member to include in the upload.">
        {staff.isError ? <div className="sm:col-span-2"><ErrorState message={toUserMessage(staff.error)} onRetry={() => void staff.refetch()} /></div> : null}
        <TextField label="Attendance date" type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} required />
        <div className="flex items-end gap-3">
          <p className="type-caption flex-1 text-muted-foreground">{markedCount} marked · {activeStaff.length} active staff</p>
          <Button type="button" variant="outline" onClick={setAllPresent} disabled={activeStaff.length === 0}>Mark all present</Button>
        </div>
        {activeStaff.length === 0 && !staff.isLoading ? <p className="type-body text-muted-foreground sm:col-span-2">No active staff found.</p> : (
          <div className="sm:col-span-2">
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[34rem] text-left">
                <thead><tr className="border-b border-border bg-muted/60"><th className="type-caption px-4 py-3 font-semibold uppercase text-muted-foreground">Staff member</th><th className="type-caption px-4 py-3 font-semibold uppercase text-muted-foreground">Attendance status</th></tr></thead>
                <tbody>
                  {activeStaff.map((person) => (
                    <tr key={person.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3"><p className="type-label">{staffName(person)}</p><p className="type-caption text-muted-foreground">{person.staffNumber || person.department || `Staff #${person.id}`}</p></td>
                      <td className="px-4 py-3"><select aria-label={`Attendance status for ${staffName(person)}`} className="h-10 w-full max-w-52 rounded-md border border-input bg-background px-3 type-body" value={statuses[person.id] ?? ''} onChange={(event) => setStatuses((current) => ({ ...current, [person.id]: event.target.value as StaffAttendanceStatus | '' }))}>
                        <option value="">Not marked</option>{ATTENDANCE_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="sm:col-span-2"><Button type="submit" isLoading={uploadAttendance.isPending} loadingLabel="Saving" disabled={markedCount === 0}>Save marked attendance</Button></div>
      </FormSection>
    </form>
  )
}

function MyAttendancePanel(): ReactNode {
  const [startDate, setStartDate] = useState(dateDaysAgo(29))
  const [endDate, setEndDate] = useState(todayIso())
  const [filters, setFilters] = useState<StaffAttendanceFilters | null>(null)
  const [page, setPage] = useState(1)
  const attendance = useMyAttendance(filters ?? {}, filters !== null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!startDate || !endDate || startDate > endDate) {
      toast.error('Choose a valid date range.')
      return
    }
    setPage(1)
    setFilters({ startDate, endDate })
  }

  return (
    <div className="min-w-0">
      <FormSection title="My staff attendance" description="View your attendance records for a selected period.">
        <form onSubmit={submit} className="contents">
          <TextField label="From" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          <TextField label="To" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required min={startDate || undefined} />
          <div className="sm:col-span-2"><Button type="submit">View records</Button></div>
        </form>
        {filters ? <AttendanceResults attendance={attendance} page={page} onPageChange={setPage} /> : <p className="type-caption text-muted-foreground sm:col-span-2">Select a date range to view attendance.</p>}
      </FormSection>
    </div>
  )
}

function AttendanceReportPanel(): ReactNode {
  const staff = useStaffList()
  const [staffId, setStaffId] = useState('')
  const [startDate, setStartDate] = useState(dateDaysAgo(29))
  const [endDate, setEndDate] = useState(todayIso())
  const [filters, setFilters] = useState<StaffAttendanceFilters | null>(null)
  const [page, setPage] = useState(1)
  const attendance = useStaffAttendanceReport(filters ?? {}, filters !== null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!startDate || !endDate || startDate > endDate) {
      toast.error('Choose a valid date range.')
      return
    }
    setPage(1)
    setFilters({ startDate, endDate, ...(staffId ? { staffId: Number(staffId) } : {}) })
  }

  return (
    <FormSection title="Staff attendance report" description="Filter all staff records or narrow the report to one staff member.">
      {staff.isError ? <div className="sm:col-span-2"><ErrorState message={toUserMessage(staff.error)} onRetry={() => void staff.refetch()} /></div> : null}
      <form onSubmit={submit} className="contents">
        <SelectField label="Staff member" value={staffId} onChange={setStaffId} options={(staff.data ?? []).map((person) => ({ value: String(person.id), label: `${staffName(person)}${person.staffNumber ? ` · ${person.staffNumber}` : ''}` }))} emptyLabel="All staff" placeholder="Select staff" hint="All staff is the default." />
        <TextField label="From" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
        <TextField label="To" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required min={startDate || undefined} />
        <div className="flex items-end"><Button type="submit">Run report</Button></div>
      </form>
      {filters ? <AttendanceResults attendance={attendance} page={page} onPageChange={setPage} /> : <p className="type-caption text-muted-foreground sm:col-span-2">Choose a date range to run the report.</p>}
    </FormSection>
  )
}

function AttendanceResults({
  attendance,
  page,
  onPageChange,
}: {
  attendance: ReturnType<typeof useMyAttendance>;
  page: number;
  onPageChange: (page: number) => void;
}): ReactNode {
  const records = attendance.data ?? []
  const columns: Array<DataColumn<StaffAttendanceRecord>> = [
    { id: 'date', header: 'Date', cell: (row) => row.attendanceDate },
    { id: 'staff', header: 'Staff member', cell: (row) => staffDisplayName(row.staff) },
    { id: 'status', header: 'Status', cell: (row) => <Badge variant={row.status === 'PRESENT' ? 'success' : row.status === 'LATE' ? 'warning' : 'destructive'}>{row.status}</Badge> },
    { id: 'timeIn', header: 'Time in', cell: (row) => row.timeIn || '—' },
    { id: 'timeOut', header: 'Time out', cell: (row) => row.timeOut || '—' },
  ]

  if (attendance.isError) return <div className="sm:col-span-2"><ErrorState message={toUserMessage(attendance.error)} onRetry={() => void attendance.refetch()} /></div>
  if (!attendance.isLoading && records.length === 0) return <p className="type-body text-muted-foreground sm:col-span-2">No attendance records found for this date range.</p>

  return (
    <div className="sm:col-span-2">
      <DataTable
        columns={columns}
        rows={records.slice((page - 1) * 10, page * 10)}
        getRowId={(row) => row.id}
        isLoading={attendance.isLoading}
        page={page}
        pageSize={10}
        total={records.length}
        onPageChange={onPageChange}
        mobileCard={(row) => <div className="flex items-start justify-between gap-3"><div><p className="type-label">{row.attendanceDate}</p><p className="type-caption text-muted-foreground">{staffDisplayName(row.staff)} · In {row.timeIn || '—'} · Out {row.timeOut || '—'}</p></div><Badge variant={row.status === 'PRESENT' ? 'success' : row.status === 'LATE' ? 'warning' : 'destructive'}>{row.status}</Badge></div>}
      />
    </div>
  )
}

function LeaveReviewPanel(): ReactNode {
  const { user } = useAuth()
  const staff = useStaffList()
  const leaves = useHrLeaves()
  const { reviewLeave } = useHrMutations()
  const [page, setPage] = useState(1)
  const [selectedLeave, setSelectedLeave] = useState<StaffLeave | null>(null)
  const [action, setAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [comment, setComment] = useState('')
  const rows = leaves.data ?? []
  const reviewer = (staff.data ?? []).find((person) => person.workEmail?.toLowerCase() === user?.username.toLowerCase())
  const isSupervisorForSelectedLeave = Boolean(
    reviewer &&
      selectedLeave?.staff?.supervisor?.trim().toLowerCase() ===
        `${reviewer.firstName ?? ''} ${reviewer.lastName ?? ''}`.trim().toLowerCase(),
  )
  const submitReview = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedLeave) return
    reviewLeave.mutate(
      { id: selectedLeave.id, action, ...(comment.trim() ? { comment: comment.trim() } : {}) },
      { onSuccess: () => { setSelectedLeave(null); setComment('') } },
    )
  }

  const columns: Array<DataColumn<StaffLeave>> = [
    { id: 'staff', header: 'Staff member', cell: (row) => staffDisplayName(row.staff) },
    { id: 'dates', header: 'Dates', cell: (row) => `${row.startDate} – ${row.endDate}` },
    { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
    { id: 'status', header: 'Status', cell: (row) => <Badge variant={leaveBadgeVariant(row.status)}>{leaveStatusLabel(row.status)}</Badge> },
    { id: 'supervisorComment', header: 'Supervisor comment', cell: (row) => row.supervisorComment || '—', hideOnMobile: true },
    { id: 'hrComment', header: 'HR comment', cell: (row) => row.hrComment || '—', hideOnMobile: true },
    { id: 'actions', header: 'Review', className: 'w-32', cell: (row) => ['PENDING', 'PENDING_SUPERVISOR', 'APPROVED_BY_SUPERVISOR'].includes(row.status) ? <Button size="sm" variant="outline" disabled={staff.isLoading || !reviewer} onClick={() => { setSelectedLeave(row); setAction('APPROVED') }}>Review</Button> : '—' },
  ]

  if (leaves.isError) return <ErrorState message={toUserMessage(leaves.error)} onRetry={() => void leaves.refetch()} />
  if (!leaves.isLoading && rows.length === 0) return <EmptyState title="No leave requests" description="New staff applications will appear here for review." />

  return <>
    <FormSection title="Leave requests" description="Review pending requests or check previous decisions.">
      {!staff.isLoading && !reviewer ? <p className="type-caption text-warning-foreground sm:col-span-2">This account is not linked to a staff profile. The review endpoint requires the reviewer’s staff record.</p> : null}
      {staff.isError ? <div className="sm:col-span-2"><ErrorState message={toUserMessage(staff.error)} onRetry={() => void staff.refetch()} /></div> : null}
      <div className="sm:col-span-2"><DataTable columns={columns} rows={rows.slice((page - 1) * 10, page * 10)} getRowId={(row) => row.id} isLoading={leaves.isLoading} page={page} pageSize={10} total={rows.length} onPageChange={setPage}
      mobileCard={(row) => <div className="space-y-2"><div className="flex items-start justify-between gap-2"><p className="type-label">{staffDisplayName(row.staff)}</p><Badge variant={leaveBadgeVariant(row.status)}>{leaveStatusLabel(row.status)}</Badge></div><p className="type-caption text-muted-foreground">{row.startDate} – {row.endDate}</p><p className="type-body">{row.reason || 'No reason provided.'}</p>{row.supervisorComment ? <p className="type-caption text-muted-foreground">Supervisor: {row.supervisorComment}</p> : null}{row.hrComment ? <p className="type-caption text-muted-foreground">HR: {row.hrComment}</p> : null}</div>} /></div></FormSection>
    <Dialog open={selectedLeave !== null} onOpenChange={(open) => { if (!open) setSelectedLeave(null) }}>
      <DialogContent>
        {selectedLeave ? <form onSubmit={submitReview} className="space-y-5">
          <DialogHeader><DialogTitle>Review leave request</DialogTitle><DialogDescription>{staffDisplayName(selectedLeave.staff)} · {selectedLeave.startDate} – {selectedLeave.endDate}</DialogDescription></DialogHeader>
          <p className="type-body">{selectedLeave.reason || 'No reason provided.'}</p>
          {selectedLeave.status === 'PENDING_SUPERVISOR' && isSupervisorForSelectedLeave ? <p className="type-caption text-muted-foreground">As the assigned supervisor, you can approve this request to advance it to HR review.</p> : <SelectField label="Decision" value={action} onChange={(value) => setAction(value as 'APPROVED' | 'REJECTED')} options={[{ value: 'APPROVED', label: 'Approve' }, { value: 'REJECTED', label: 'Reject' }]} allowEmpty={false} />}
          <TextareaField label="Review comment" value={comment} onChange={(event) => setComment(event.target.value)} rows={3} />
          <div className="flex justify-end"><Button type="submit" isLoading={reviewLeave.isPending} loadingLabel="Saving review" disabled={!reviewer || staff.isLoading}>Submit review</Button></div>
        </form> : null}
      </DialogContent>
    </Dialog>
  </>
}

function SalaryPanel(): ReactNode {
  const staff = useStaffList()
  const { saveSalary, processPayroll } = useHrMutations()
  const [staffId, setStaffId] = useState('')
  const [basicSalary, setBasicSalary] = useState('')
  const [houseAllowance, setHouseAllowance] = useState('0')
  const [transportAllowance, setTransportAllowance] = useState('0')
  const [helbAmount, setHelbAmount] = useState('0')
  const [saccoContribution, setSaccoContribution] = useState('0')
  const [isNssfEnabled, setIsNssfEnabled] = useState(true)
  const [isNhifEnabled, setIsNhifEnabled] = useState(true)
  const [payPeriod, setPayPeriod] = useState(currentPayPeriod)
  const staffOptions = (staff.data ?? []).map((person) => ({ value: String(person.id), label: `${staffName(person)}${person.staffNumber ? ` · ${person.staffNumber}` : ''}` }))
  const monthOptions = Array.from({ length: 24 }, (_, offset) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - offset)
    return `${MONTHS[date.getMonth()]}-${date.getFullYear()}`
  })

  const submitSalary = (event: FormEvent) => {
    event.preventDefault()
    const amounts = {
      basicSalary: Number(basicSalary),
      houseAllowance: Number(houseAllowance),
      transportAllowance: Number(transportAllowance),
      helbAmount: Number(helbAmount),
      saccoContribution: Number(saccoContribution),
    }
    const values = Object.values(amounts)
    if (!Number(staffId) || values.some((value) => !Number.isFinite(value) || value < 0) || amounts.basicSalary <= 0) {
      toast.error('Choose a staff member and enter valid non-negative amounts. Basic salary must be greater than zero.')
      return
    }
    saveSalary.mutate({
      staff: { id: Number(staffId) },
      ...amounts,
      isNssfEnabled,
      isNhifEnabled,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert variant="warning"><AlertTitle>Payroll calculation limitation</AlertTitle><AlertDescription>The current Java processor creates payroll at a fixed KES 50,000 basic salary and does not yet apply these saved salary settings or deductions.</AlertDescription></Alert>
      <form onSubmit={submitSalary}>
        <FormSection title="Salary settings" description="Save the employee salary configuration for payroll administration.">
          {staff.isError ? <div className="sm:col-span-2"><ErrorState message={toUserMessage(staff.error)} onRetry={() => void staff.refetch()} /></div> : null}
          <SelectField label="Staff member" value={staffId} onChange={setStaffId} options={staffOptions} allowEmpty={false} placeholder="Select staff" emptyMessage="No staff records available." />
          <TextField label="Basic salary (KES)" type="number" min="0.01" step="0.01" value={basicSalary} onChange={(event) => setBasicSalary(event.target.value)} required />
          <TextField label="House allowance (KES)" type="number" min="0" step="0.01" value={houseAllowance} onChange={(event) => setHouseAllowance(event.target.value)} required />
          <TextField label="Transport allowance (KES)" type="number" min="0" step="0.01" value={transportAllowance} onChange={(event) => setTransportAllowance(event.target.value)} required />
          <TextField label="HELB amount (KES)" type="number" min="0" step="0.01" value={helbAmount} onChange={(event) => setHelbAmount(event.target.value)} required />
          <TextField label="SACCO contribution (KES)" type="number" min="0" step="0.01" value={saccoContribution} onChange={(event) => setSaccoContribution(event.target.value)} required />
          <div className="flex flex-wrap gap-x-6 gap-y-3 sm:col-span-2">
            <label className="inline-flex min-h-10 items-center gap-2 type-body"><input type="checkbox" checked={isNssfEnabled} onChange={(event) => setIsNssfEnabled(event.target.checked)} className="size-4 accent-primary" />Enable NSSF</label>
            <label className="inline-flex min-h-10 items-center gap-2 type-body"><input type="checkbox" checked={isNhifEnabled} onChange={(event) => setIsNhifEnabled(event.target.checked)} className="size-4 accent-primary" />Enable NHIF</label>
          </div>
          <div className="sm:col-span-2"><Button type="submit" isLoading={saveSalary.isPending} loadingLabel="Saving">Save salary settings</Button></div>
        </FormSection>
      </form>
      <form onSubmit={(event) => { event.preventDefault(); processPayroll.mutate(payPeriod) }}>
        <FormSection title="Process payroll" description="Creates payroll records for all active staff for the selected period.">
          <SelectField label="Pay period" value={payPeriod} onChange={setPayPeriod} options={monthOptions.map((month) => ({ value: month, label: month }))} allowEmpty={false} />
          <div className="flex items-end"><Button type="submit" isLoading={processPayroll.isPending} loadingLabel="Processing">Process payroll</Button></div>
          <p className="type-caption text-muted-foreground sm:col-span-2">Payroll records and payment status are available in Finance.</p>
        </FormSection>
      </form>
    </div>
  )
}

function staffName(person: Staff): string {
  const name = [person.firstName, person.secondName, person.lastName].filter(Boolean).join(' ')
  return name || `Staff #${person.id}`
}