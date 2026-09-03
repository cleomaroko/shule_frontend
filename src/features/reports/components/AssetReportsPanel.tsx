import { useMemo, useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextField } from '@/components/forms/TextField'
import { useAssetList, useAssetLookups, useAssetSearch } from '@/features/assets/hooks/useAssets'
import {
  assetDescriptionLabel,
  formatAssetMoney,
  type Asset,
  type AssetSearchParams,
} from '@/features/assets/types/asset.types'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy } from '@/features/reports/lib/summaries'
import { useCampuses, useDepartments } from '@/features/lookups/useLookups'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { displayValue, formatDate, formatPersonName } from '@/lib/format'

const PAGE_SIZE = 12

export function AssetReportsPanel(): ReactNode {
  const list = useAssetList()
  const lookups = useAssetLookups()
  const campuses = useCampuses()
  const departments = useDepartments()
  const staff = useStaffList()
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [descriptionId, setDescriptionId] = useState('')
  const [campusId, setCampusId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [conditionId, setConditionId] = useState('')
  const [statusId, setStatusId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [page, setPage] = useState(1)

  const searchParams = useMemo<AssetSearchParams>(
    () => ({
      ...(brand.trim() ? { brand: brand.trim() } : {}),
      ...(model.trim() ? { model: model.trim() } : {}),
      ...(serialNumber.trim() ? { serialNumber: serialNumber.trim() } : {}),
      ...(Number(categoryId) ? { categoryId: Number(categoryId) } : {}),
      ...(Number(descriptionId) ? { descriptionId: Number(descriptionId) } : {}),
      ...(Number(campusId) ? { campusId: Number(campusId) } : {}),
      ...(Number(departmentId) ? { departmentId: Number(departmentId) } : {}),
      ...(Number(conditionId) ? { conditionId: Number(conditionId) } : {}),
      ...(Number(statusId) ? { statusId: Number(statusId) } : {}),
      ...(Number(staffId) ? { staffId: Number(staffId) } : {}),
      ...(purchaseDate ? { purchaseDate } : {}),
    }),
    [brand, campusId, categoryId, conditionId, departmentId, descriptionId, model, purchaseDate, serialNumber, staffId, statusId],
  )

  const search = useAssetSearch(searchParams)
  const inventory = list.data ?? []
  const results = search.data ?? []
  const paged = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<Asset>> = [
    { id: 'tag', header: 'Tag', cell: (row) => displayValue(row.assetTagId) },
    { id: 'item', header: 'Item', cell: (row) => assetDescriptionLabel(row) },
    { id: 'category', header: 'Category', cell: (row) => displayValue(row.category?.name) },
    { id: 'campus', header: 'Campus', cell: (row) => displayValue(row.campus?.name) },
    { id: 'status', header: 'Status', cell: (row) => displayValue(row.status?.name) },
    { id: 'cost', header: 'Cost', cell: (row) => formatAssetMoney(row.costPrice) },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Inventory mix"
        note="Counts come from GET /api/assets. Use the filters below to call GET /api/assets/search."
      >
        <StatGrid
          items={[
            { label: 'Assets', value: inventory.length.toLocaleString(), hint: 'Registered inventory' },
            {
              label: 'Search matches',
              value: results.length.toLocaleString(),
              hint: 'Current GET /api/assets/search result',
            },
          ]}
          loading={list.isLoading}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="By campus"
            rows={countBy(inventory, (row) => row.campus?.name)}
            empty="No assets yet."
            loading={list.isLoading}
          />
          <BreakdownCard
            title="By category"
            rows={countBy(inventory, (row) => row.category?.name)}
            empty="No assets yet."
            loading={list.isLoading}
          />
          <BreakdownCard
            title="By status"
            rows={countBy(inventory, (row) => row.status?.name)}
            empty="No assets yet."
            loading={list.isLoading}
          />
          <BreakdownCard
            title="By condition"
            rows={countBy(inventory, (row) => row.assetCondition?.name)}
            empty="No assets yet."
            loading={list.isLoading}
          />
        </div>
      </ReportSection>

      <ReportSection title="Filtered search">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <TextField
            label="Brand"
            value={brand}
            onChange={(event) => {
              setBrand(event.target.value)
              setPage(1)
            }}
          />
          <TextField
            label="Model"
            value={model}
            onChange={(event) => {
              setModel(event.target.value)
              setPage(1)
            }}
          />
          <TextField
            label="Serial number"
            value={serialNumber}
            onChange={(event) => {
              setSerialNumber(event.target.value)
              setPage(1)
            }}
          />
          <SelectField
            label="Category"
            value={categoryId}
            onChange={(value) => {
              setCategoryId(value)
              setPage(1)
            }}
            options={(lookups.data?.categories ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
          />
          <SelectField
            label="Description"
            value={descriptionId}
            onChange={(value) => {
              setDescriptionId(value)
              setPage(1)
            }}
            options={(lookups.data?.descriptions ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
          />
          <SelectField
            label="Campus"
            value={campusId}
            onChange={(value) => {
              setCampusId(value)
              setPage(1)
            }}
            options={(campuses.data ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
          />
          <SelectField
            label="Department"
            value={departmentId}
            onChange={(value) => {
              setDepartmentId(value)
              setPage(1)
            }}
            options={(departments.data ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
          />
          <SelectField
            label="Condition"
            value={conditionId}
            onChange={(value) => {
              setConditionId(value)
              setPage(1)
            }}
            options={(lookups.data?.conditions ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
          />
          <SelectField
            label="Status"
            value={statusId}
            onChange={(value) => {
              setStatusId(value)
              setPage(1)
            }}
            options={(lookups.data?.statuses ?? []).map((row) => ({ value: String(row.id), label: row.name }))}
          />
          <SelectField
            label="Assigned staff"
            value={staffId}
            onChange={(value) => {
              setStaffId(value)
              setPage(1)
            }}
            options={(staff.data ?? []).map((row) => ({
              value: String(row.id),
              label: formatPersonName(row),
            }))}
          />
          <TextField
            label="Purchase date"
            type="date"
            value={purchaseDate}
            onChange={(event) => {
              setPurchaseDate(event.target.value)
              setPage(1)
            }}
            hint="Exact purchase date match on the search endpoint."
          />
        </div>
        {search.isError ? (
          <ErrorState message={toUserMessage(search.error)} onRetry={() => void search.refetch()} />
        ) : results.length === 0 && !search.isLoading ? (
          <EmptyState title="No matching assets" description="Clear a filter or register an asset first." />
        ) : (
          <DataTable
            columns={columns}
            rows={paged}
            getRowId={(row) => row.id}
            isLoading={search.isLoading}
            page={page}
            pageSize={PAGE_SIZE}
            total={results.length}
            onPageChange={setPage}
            mobileCard={(row) => (
              <div>
                <p className="type-heading">{assetDescriptionLabel(row)}</p>
                <p className="type-caption text-muted-foreground">
                  {displayValue(row.assetTagId)} · {formatDate(row.purchaseDate)}
                </p>
              </div>
            )}
          />
        )}
      </ReportSection>
    </div>
  )
}
