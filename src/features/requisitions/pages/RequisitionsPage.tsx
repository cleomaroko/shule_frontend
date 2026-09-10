import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { isApiError, toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip, SearchField } from '@/components/data/FilterBar'
import { NamedLookupManager } from '@/components/data/NamedLookupManager'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCampuses, useDepartments } from '@/features/lookups/useLookups'
import { RequisitionDetailDialog } from '@/features/requisitions/components/RequisitionDetailDialog'
import { RequisitionDialog } from '@/features/requisitions/components/RequisitionDialog'
import {
  WorkflowActionDialog,
  type WorkflowKind,
} from '@/features/requisitions/components/WorkflowActionDialog'
import {
  useCostCenters,
  useMyRequisitions,
  useRequisition,
  useRequisitionList,
  useRequisitionMutations,
} from '@/features/requisitions/hooks/useRequisitions'
import type { CreateRequisitionPayload, Requisition, RequisitionQuery, RequisitionType, WorkflowActionPayload } from '@/features/requisitions/types/requisition.types'
import {
  REQUISITION_TYPES,
  formatKes,
  requisitionStatusLabel,
  requisitionTypeLabel,
  statusBadgeVariant,
} from '@/features/requisitions/types/requisition.types'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { useStoreItems, useStoreLocations, useStoreUnits } from '@/features/store/hooks/useStore'
import { useSupplierList } from '@/features/suppliers/hooks/useSuppliers'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDate, formatPersonName } from '@/lib/format'

const PAGE_SIZE = 10
const TABS = ['all', 'mine', 'cost-centers'] as const
type PageTab = (typeof TABS)[number]
const STATUS_FILTERS = ['all', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'RECEIVED', 'REJECTED'] as const

function tabFromParam(value: string | null): PageTab {
  return TABS.includes(value as PageTab) ? (value as PageTab) : 'all'
}

function creatorName(row: Requisition): string {
  return row.createdBy ? formatPersonName(row.createdBy) : '—'
}

function isStaffProfileMissing(error: unknown): boolean {
  return isApiError(error) && error.kind === 'business' && /staff record not found/i.test(error.message)
}

export function RequisitionsPage(): ReactNode {
  useDocumentTitle('Requisitions')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = tabFromParam(params.get('tab'))
  const canCreate = can(user?.role, 'requisition:create')
  const canSettings = can(user?.role, 'requisition:settings')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Requisitions"
        description="Submit store transfers, purchases, and expenses. Review, approve, and confirm receipt from the same record."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="mine">Mine</TabsTrigger>
          <TabsTrigger value="cost-centers">Cost centers</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <AllPanel canCreate={canCreate} />
        </TabsContent>
        <TabsContent value="mine">
          <MinePanel canCreate={canCreate} enabled={tab === 'mine'} />
        </TabsContent>
        <TabsContent value="cost-centers">
          <CostCentersPanel canWrite={canSettings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AllPanel({ canCreate }: { canCreate: boolean }): ReactNode {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [type, setType] = useState('')
  const [campusId, setCampusId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [costCenterId, setCostCenterId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const query = useMemo<RequisitionQuery>(() => {
    const next: RequisitionQuery = {}
    if (status !== 'all') next.status = status
    if (type) next.type = type as RequisitionType
    if (Number(campusId)) next.campusId = Number(campusId)
    if (Number(departmentId)) next.departmentId = Number(departmentId)
    if (Number(costCenterId)) next.costCenterId = Number(costCenterId)
    if (Number(staffId)) next.staffId = Number(staffId)
    if (startDate) next.startDate = startDate
    if (endDate) next.endDate = endDate
    return next
  }, [campusId, costCenterId, departmentId, endDate, staffId, startDate, status, type])

  const list = useRequisitionList(query)
  const campuses = useCampuses()
  const departments = useDepartments()
  const costCenters = useCostCenters()
  const staff = useStaffList()

  return (
    <RequisitionTable
      list={list}
      canCreate={canCreate}
      readUrlId
      extraFilters={
        <>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((value) => (
              <FilterChip
                key={value}
                label={value === 'all' ? 'All statuses' : requisitionStatusLabel(value)}
                active={status === value}
                onClick={() => setStatus(value)}
              />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <SelectField
              label="Type"
              value={type}
              onChange={setType}
              options={REQUISITION_TYPES.map((value) => ({
                value,
                label: requisitionTypeLabel(value),
              }))}
              placeholder="All types"
            />
            <SelectField
              label="Campus"
              value={campusId}
              onChange={setCampusId}
              options={(campuses.data ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
              placeholder="All campuses"
            />
            <SelectField
              label="Department"
              value={departmentId}
              onChange={setDepartmentId}
              options={(departments.data ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
              placeholder="All departments"
            />
            <SelectField
              label="Cost center"
              value={costCenterId}
              onChange={setCostCenterId}
              options={(costCenters.data ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
              placeholder="All cost centers"
            />
            <SelectField
              label="Requested by"
              value={staffId}
              onChange={setStaffId}
              options={(staff.data ?? []).map((row) => ({
                value: String(row.id),
                label: formatPersonName(row),
              }))}
              placeholder="All staff"
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="From" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <TextField label="To" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
        </>
      }
    />
  )
}

function MinePanel({ canCreate, enabled }: { canCreate: boolean; enabled: boolean }): ReactNode {
  const list = useMyRequisitions(enabled)
  return (
    <RequisitionTable
      list={list}
      canCreate={canCreate}
      emptyTitle="No requisitions yet"
      emptyDescription="Requisitions you submit will appear here."
    />
  )
}

function CostCentersPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useCostCenters()
  const { createCostCenter, updateCostCenter, deleteCostCenter } = useRequisitionMutations()

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <NamedLookupManager
      title="Cost centers"
      description="Budget categories used when submitting requisitions. Writes require an Authorization header; the controller does not check roles."
      emptyTitle="No cost centers"
      emptyDescription="Add a cost center before tagging requisitions."
      addLabel="Add cost center"
      items={list.data}
      isLoading={list.isLoading}
      isError={false}
      errorMessage=""
      onRetry={() => void list.refetch()}
      canWrite={canWrite}
      canUpdate={canWrite}
      canDelete={canWrite}
      isSaving={createCostCenter.isPending || updateCostCenter.isPending}
      isDeleting={deleteCostCenter.isPending}
      onCreate={(name) => createCostCenter.mutate({ name })}
      onUpdate={(id, name) => updateCostCenter.mutate({ id, name })}
      onDelete={(id) => deleteCostCenter.mutate(id)}
    />
  )
}

function RequisitionTable({
  list,
  canCreate,
  extraFilters,
  emptyTitle = 'No requisitions',
  emptyDescription = 'Submitted requisitions will appear here.',
  readUrlId = false,
}: {
  list: { data: Requisition[] | undefined; isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown }
  canCreate: boolean
  extraFilters?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  readUrlId?: boolean
}): ReactNode {
  const { user } = useAuth()
  const canReview = can(user?.role, 'requisition:review')
  const canApprove = can(user?.role, 'requisition:approve')
  const canReceive = can(user?.role, 'requisition:receive')
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowKind | null>(null)
  const [pendingReceive, setPendingReceive] = useState(false)

  const campuses = useCampuses()
  const departments = useDepartments()
  const costCenters = useCostCenters()
  const stores = useStoreLocations()
  const items = useStoreItems()
  const units = useStoreUnits()
  const suppliers = useSupplierList()
  const mutations = useRequisitionMutations()
  const detail = useRequisition(selectedId)

  useEffect(() => {
    if (!readUrlId) return
    const fromUrl = Number(params.get('id'))
    if (Number.isFinite(fromUrl) && fromUrl > 0) setSelectedId(fromUrl)
  }, [params, readUrlId])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((row) => {
      if (!needle) return true
      return [
        row.requisitionNumber,
        row.purpose,
        row.status,
        requisitionTypeLabel(row.type),
        row.campus?.name,
        row.department?.name,
        row.costCenter?.name,
        creatorName(row),
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [list.data, query])

  useEffect(() => {
    setPage(1)
  }, [query, list.data])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selected = detail.data ?? (list.data ?? []).find((row) => row.id === selectedId) ?? null
  const staffMissing = isStaffProfileMissing(list.error)

  const columns: Array<DataColumn<Requisition>> = [
    {
      id: 'number',
      header: 'Number',
      cell: (row) => (
        <span>
          <span className="block font-medium">{displayValue(row.requisitionNumber)}</span>
          <span className="type-caption text-muted-foreground">{formatDate(row.requisitionDate)}</span>
        </span>
      ),
    },
    { id: 'type', header: 'Type', hideOnMobile: true, cell: (row) => requisitionTypeLabel(row.type) },
    { id: 'center', header: 'Cost center', hideOnMobile: true, cell: (row) => displayValue(row.costCenter?.name) },
    { id: 'by', header: 'Requested by', hideOnMobile: true, cell: (row) => creatorName(row) },
    { id: 'amount', header: 'Estimated', cell: (row) => formatKes(row.totalEstimatedAmount) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={statusBadgeVariant(row.status)}>{requisitionStatusLabel(row.status)}</Badge>,
    },
  ]

  const closeDetail = () => {
    setSelectedId(null)
    setWorkflow(null)
    setPendingReceive(false)
    if (params.get('id') && readUrlId) {
      const next = new URLSearchParams(params)
      next.delete('id')
      setParams(next, { replace: true })
    }
  }

  const runWorkflow = (body: WorkflowActionPayload) => {
    if (!selected) return
    if (workflow === 'review') mutations.review.mutate({ id: selected.id, body }, { onSuccess: () => setWorkflow(null) })
    if (workflow === 'approve') mutations.approve.mutate({ id: selected.id, body }, { onSuccess: () => setWorkflow(null) })
    if (workflow === 'reject') mutations.reject.mutate({ id: selected.id, body }, { onSuccess: () => setWorkflow(null) })
  }

  if (list.isError && !staffMissing) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  const noRows = !list.isLoading && (staffMissing || (list.data?.length ?? 0) === 0)
  const noMatches = !list.isLoading && filtered.length === 0 && (list.data?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search number, purpose, or requester" />
        {canCreate && !staffMissing ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />
            New requisition
          </Button>
        ) : null}
      </div>
      {extraFilters}
      {noRows ? (
        <EmptyState
          title={
            staffMissing
              ? 'No staff profile for this login'
              : emptyTitle
          }
          description={
            staffMissing
              ? 'Mine only lists requisitions created by the staff row whose work email matches your username. This account has no matching staff record, so the backend cannot load that list.'
              : emptyDescription
          }
        />
      ) : noMatches ? (
        <EmptyState title="No matching requisitions" description="Try a different search or filter." />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
          onRowClick={(row) => setSelectedId(row.id)}
          rowAriaLabel={(row) => `Open ${row.requisitionNumber ?? `requisition ${row.id}`}`}
          mobileCard={(row) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="type-heading truncate">{displayValue(row.requisitionNumber)}</p>
                  <p className="type-caption text-muted-foreground">
                    {formatDate(row.requisitionDate)} · {requisitionTypeLabel(row.type)}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(row.status)}>{requisitionStatusLabel(row.status)}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                <div>
                  <dt>Cost center</dt>
                  <dd className="font-medium text-foreground">{displayValue(row.costCenter?.name)}</dd>
                </div>
                <div>
                  <dt>Estimated</dt>
                  <dd className="font-medium text-foreground">{formatKes(row.totalEstimatedAmount)}</dd>
                </div>
                <div className="col-span-2">
                  <dt>Requested by</dt>
                  <dd className="font-medium text-foreground">{creatorName(row)}</dd>
                </div>
                {row.purpose ? (
                  <div className="col-span-2">
                    <dt>Purpose</dt>
                    <dd className="font-medium text-foreground line-clamp-2">{row.purpose}</dd>
                  </div>
                ) : null}
                {row.status === 'REJECTED' && row.rejectionReason ? (
                  <div className="col-span-2">
                    <dt>Rejected</dt>
                    <dd className="font-medium text-destructive">{row.rejectionReason}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          )}
        />
      )}
      <RequisitionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isSaving={mutations.create.isPending}
        campuses={campuses.data ?? []}
        departments={departments.data ?? []}
        costCenters={costCenters.data ?? []}
        stores={stores.data ?? []}
        items={items.data ?? []}
        units={units.data ?? []}
        suppliers={suppliers.data ?? []}
        onSubmit={(body: CreateRequisitionPayload) =>
          mutations.create.mutate(body, {
            onSuccess: (saved) => {
              setCreateOpen(false)
              setSelectedId(saved.id)
            },
          })
        }
      />
      <RequisitionDetailDialog
        requisition={selected}
        canReview={canReview}
        canApprove={canApprove}
        canReceive={canReceive}
        onOpenChange={(open) => {
          if (!open) closeDetail()
        }}
        onReview={() => setWorkflow('review')}
        onApprove={() => setWorkflow('approve')}
        onReceive={() => setPendingReceive(true)}
        onReject={() => setWorkflow('reject')}
      />
      <WorkflowActionDialog
        kind={workflow}
        requisition={selected}
        isSaving={mutations.review.isPending || mutations.approve.isPending || mutations.reject.isPending}
        onOpenChange={(open) => {
          if (!open) setWorkflow(null)
        }}
        onSubmit={runWorkflow}
      />
      <ConfirmDialog
        open={pendingReceive}
        onOpenChange={setPendingReceive}
        title="Confirm receipt"
        description={
          selected
            ? `Mark ${selected.requisitionNumber ?? 'this requisition'} as fulfilled or received. Only approved requisitions can be received.`
            : 'Mark this requisition as received.'
        }
        confirmLabel="Confirm receipt"
        confirmVariant="primary"
        loadingLabel="Saving"
        isConfirming={mutations.receive.isPending}
        onConfirm={() => {
          if (!selected) return
          mutations.receive.mutate(selected.id, { onSuccess: () => setPendingReceive(false) })
        }}
      />
    </div>
  )
}
