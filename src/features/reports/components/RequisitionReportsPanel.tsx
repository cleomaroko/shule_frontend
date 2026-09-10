import { useMemo, useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip } from '@/components/data/FilterBar'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { currentMonthRange, type CountRow } from '@/features/reports/lib/summaries'
import { useCampuses, useDepartments } from '@/features/lookups/useLookups'
import { useCostCenters, useRequisitionSummary } from '@/features/requisitions/hooks/useRequisitions'
import type { Requisition, RequisitionQuery, RequisitionType } from '@/features/requisitions/types/requisition.types'
import {
  REQUISITION_TYPES,
  asMoney,
  formatKes,
  requisitionStatusLabel,
  requisitionTypeLabel,
  statusBadgeVariant,
} from '@/features/requisitions/types/requisition.types'
import { displayValue, formatDate, formatPersonName } from '@/lib/format'

const PAGE_SIZE = 10
const STATUS_FILTERS = ['all', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'RECEIVED', 'REJECTED'] as const

function moneyRows(map: Record<string, number | string> | null | undefined): CountRow[] {
  return Object.entries(map ?? {})
    .map(([label, value]) => ({ label, count: asMoney(value) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function RequisitionReportsPanel(): ReactNode {
  const month = currentMonthRange()
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [type, setType] = useState('')
  const [campusId, setCampusId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [costCenterId, setCostCenterId] = useState('')
  const [startDate, setStartDate] = useState(month.start)
  const [endDate, setEndDate] = useState(month.end)
  const [page, setPage] = useState(1)

  const campuses = useCampuses()
  const departments = useDepartments()
  const costCenters = useCostCenters()

  const query = useMemo<RequisitionQuery>(() => {
    const next: RequisitionQuery = {}
    if (status !== 'all') next.status = status
    if (type) next.type = type as RequisitionType
    if (Number(campusId)) next.campusId = Number(campusId)
    if (Number(departmentId)) next.departmentId = Number(departmentId)
    if (Number(costCenterId)) next.costCenterId = Number(costCenterId)
    if (startDate) next.startDate = startDate
    if (endDate) next.endDate = endDate
    return next
  }, [campusId, costCenterId, departmentId, endDate, startDate, status, type])

  const summary = useRequisitionSummary(query)
  const data = summary.data
  const rows = data?.requisitions ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<Requisition>> = [
    { id: 'number', header: 'Number', cell: (row) => displayValue(row.requisitionNumber) },
    { id: 'date', header: 'Date', cell: (row) => formatDate(row.requisitionDate) },
    { id: 'type', header: 'Type', hideOnMobile: true, cell: (row) => requisitionTypeLabel(row.type) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={statusBadgeVariant(row.status)}>{requisitionStatusLabel(row.status)}</Badge>,
    },
    { id: 'est', header: 'Estimated', cell: (row) => formatKes(row.totalEstimatedAmount) },
    { id: 'app', header: 'Approved', hideOnMobile: true, cell: (row) => formatKes(row.approvedAmount) },
  ]

  if (summary.isError) {
    return <ErrorState message={toUserMessage(summary.error)} onRetry={() => void summary.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Requisition summary"
        note="Totals from GET /api/requisitions/reports/summary. Cost-center and campus bars use approved amount when it is greater than zero, otherwise estimated."
      >
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((value) => (
            <FilterChip
              key={value}
              label={value === 'all' ? 'All statuses' : requisitionStatusLabel(value)}
              active={status === value}
              onClick={() => {
                setStatus(value)
                setPage(1)
              }}
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Type"
            value={type}
            onChange={(value) => {
              setType(value)
              setPage(1)
            }}
            options={REQUISITION_TYPES.map((value) => ({ value, label: requisitionTypeLabel(value) }))}
            placeholder="All types"
          />
          <SelectField
            label="Campus"
            value={campusId}
            onChange={(value) => {
              setCampusId(value)
              setPage(1)
            }}
            options={(campuses.data ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
            placeholder="All campuses"
          />
          <SelectField
            label="Department"
            value={departmentId}
            onChange={(value) => {
              setDepartmentId(value)
              setPage(1)
            }}
            options={(departments.data ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
            placeholder="All departments"
          />
          <SelectField
            label="Cost center"
            value={costCenterId}
            onChange={(value) => {
              setCostCenterId(value)
              setPage(1)
            }}
            options={(costCenters.data ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
            placeholder="All cost centers"
          />
          <TextField
            label="From"
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value)
              setPage(1)
            }}
          />
          <TextField
            label="To"
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <StatGrid
          loading={summary.isLoading}
          items={[
            {
              label: 'Requisitions',
              value: (data?.totalRequisitions ?? 0).toLocaleString(),
              hint: 'Matching the filters above',
            },
            {
              label: 'Estimated total',
              value: formatKes(data?.grandTotalEstimated),
            },
            {
              label: 'Approved total',
              value: formatKes(data?.grandTotalApproved),
            },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="By cost center (KES)"
            rows={moneyRows(data?.costByCostCenter)}
            empty="No cost-center amounts in this range."
            loading={summary.isLoading}
          />
          <BreakdownCard
            title="By campus (KES)"
            rows={moneyRows(data?.costByCampus)}
            empty="No campus amounts in this range."
            loading={summary.isLoading}
          />
        </div>
      </ReportSection>
      <ReportSection title="Matching requisitions">
        {rows.length === 0 && !summary.isLoading ? (
          <EmptyState title="No requisitions in this range" description="Widen the dates or clear a filter." />
        ) : (
          <DataTable
            columns={columns}
            rows={paged}
            getRowId={(row) => row.id}
            isLoading={summary.isLoading}
            page={page}
            pageSize={PAGE_SIZE}
            total={rows.length}
            onPageChange={setPage}
            mobileCard={(row) => (
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="type-heading">{displayValue(row.requisitionNumber)}</p>
                    <p className="type-caption text-muted-foreground">
                      {formatDate(row.requisitionDate)} · {requisitionTypeLabel(row.type)}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant(row.status)}>{requisitionStatusLabel(row.status)}</Badge>
                </div>
                <p className="type-caption text-muted-foreground">
                  Estimated {formatKes(row.totalEstimatedAmount)} · Approved {formatKes(row.approvedAmount)}
                </p>
                <p className="type-caption text-muted-foreground">
                  {displayValue(row.costCenter?.name)}
                  {row.createdBy ? ` · ${formatPersonName(row.createdBy)}` : ''}
                </p>
              </div>
            )}
          />
        )}
      </ReportSection>
    </div>
  )
}
