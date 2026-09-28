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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHrLeaves, useHrMutations, useMyAppraisals, useMyPayroll } from '@/features/hr/hooks/useHr'
import {
  leaveBadgeVariant,
  payrollBadgeVariant,
  payrollStatusLabel,
  staffDisplayName,
  type PayrollRecord,
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
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      {hasStaffProfile ? <LeaveApplicationPanel /> : <StaffProfileRequired title="Staff leave self-service unavailable" />}
      <PersonalRecordsPanel hasStaffProfile={hasStaffProfile} />
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
                mobileCard={(row) => <div className="flex items-center justify-between gap-3"><div><p className="type-label">{row.payPeriod || 'Payroll'}</p><p className="type-caption text-muted-foreground">Net pay · {formatKes(row.netSalary)}</p></div><Badge variant={payrollBadgeVariant(row.status)}>{payrollStatusLabel(row.status)}</Badge></div>} />
            </div>
          )}
      </FormSection>
    </div>
  )
}

function AttendancePanel(): ReactNode {
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

function LeaveReviewPanel(): ReactNode {
  const leaves = useHrLeaves()
  const { updateLeaveStatus } = useHrMutations()
  const [page, setPage] = useState(1)
  const rows = leaves.data ?? []
  const columns: Array<DataColumn<StaffLeave>> = [
    { id: 'staff', header: 'Staff member', cell: (row) => staffDisplayName(row.staff) },
    { id: 'dates', header: 'Dates', cell: (row) => `${row.startDate} – ${row.endDate}` },
    { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
    { id: 'status', header: 'Status', cell: (row) => <Badge variant={leaveBadgeVariant(row.status)}>{row.status}</Badge> },
    { id: 'actions', header: 'Decision', className: 'w-48', cell: (row) => row.status === 'PENDING' ? <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => updateLeaveStatus.mutate({ id: row.id, status: 'APPROVED' })} disabled={updateLeaveStatus.isPending}>Approve</Button><Button size="sm" variant="destructive" onClick={() => updateLeaveStatus.mutate({ id: row.id, status: 'REJECTED' })} disabled={updateLeaveStatus.isPending}>Reject</Button></div> : '—' },
  ]

  if (leaves.isError) return <ErrorState message={toUserMessage(leaves.error)} onRetry={() => void leaves.refetch()} />
  if (!leaves.isLoading && rows.length === 0) return <EmptyState title="No leave requests" description="New staff applications will appear here for review." />

  return <FormSection title="Leave requests" description="Review pending requests or check previous decisions."><div className="sm:col-span-2"><DataTable columns={columns} rows={rows.slice((page - 1) * 10, page * 10)} getRowId={(row) => row.id} isLoading={leaves.isLoading} page={page} pageSize={10} total={rows.length} onPageChange={setPage}
    mobileCard={(row) => <div className="space-y-2"><div className="flex items-start justify-between gap-2"><p className="type-label">{staffDisplayName(row.staff)}</p><Badge variant={leaveBadgeVariant(row.status)}>{row.status}</Badge></div><p className="type-caption text-muted-foreground">{row.startDate} – {row.endDate}</p><p className="type-body">{row.reason || 'No reason provided.'}</p></div>} /></div></FormSection>
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