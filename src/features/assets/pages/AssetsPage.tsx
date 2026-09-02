import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssetFormDialog } from '@/features/assets/components/AssetFormDialog'
import {
  useAssetCategoryList,
  useAssetConditionList,
  useAssetDescriptionList,
  useAssetList,
  useAssetLookups,
  useAssetMutations,
  useAssetStatusList,
} from '@/features/assets/hooks/useAssets'
import type { Asset, AssetWritePayload } from '@/features/assets/types/asset.types'
import { assetDescriptionLabel, formatAssetMoney } from '@/features/assets/types/asset.types'
import { useCampuses, useDepartments } from '@/features/lookups/useLookups'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { useSupplierList } from '@/features/suppliers/hooks/useSuppliers'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatPersonName } from '@/lib/format'

const PAGE_SIZE = 10
const LOOKUP_TABS = ['categories', 'descriptions', 'conditions', 'statuses'] as const

export function AssetsPage(): ReactNode {
  useDocumentTitle('Asset Management')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'asset:write')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'lookups' ? 'lookups' : 'inventory'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asset Management"
        description="Physical property with structured descriptions, conditions, statuses, and supplier snapshots."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="lookups">Lookups</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <InventoryPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="lookups">
          <LookupsPanel canWrite={canWrite} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InventoryPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useAssetList()
  const lookups = useAssetLookups()
  const campuses = useCampuses()
  const departments = useDepartments()
  const staff = useStaffList()
  const suppliers = useSupplierList()
  const { createAsset, updateAsset, deleteAsset } = useAssetMutations()

  const [query, setQuery] = useState('')
  const [statusId, setStatusId] = useState('all')
  const [categoryId, setCategoryId] = useState('')
  const [campusId, setCampusId] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Asset | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((item) => {
      if (statusId !== 'all' && String(item.status?.id ?? '') !== statusId) return false
      if (categoryId && String(item.category?.id ?? '') !== categoryId) return false
      if (campusId && String(item.campus?.id ?? '') !== campusId) return false
      if (!needle) return true
      return [
        item.assetTagId,
        item.description?.name,
        item.brand,
        item.model,
        item.serialNumber,
        item.category?.name,
        item.campus?.name,
        item.department?.name,
        item.assignedTo ? formatPersonName(item.assignedTo) : '',
        item.supplierName,
        item.status?.name,
        item.assetCondition?.name,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [campusId, categoryId, list.data, query, statusId])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const handleSubmit = (body: AssetWritePayload) => {
    if (editing) {
      updateAsset.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) })
      return
    }
    createAsset.mutate(body, { onSuccess: () => setOpen(false) })
  }

  const columns: Array<DataColumn<Asset>> = [
    {
      id: 'tag',
      header: 'Asset',
      cell: (row) => (
        <span>
          <span className="block font-medium">{displayValue(row.assetTagId)}</span>
          <span className="type-caption text-muted-foreground">{assetDescriptionLabel(row)}</span>
        </span>
      ),
    },
    { id: 'category', header: 'Category', cell: (row) => displayValue(row.category?.name) },
    { id: 'campus', header: 'Campus', cell: (row) => displayValue(row.campus?.name) },
    {
      id: 'assigned',
      header: 'Assigned to',
      hideOnMobile: true,
      cell: (row) => (row.assignedTo ? formatPersonName(row.assignedTo) : '—'),
    },
    { id: 'condition', header: 'Condition', hideOnMobile: true, cell: (row) => displayValue(row.assetCondition?.name) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (row.status?.name ? <Badge variant="neutral">{row.status.name}</Badge> : '—'),
    },
    { id: 'value', header: 'Value', hideOnMobile: true, cell: (row) => formatAssetMoney(row.costPrice) },
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
              aria-label={`Edit ${row.assetTagId ?? 'asset'}`}
              onClick={() => {
                setEditing(row)
                setOpen(true)
              }}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${row.assetTagId ?? 'asset'}`}
              onClick={() => setPendingDelete(row)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </span>
        ) : null,
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  const isEmpty = !list.isLoading && (list.data?.length ?? 0) === 0
  const noMatches = !list.isLoading && !isEmpty && filtered.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          placeholder="Search tag, brand, serial, assignee…"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField
            label="Category"
            value={categoryId}
            onChange={(value) => {
              setCategoryId(value)
              setPage(1)
            }}
            options={(lookups.data?.categories ?? []).map((item) => ({
              value: String(item.id),
              label: item.name,
            }))}
            placeholder="All categories"
            emptyLabel="All categories"
          />
          <SelectField
            label="Campus"
            value={campusId}
            onChange={(value) => {
              setCampusId(value)
              setPage(1)
            }}
            options={(campuses.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
            placeholder="All campuses"
            emptyLabel="All campuses"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="All statuses"
            active={statusId === 'all'}
            onClick={() => {
              setStatusId('all')
              setPage(1)
            }}
          />
          {(lookups.data?.statuses ?? []).map((item) => (
            <FilterChip
              key={item.id}
              label={item.name}
              active={statusId === String(item.id)}
              onClick={() => {
                setStatusId(String(item.id))
                setPage(1)
              }}
            />
          ))}
          {canWrite ? (
            <Button className="ms-auto sm:ms-2" onClick={openCreate}>
              <Plus aria-hidden="true" />
              Register asset
            </Button>
          ) : null}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          title="No assets yet"
          description="Register equipment with a description and category from the lookups tab."
          {...(canWrite ? { actionLabel: 'Register asset', onAction: openCreate } : {})}
        />
      ) : noMatches ? (
        <EmptyState title="No matching assets" description="Try a different search or filter." />
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
          mobileCard={(row) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="type-heading truncate">{displayValue(row.assetTagId)}</p>
                  <p className="type-caption text-muted-foreground">{assetDescriptionLabel(row)}</p>
                </div>
                {row.status?.name ? <Badge variant="neutral">{row.status.name}</Badge> : null}
              </div>
              <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                <div>
                  <dt>Category</dt>
                  <dd className="font-medium text-foreground">{displayValue(row.category?.name)}</dd>
                </div>
                <div>
                  <dt>Condition</dt>
                  <dd className="font-medium text-foreground">{displayValue(row.assetCondition?.name)}</dd>
                </div>
                <div>
                  <dt>Campus</dt>
                  <dd className="font-medium text-foreground">{displayValue(row.campus?.name)}</dd>
                </div>
                <div>
                  <dt>Value</dt>
                  <dd className="font-medium text-foreground">{formatAssetMoney(row.costPrice)}</dd>
                </div>
              </dl>
            </div>
          )}
        />
      )}

      <AssetFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        categories={lookups.data?.categories ?? []}
        descriptions={lookups.data?.descriptions ?? []}
        conditions={lookups.data?.conditions ?? []}
        statuses={lookups.data?.statuses ?? []}
        campuses={campuses.data ?? []}
        departments={departments.data ?? []}
        staff={staff.data ?? []}
        suppliers={suppliers.data ?? []}
        isSaving={createAsset.isPending || updateAsset.isPending}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
        title="Delete asset?"
        description={
          pendingDelete
            ? `This will permanently remove ${pendingDelete.assetTagId ?? `asset ${pendingDelete.id}`}${pendingDelete.description?.name ? ` (${pendingDelete.description.name})` : ''}.`
            : ''
        }
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isConfirming={deleteAsset.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteAsset.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function LookupsPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const [params, setParams] = useSearchParams()
  const requested = params.get('lookup')
  const lookup = LOOKUP_TABS.includes(requested as (typeof LOOKUP_TABS)[number])
    ? (requested as (typeof LOOKUP_TABS)[number])
    : 'categories'

  const categories = useAssetCategoryList()
  const descriptions = useAssetDescriptionList()
  const conditions = useAssetConditionList()
  const statuses = useAssetStatusList()
  const mutations = useAssetMutations()

  const setLookup = (value: string) => {
    setParams({ tab: 'lookups', lookup: value }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        These lists feed the register-asset form. Add them here before recording inventory.
      </p>
      <Tabs value={lookup} onValueChange={setLookup}>
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="descriptions">Descriptions</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <NamedLookupManager
            title="Category"
            description="Groups such as ICT, Furniture, or Vehicles."
            emptyTitle="No categories yet"
            emptyDescription="Add a category before registering assets."
            items={categories.data}
            isLoading={categories.isLoading}
            isError={categories.isError}
            errorMessage={toUserMessage(categories.error)}
            onRetry={() => void categories.refetch()}
            canWrite={canWrite}
            canUpdate
            canDelete
            isSaving={mutations.createCategory.isPending || mutations.updateCategory.isPending}
            isDeleting={mutations.deleteCategory.isPending}
            onCreate={(name) => mutations.createCategory.mutate({ name })}
            onUpdate={(id, name) => mutations.updateCategory.mutate({ id, name })}
            onDelete={(id) => mutations.deleteCategory.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="descriptions">
          <NamedLookupManager
            title="Description"
            description="What the item is, for example Laptop or Projector."
            emptyTitle="No descriptions yet"
            emptyDescription="Add descriptions used on the register form."
            items={descriptions.data}
            isLoading={descriptions.isLoading}
            isError={descriptions.isError}
            errorMessage={toUserMessage(descriptions.error)}
            onRetry={() => void descriptions.refetch()}
            canWrite={canWrite}
            canUpdate
            canDelete
            isSaving={mutations.createDescription.isPending || mutations.updateDescription.isPending}
            isDeleting={mutations.deleteDescription.isPending}
            onCreate={(name) => mutations.createDescription.mutate({ name })}
            onUpdate={(id, name) => mutations.updateDescription.mutate({ id, name })}
            onDelete={(id) => mutations.deleteDescription.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="conditions">
          <NamedLookupManager
            title="Condition"
            description="Physical state, for example New or Needs repair."
            emptyTitle="No conditions yet"
            emptyDescription="Add condition values used on assets."
            items={conditions.data}
            isLoading={conditions.isLoading}
            isError={conditions.isError}
            errorMessage={toUserMessage(conditions.error)}
            onRetry={() => void conditions.refetch()}
            canWrite={canWrite}
            canUpdate
            canDelete
            isSaving={mutations.createCondition.isPending || mutations.updateCondition.isPending}
            isDeleting={mutations.deleteCondition.isPending}
            onCreate={(name) => mutations.createCondition.mutate({ name })}
            onUpdate={(id, name) => mutations.updateCondition.mutate({ id, name })}
            onDelete={(id) => mutations.deleteCondition.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="statuses">
          <NamedLookupManager
            title="Status"
            description="Operational status, for example In use or Disposed."
            emptyTitle="No statuses yet"
            emptyDescription="Add status values used on assets."
            items={statuses.data}
            isLoading={statuses.isLoading}
            isError={statuses.isError}
            errorMessage={toUserMessage(statuses.error)}
            onRetry={() => void statuses.refetch()}
            canWrite={canWrite}
            canUpdate
            canDelete
            isSaving={mutations.createStatus.isPending || mutations.updateStatus.isPending}
            isDeleting={mutations.deleteStatus.isPending}
            onCreate={(name) => mutations.createStatus.mutate({ name })}
            onUpdate={(id, name) => mutations.updateStatus.mutate({ id, name })}
            onDelete={(id) => mutations.deleteStatus.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
