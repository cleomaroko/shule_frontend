import { useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { Badge } from '@/components/ui/badge'
import { useBiometricSummary } from '@/features/biometric/hooks/useBiometric'
import {
  useHrLeaves,
  useHrPayroll,
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
  type StaffAttendanceRecord,
  type StaffLeave,
} from '@/features/hr/types/hr.types'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy, currentMonthRange } from '@/features/reports/lib/summaries'
import { asMoney, displayValue, formatDate, formatKes, todayIso } from '@/lib/format'
import { paths } from '@/routes/paths'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const PAGE_SIZE = 8

export function HrReportsPanel(): ReactNode {
  const { user } = useAuth()
  const canHr = can(user?.role, 'finance:access')
  const month = currentMonthRange()
  const filters = { startDate: month.start, endDate: month.end }

  return (
    <div className="flex flex-col gap-8">
      <BiometricReport />
      {canHr ? (
        <HrAdminReport filters={filters} periodLabel={`${month.start} to ${month.end}`} />
      ) : (
        <HrPersonalReport filters={filters} periodLabel={`${month.start} to ${month.end}`} />
      )}
    </div>
  )
}

function BiometricReport(): ReactNode {
  const summary = useBiometricSummary(todayIso())
  if (summary.isError) {
    return <ErrorState message={toUserMessage(summary.error)} onRetry={() => void summary.refetch()} />
  }
  const data = summary.data
  return (
    <ReportSection
      title="Staff biometric punches"
      note="GET /api/biometric/summary for today. These are device punches, not the learner class register."
    >
      <StatGrid
        items={[
          { label: 'Punches', value: (data?.totalPunches ?? 0).toLocaleString(), hint: 'Today' },
          { label: 'People', value: (data?.uniquePeoplePunched ?? 0).toLocaleString(), hint: 'Distinct codes' },
          { label: 'Check-ins', value: (data?.totalCheckIns ?? 0).toLocaleString() },
          { label: 'Check-outs', value: (data?.totalCheckOuts ?? 0).toLocaleString() },
        ]}
        loading={summary.isLoading}
      />
      <div>
        <Button variant="outline" asChild>
          <Link to={`${paths.hr}?tab=biometric`}>Open biometric log</Link>
        </Button>
      </div>
    </ReportSection>
  )
}

function HrAdminReport({
  filters,
  periodLabel,
}: {
  filters: { startDate: string; endDate: string }
  periodLabel: string
}): ReactNode {
  const leaves = useHrLeaves()
  const payroll = useHrPayroll()
  const attendance = useStaffAttendanceReport(filters)
  const [leavePage, setLeavePage] = useState(1)
  const [payPage, setPayPage] = useState(1)

  const leaveRows = leaves.data ?? []
  const payRows = payroll.data ?? []
  const attendanceRows = attendance.data ?? []
  const net = payRows.reduce((sum, row) => sum + asMoney(row.netSalary), 0)

  if (leaves.isError) {
    return <ErrorState message={toUserMessage(leaves.error)} onRetry={() => void leaves.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Human resources"
        note="Leave and payroll lists need finance access. Staff attendance below is this calendar month."
      >
        <StatGrid
          items={[
            { label: 'Leave requests', value: leaveRows.length.toLocaleString(), hint: 'All statuses' },
            {
              label: 'Pending review',
              value: leaveRows.filter((row) => row.status.includes('PENDING')).length.toLocaleString(),
              hint: 'Waiting on a supervisor or HR',
            },
            { label: 'Payroll rows', value: payRows.length.toLocaleString(), hint: 'Processed and paid' },
            { label: 'Net payroll', value: formatKes(net), hint: 'Sum of net salary on the list' },
          ]}
          loading={leaves.isLoading || payroll.isLoading}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="Leave by status"
            rows={countBy(leaveRows, (row) => leaveStatusLabel(row.status))}
            empty="No leave requests yet."
            loading={leaves.isLoading}
          />
          <BreakdownCard
            title="Payroll by status"
            rows={countBy(payRows, (row) => payrollStatusLabel(row.status))}
            empty="No payroll rows yet."
            loading={payroll.isLoading}
          />
          <BreakdownCard
            title={`Attendance ${periodLabel}`}
            rows={countBy(attendanceRows, (row) => row.status)}
            empty="No staff attendance in this month."
            loading={attendance.isLoading}
          />
        </div>
        <div>
          <Button variant="outline" asChild>
            <Link to={paths.hr}>Open HR</Link>
          </Button>
        </div>
      </ReportSection>

      <ReportSection title="Leave requests">
        <LeaveTable
          rows={leaveRows.slice((leavePage - 1) * PAGE_SIZE, leavePage * PAGE_SIZE)}
          total={leaveRows.length}
          page={leavePage}
          loading={leaves.isLoading}
          onPageChange={setLeavePage}
        />
      </ReportSection>

      <ReportSection title="Payroll">
        {payroll.isError ? (
          <ErrorState message={toUserMessage(payroll.error)} onRetry={() => void payroll.refetch()} />
        ) : (
          <PayrollTable
            rows={payRows.slice((payPage - 1) * PAGE_SIZE, payPage * PAGE_SIZE)}
            total={payRows.length}
            page={payPage}
            loading={payroll.isLoading}
            onPageChange={setPayPage}
          />
        )}
      </ReportSection>
    </div>
  )
}

function HrPersonalReport({
  filters,
  periodLabel,
}: {
  filters: { startDate: string; endDate: string }
  periodLabel: string
}): ReactNode {
  const payroll = useMyPayroll()
  const attendance = useMyAttendance(filters)
  const appraisals = useMyAppraisals()
  const [page, setPage] = useState(1)
  const rows = payroll.data ?? []

  if (payroll.isError && attendance.isError) {
    return (
      <EmptyState
        title="No staff profile for this login"
        description="Your own payroll and attendance need a staff record whose work email matches your username. School-wide HR lists need finance access."
        actionLabel="Open HR"
        actionTo={paths.hr}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="My HR"
        note="These are your own records. School-wide leave, payroll, and attendance reports need finance access."
      >
        <StatGrid
          items={[
            { label: 'My payslips', value: rows.length.toLocaleString(), hint: 'Payroll rows on your profile' },
            {
              label: 'This month',
              value: (attendance.data?.length ?? 0).toLocaleString(),
              hint: `Attendance days ${periodLabel}`,
            },
            { label: 'Appraisals', value: (appraisals.data?.length ?? 0).toLocaleString(), hint: 'On your profile' },
          ]}
          loading={payroll.isLoading || attendance.isLoading}
        />
        <BreakdownCard
          title="My attendance this month"
          rows={countBy(attendance.data ?? [], (row: StaffAttendanceRecord) => row.status)}
          empty="No attendance recorded for you this month."
          loading={attendance.isLoading}
        />
      </ReportSection>
      <ReportSection title="My payroll">
        <PayrollTable
          rows={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
          total={rows.length}
          page={page}
          loading={payroll.isLoading}
          onPageChange={setPage}
        />
      </ReportSection>
    </div>
  )
}

function LeaveTable({
  rows,
  total,
  page,
  loading,
  onPageChange,
}: {
  rows: StaffLeave[]
  total: number
  page: number
  loading: boolean
  onPageChange: (page: number) => void
}): ReactNode {
  const columns: Array<DataColumn<StaffLeave>> = [
    { id: 'staff', header: 'Staff', cell: (row) => staffDisplayName(row.staff) },
    { id: 'from', header: 'From', hideOnMobile: true, cell: (row) => formatDate(row.startDate) },
    { id: 'to', header: 'To', hideOnMobile: true, cell: (row) => formatDate(row.endDate) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={leaveBadgeVariant(row.status)}>{leaveStatusLabel(row.status)}</Badge>,
    },
  ]

  if (total === 0 && !loading) {
    return <EmptyState title="No leave requests" description="Applications will appear here after staff submit them." />
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      isLoading={loading}
      page={page}
      pageSize={PAGE_SIZE}
      total={total}
      onPageChange={onPageChange}
      mobileCard={(row) => (
        <div>
          <p className="type-heading">{staffDisplayName(row.staff)}</p>
          <p className="type-caption text-muted-foreground">
            {formatDate(row.startDate)} – {formatDate(row.endDate)} · {leaveStatusLabel(row.status)}
          </p>
        </div>
      )}
    />
  )
}

function PayrollTable({
  rows,
  total,
  page,
  loading,
  onPageChange,
}: {
  rows: PayrollRecord[]
  total: number
  page: number
  loading: boolean
  onPageChange: (page: number) => void
}): ReactNode {
  const columns: Array<DataColumn<PayrollRecord>> = [
    { id: 'staff', header: 'Staff', cell: (row) => staffDisplayName(row.staff) },
    { id: 'period', header: 'Period', hideOnMobile: true, cell: (row) => displayValue(row.payPeriod) },
    { id: 'net', header: 'Net', cell: (row) => formatKes(row.netSalary) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={payrollBadgeVariant(row.status)}>{payrollStatusLabel(row.status)}</Badge>,
    },
  ]

  if (total === 0 && !loading) {
    return <EmptyState title="No payroll rows" description="Processed payroll will appear here." />
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      isLoading={loading}
      page={page}
      pageSize={PAGE_SIZE}
      total={total}
      onPageChange={onPageChange}
      mobileCard={(row) => (
        <div>
          <p className="type-heading">{staffDisplayName(row.staff)}</p>
          <p className="type-caption text-muted-foreground">
            {displayValue(row.payPeriod)} · {formatKes(row.netSalary)}
          </p>
        </div>
      )}
    />
  )
}
