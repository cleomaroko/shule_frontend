import { useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { ErrorState } from '@/components/feedback/PageStates'
import { FormSection } from '@/components/forms/FormSection'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useAllowances,
  useDeductions,
  useHrMutations,
  useHrPayroll,
} from '@/features/hr/hooks/useHr'
import {
  payRuleIsGlobal,
  payRuleIsPercentage,
  payrollBadgeVariant,
  payrollStatusLabel,
  staffDisplayName,
  type PayRule,
  type PayRulePayload,
  type PayrollRecord,
} from '@/features/hr/types/hr.types'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import type { Staff } from '@/features/staff/types/staff.types'
import { formatKes } from '@/lib/format'

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

function staffName(person: Staff): string {
  const name = [person.firstName, person.secondName, person.lastName].filter(Boolean).join(' ')
  return name || person.fullName || `Staff #${person.id}`
}

export function PaySetupPanel(): ReactNode {
  return (
    <div className="flex flex-col gap-6">
      <BasicSalaryForm />
      <PayRuleForm kind="allowance" />
      <PayRuleForm kind="deduction" />
      <PayrunForm />
    </div>
  )
}

function BasicSalaryForm(): ReactNode {
  const staff = useStaffList()
  const { saveSalary } = useHrMutations()
  const [staffId, setStaffId] = useState('')
  const [basicSalary, setBasicSalary] = useState('')
  const options = (staff.data ?? []).map((person) => ({
    value: String(person.id),
    label: `${staffName(person)}${person.staffNumber ? ` · ${person.staffNumber}` : ''}`,
  }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const id = Number(staffId)
    const amount = Number(basicSalary)
    if (!id || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Choose a staff member and enter a basic salary greater than zero.')
      return
    }
    saveSalary.mutate({ id, staff: { id }, basicSalary: amount })
  }

  return (
    <form onSubmit={submit}>
      <FormSection
        title="Basic salary"
        description="The draft pay run starts from this amount, then adds allowances and subtracts deductions."
      >
        {staff.isError ? (
          <div className="sm:col-span-2">
            <ErrorState message={toUserMessage(staff.error)} onRetry={() => void staff.refetch()} />
          </div>
        ) : null}
        <SelectField
          label="Staff member"
          value={staffId}
          onChange={setStaffId}
          options={options}
          emptyLabel="Select staff"
          emptyMessage="No staff records available."
        />
        <TextField
          label="Basic salary (KES)"
          type="number"
          min="0.01"
          step="0.01"
          value={basicSalary}
          onChange={(event) => setBasicSalary(event.target.value)}
          required
        />
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full sm:w-auto" isLoading={saveSalary.isPending} loadingLabel="Saving">
            Save basic salary
          </Button>
        </div>
      </FormSection>
    </form>
  )
}

function PayRuleForm({ kind }: { kind: 'allowance' | 'deduction' }): ReactNode {
  const staff = useStaffList()
  const allowances = useAllowances(kind === 'allowance')
  const deductions = useDeductions(kind === 'deduction')
  const list = kind === 'allowance' ? allowances : deductions
  const { saveAllowance, deleteAllowance, saveDeduction, deleteDeduction } = useHrMutations()
  const save = kind === 'allowance' ? saveAllowance : saveDeduction
  const remove = kind === 'allowance' ? deleteAllowance : deleteDeduction
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PayRule | null>(null)
  const [staffId, setStaffId] = useState('')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [scope, setScope] = useState<'person' | 'everyone'>('person')
  const [measure, setMeasure] = useState<'fixed' | 'percent'>('fixed')
  const [page, setPage] = useState(1)

  const title = kind === 'allowance' ? 'Allowances' : 'Deductions'
  const percentHint = kind === 'allowance' ? 'Percent of basic salary' : 'Percent of gross salary'
  const options = (staff.data ?? []).map((person) => ({
    value: String(person.id),
    label: `${staffName(person)}${person.staffNumber ? ` · ${person.staffNumber}` : ''}`,
  }))

  const reset = () => {
    setEditingId(null)
    setName('')
    setValue('')
    setScope('person')
    setMeasure('fixed')
  }

  const edit = (rule: PayRule) => {
    setEditingId(rule.id)
    setStaffId(rule.staff?.id ? String(rule.staff.id) : '')
    setName(rule.name ?? '')
    setValue(rule.value == null ? '' : String(rule.value))
    setScope(payRuleIsGlobal(rule) ? 'everyone' : 'person')
    setMeasure(payRuleIsPercentage(rule) ? 'percent' : 'fixed')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const id = Number(staffId)
    const amount = Number(value)
    if (!id || !name.trim() || !Number.isFinite(amount) || amount < 0) {
      toast.error('Choose a staff member, a name, and an amount of zero or more.')
      return
    }
    const everyone = scope === 'everyone'
    const percentage = measure === 'percent'
    const body: PayRulePayload = {
      staff: { id },
      name: name.trim(),
      value: amount,
      isGlobal: everyone,
      global: everyone,
      isPercentage: percentage,
      percentage,
    }
    save.mutate(editingId ? { id: editingId, body } : { body }, { onSuccess: reset })
  }

  const columns: Array<DataColumn<PayRule>> = [
    { id: 'name', header: 'Name', cell: (row) => row.name || '—' },
    {
      id: 'scope',
      header: 'Applies to',
      cell: (row) => (payRuleIsGlobal(row) ? 'Everyone' : staffDisplayName(row.staff)),
    },
    {
      id: 'value',
      header: 'Value',
      cell: (row) => (payRuleIsPercentage(row) ? `${row.value ?? 0}%` : formatKes(row.value)),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-36',
      cell: (row) => (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => edit(row)}>
            Edit
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setPendingDelete(row)}>
            Remove
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <form onSubmit={submit}>
        <FormSection
          title={title}
          description={
            kind === 'allowance'
              ? 'A rule for one person, or every active staff member. A global rule is stored on one staff record and is also counted again for that person.'
              : 'Deductions such as NSSF, SHA, or HELB. A percentage is taken from gross pay. A global rule is stored on one staff record and is also counted again for that person.'
          }
        >
          {list.isError ? (
            <div className="sm:col-span-2">
              <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
            </div>
          ) : null}
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
          <SelectField
            label="Stored against"
            value={staffId}
            onChange={setStaffId}
            options={options}
            emptyLabel="Select staff"
          />
          <SelectField
            label="Applies to"
            value={scope}
            onChange={(next) => setScope(next as 'person' | 'everyone')}
            options={[
              { value: 'person', label: 'This staff member' },
              { value: 'everyone', label: 'Every active staff member' },
            ]}
            allowEmpty={false}
          />
          <SelectField
            label="Measure"
            value={measure}
            onChange={(next) => setMeasure(next as 'fixed' | 'percent')}
            options={[
              { value: 'fixed', label: 'Fixed amount (KES)' },
              { value: 'percent', label: percentHint },
            ]}
            allowEmpty={false}
          />
          <TextField
            label={measure === 'percent' ? 'Percent' : 'Amount (KES)'}
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            required
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Button type="submit" className="w-full sm:w-auto" isLoading={save.isPending} loadingLabel="Saving">
              {editingId ? 'Update rule' : 'Add rule'}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={reset}>
                Cancel edit
              </Button>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <DataTable
              columns={columns}
              rows={(list.data ?? []).slice((page - 1) * 8, page * 8)}
              getRowId={(row) => row.id}
              isLoading={list.isLoading}
              page={page}
              pageSize={8}
              total={list.data?.length ?? 0}
              onPageChange={setPage}
              mobileCard={(row) => (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-label">{row.name || 'Rule'}</p>
                    <p className="type-caption text-muted-foreground">
                      {payRuleIsGlobal(row) ? 'Everyone' : staffDisplayName(row.staff)} ·{' '}
                      {payRuleIsPercentage(row) ? `${row.value ?? 0}%` : formatKes(row.value)}
                    </p>
                  </div>
                  <Badge variant={payRuleIsGlobal(row) ? 'neutral' : 'primary'}>
                    {payRuleIsGlobal(row) ? 'Global' : 'Individual'}
                  </Badge>
                </div>
              )}
            />
          </div>
        </FormSection>
      </form>
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Remove ${kind}?`}
        description={pendingDelete ? `${pendingDelete.name || 'This rule'} will no longer be included in the next draft.` : ''}
        confirmLabel="Remove"
        isConfirming={remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          remove.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </>
  )
}

function PayrunForm(): ReactNode {
  const payroll = useHrPayroll()
  const { draftPayroll, submitPayroll } = useHrMutations()
  const [payPeriod, setPayPeriod] = useState(currentPayPeriod)
  const [page, setPage] = useState(1)
  const monthOptions = Array.from({ length: 24 }, (_, offset) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - offset)
    return `${MONTHS[date.getMonth()]}-${date.getFullYear()}`
  })
  const rows = (payroll.data ?? []).filter((row) => (row.payPeriod ?? '').toUpperCase() === payPeriod)
  const columns: Array<DataColumn<PayrollRecord>> = [
    { id: 'staff', header: 'Staff', cell: (row) => staffDisplayName(row.staff) },
    { id: 'gross', header: 'Gross', cell: (row) => formatKes(row.grossSalary), hideOnMobile: true },
    { id: 'net', header: 'Net', cell: (row) => formatKes(row.netSalary) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={payrollBadgeVariant(row.status)}>{payrollStatusLabel(row.status)}</Badge>,
    },
  ]

  return (
    <FormSection
      title="Pay run"
      description="Create a draft from basic salary, allowances, and deductions. Review it, then send it to finance."
    >
      <SelectField
        label="Pay period"
        value={payPeriod}
        onChange={(value) => {
          setPayPeriod(value)
          setPage(1)
        }}
        options={monthOptions.map((month) => ({ value: month, label: month }))}
        allowEmpty={false}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Button
          type="button"
          className="w-full sm:w-auto"
          isLoading={draftPayroll.isPending}
          loadingLabel="Creating draft"
          onClick={() => draftPayroll.mutate(payPeriod)}
        >
          Create draft
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          isLoading={submitPayroll.isPending}
          loadingLabel="Sending"
          onClick={() => submitPayroll.mutate(payPeriod)}
        >
          Send to finance
        </Button>
      </div>
      <div className="sm:col-span-2">
        {payroll.isError ? (
          <ErrorState message={toUserMessage(payroll.error)} onRetry={() => void payroll.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows.slice((page - 1) * 8, page * 8)}
            getRowId={(row) => row.id}
            isLoading={payroll.isLoading}
            page={page}
            pageSize={8}
            total={rows.length}
            onPageChange={setPage}
            mobileCard={(row) => (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="type-label">{staffDisplayName(row.staff)}</p>
                  <p className="type-caption text-muted-foreground">Net {formatKes(row.netSalary)}</p>
                </div>
                <Badge variant={payrollBadgeVariant(row.status)}>{payrollStatusLabel(row.status)}</Badge>
              </div>
            )}
          />
        )}
      </div>
    </FormSection>
  )
}
