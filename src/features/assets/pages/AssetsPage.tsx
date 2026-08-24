import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { FilterChip, SearchField } from '@/components/data/FilterBar'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { TextField } from '@/components/forms/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssetFormDialog } from '@/features/assets/components/AssetFormDialog'
import { useAssetCategoryList, useAssetList, useAssetMutations } from '@/features/assets/hooks/useAssets'
import type { Asset, AssetCategory, AssetWritePayload } from '@/features/assets/types/asset.types'
import { formatAssetMoney } from '@/features/assets/types/asset.types'
import { useCampuses, useDepartments } from '@/features/lookups/useLookups'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatPersonName } from '@/lib/format'

const PAGE_SIZE = 10

export function AssetsPage(): ReactNode {
  useDocumentTitle('Asset Management')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'asset:write')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'categories' ? 'categories' : 'inventory'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asset Management"
        description="School inventory — equipment, vehicles, furniture, and other physical property."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <InventoryPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesPanel canWrite={canWrite} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InventoryPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useAssetList()
  const categories = useAssetCategoryList()
  const campuses = useCampuses()
  const departments = useDepartments()
  const staff = useStaffList()
  const { createAsset, updateAsset, deleteAsset } = useAssetMutations()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Asset | null>(null)

  const statuses = useMemo(() => {
    const values = new Set<string>()
    for (const item of list.data ?? []) {
      if (item.status?.trim()) values.add(item.status.trim())
    }
    return ['all', ...Array.from(values).sort()]
  }, [list.data])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((item) => {
      if (status !== 'all' && (item.status ?? '').trim() !== status) return false
      if (!needle) return true
      const haystack = [
        item.assetTagId,
        item.description,
        item.brand,
        item.model,
        item.serialNumber,
        item.category?.name,
        item.campus?.name,
        item.department?.name,
        item.assignedTo ? formatPersonName(item.assignedTo) : '',
        item.assetCondition,
        item.status,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [list.data, query, status])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (item: Asset) => {
    setEditing(item)
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
      header: 'Tag',
      cell: (row) => <span className="font-medium">{row.assetTagId}</span>,
    },
    {
      id: 'item',
      header: 'Item',
      cell: (row) => (
        <span>
          <span className="block">{displayValue(row.description)}</span>
          <span className="type-caption text-muted-foreground">
            {[row.brand, row.model].filter(Boolean).join(' · ') || '—'}
          </span>
        </span>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: (row) => displayValue(row.category?.name),
    },
    {
      id: 'campus',
      header: 'Campus',
      cell: (row) => displayValue(row.campus?.name),
    },
    {
      id: 'condition',
      header: 'Condition',
      cell: (row) => displayValue(row.assetCondition),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (row.status ? <Badge variant="neutral">{row.status}</Badge> : '—'),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (row) =>
        canWrite ? (
          <span className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" aria-label={`Edit ${row.assetTagId}`} onClick={() => openEdit(row)}>
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${row.assetTagId}`}
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          placeholder="Search assets…"
        />
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((value) => (
            <FilterChip
              key={value}
              label={value === 'all' ? 'All' : value}
              active={status === value}
              onClick={() => {
                setStatus(value)
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
          description="Register equipment, vehicles, or furniture with a unique tag ID."
          {...(canWrite ? { actionLabel: 'Register asset', onAction: openCreate } : {})}
        />
      ) : noMatches ? (
        <EmptyState title="No matching assets" description="Try a different search or status filter." />
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
                  <p className="type-heading truncate">{row.assetTagId}</p>
                  <p className="type-caption text-muted-foreground">{displayValue(row.description)}</p>
                </div>
                {row.status ? <Badge variant="neutral">{row.status}</Badge> : null}
              </div>
              <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
                <div>
                  <dt>Category</dt>
                  <dd className="font-medium text-foreground">{displayValue(row.category?.name)}</dd>
                </div>
                <div>
                  <dt>Condition</dt>
                  <dd className="font-medium text-foreground">{displayValue(row.assetCondition)}</dd>
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
        categories={categories.data ?? []}
        campuses={campuses.data ?? []}
        departments={departments.data ?? []}
        staff={staff.data ?? []}
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
            ? `This will permanently remove ${pendingDelete.assetTagId}${pendingDelete.description ? ` (${pendingDelete.description})` : ''}.`
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

function CategoriesPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useAssetCategoryList()
  const { createCategory } = useAssetMutations()
  const [name, setName] = useState('')
  const [page, setPage] = useState(1)

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    createCategory.mutate(
      { name: trimmed },
      {
        onSuccess: () => setName(''),
      },
    )
  }

  const columns: Array<DataColumn<AssetCategory>> = [
    { id: 'name', header: 'Category', cell: (row) => row.name },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-caption text-muted-foreground">
        Categories can be listed and added. The backend does not expose update or delete for them.
      </p>
      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle className="type-section-title">Add category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <TextField
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Lab Equipment"
                containerClassName="flex-1"
                required
              />
              <Button type="submit" isLoading={createCategory.isPending} loadingLabel="Adding">
                <Plus aria-hidden="true" />
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {rows.length === 0 && !list.isLoading ? (
        <EmptyState
          title="No categories yet"
          description="Add a category such as ICT, Vehicles, or Furniture before registering assets."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
          mobileCard={(row) => <p className="type-heading">{row.name}</p>}
        />
      )}
    </div>
  )
}
