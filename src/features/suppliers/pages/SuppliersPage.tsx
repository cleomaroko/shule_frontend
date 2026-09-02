import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { NamedLookupManager } from '@/components/data/NamedLookupManager'
import { SearchField } from '@/components/data/FilterBar'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { SwitchField } from '@/components/forms/SwitchField'
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
import { useBanks } from '@/features/lookups/useLookups'
import {
  useSupplierContractList,
  useSupplierList,
  useSupplierMutations,
  useSupplierTypeList,
} from '@/features/suppliers/hooks/useSuppliers'
import type {
  Supplier,
  SupplierContract,
  SupplierContractWritePayload,
  SupplierWritePayload,
} from '@/features/suppliers/types/supplier.types'
import {
  CONTRACT_STATUSES,
  contractIsExpired,
  supplierIsActive,
} from '@/features/suppliers/types/supplier.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDate } from '@/lib/format'

const PAGE_SIZE = 10

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function SuppliersPage(): ReactNode {
  useDocumentTitle('Suppliers')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'supplier:write')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'types' ? 'types' : 'directory'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Suppliers"
        description="Approved vendors and contract expiry tracking. Supplier names on assets are historical snapshots."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="types">Business types</TabsTrigger>
        </TabsList>
        <TabsContent value="directory">
          <DirectoryPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="types">
          <TypesPanel canWrite={canWrite} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DirectoryPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useSupplierList()
  const types = useSupplierTypeList()
  const banks = useBanks()
  const { createSupplier, updateSupplier } = useSupplierMutations()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [contractsFor, setContractsFor] = useState<Supplier | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((item) => {
      if (!needle) return true
      return [item.name, item.supplierCode, item.businessType?.name, item.phoneNumber, item.emailAddress]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [list.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<Supplier>> = [
    {
      id: 'name',
      header: 'Supplier',
      cell: (row) => (
        <span>
          <span className="block font-medium">{row.name}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.supplierCode)}</span>
        </span>
      ),
    },
    { id: 'type', header: 'Type', cell: (row) => displayValue(row.businessType?.name) },
    { id: 'phone', header: 'Phone', hideOnMobile: true, cell: (row) => displayValue(row.phoneNumber) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) =>
        supplierIsActive(row) ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>,
    },
    {
      id: 'actions',
      header: '',
      className: 'w-40 text-right',
      cell: (row) => (
        <span className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setContractsFor(row)}>
            Contracts
          </Button>
          {canWrite ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(row)
                setOpen(true)
              }}
            >
              Edit
            </Button>
          ) : null}
        </span>
      ),
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          placeholder="Search suppliers…"
        />
        {canWrite ? (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus aria-hidden="true" />
            Add supplier
          </Button>
        ) : null}
      </div>
      {(list.data?.length ?? 0) === 0 && !list.isLoading ? (
        <EmptyState title="No suppliers yet" description="Register a vendor before linking them to assets or store receipts." />
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
            <div>
              <p className="type-heading">{row.name}</p>
              <p className="type-caption text-muted-foreground">
                {[row.supplierCode, row.businessType?.name].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
        />
      )}
      <SupplierDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        types={types.data ?? []}
        banks={banks.data ?? []}
        isSaving={createSupplier.isPending || updateSupplier.isPending}
        onSubmit={(body) => {
          if (editing) {
            updateSupplier.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) })
            return
          }
          createSupplier.mutate(body, { onSuccess: () => setOpen(false) })
        }}
      />
      <ContractsDialog supplier={contractsFor} onOpenChange={(next) => !next && setContractsFor(null)} canWrite={canWrite} />
    </div>
  )
}

function TypesPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useSupplierTypeList()
  const { createType } = useSupplierMutations()
  return (
    <NamedLookupManager
      title="Business type"
      description="Used on the supplier form, for example Electronics or Catering."
      emptyTitle="No business types yet"
      emptyDescription="Add a type before registering suppliers."
      items={list.data}
      isLoading={list.isLoading}
      isError={list.isError}
      errorMessage={toUserMessage(list.error)}
      onRetry={() => void list.refetch()}
      canWrite={canWrite}
      isSaving={createType.isPending}
      onCreate={(name) => createType.mutate({ name })}
    />
  )
}

function SupplierDialog({
  open,
  onOpenChange,
  editing,
  types,
  banks,
  isSaving,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Supplier | null
  types: Array<{ id: number; name: string }>
  banks: Array<{ id: number; name: string }>
  isSaving: boolean
  onSubmit: (body: SupplierWritePayload) => void
}): ReactNode {
  const [name, setName] = useState('')
  const [typeId, setTypeId] = useState('')
  const [physicalAddress, setPhysicalAddress] = useState('')
  const [postalAddress, setPostalAddress] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [bankId, setBankId] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [mpesaNumber, setMpesaNumber] = useState('')
  const [comments, setComments] = useState('')
  const [isActive, setIsActive] = useState(true)

  const reset = (supplier: Supplier | null) => {
    setName(supplier?.name ?? '')
    setTypeId(supplier?.businessType?.id ? String(supplier.businessType.id) : '')
    setPhysicalAddress(supplier?.physicalAddress ?? '')
    setPostalAddress(supplier?.postalAddress ?? '')
    setEmailAddress(supplier?.emailAddress ?? '')
    setPhoneNumber(supplier?.phoneNumber ?? '')
    setBankId(supplier?.bank?.id ? String(supplier.bank.id) : '')
    setBankAccountName(supplier?.bankAccountName ?? '')
    setBankAccountNumber(supplier?.bankAccountNumber ?? '')
    setMpesaNumber(supplier?.mpesaNumber ?? '')
    setComments(supplier?.comments ?? '')
    setIsActive(supplier ? supplierIsActive(supplier) : true)
  }

  useEffect(() => {
    if (!open) return
    reset(editing)
  }, [editing, open])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const body: SupplierWritePayload = {
      name: trimmed,
      physicalAddress: physicalAddress.trim() || null,
      postalAddress: postalAddress.trim() || null,
      emailAddress: emailAddress.trim() || null,
      phoneNumber: phoneNumber.trim() || null,
      bankAccountName: bankAccountName.trim() || null,
      bankAccountNumber: bankAccountNumber.trim() || null,
      mpesaNumber: mpesaNumber.trim() || null,
      comments: comments.trim() || null,
      isActive,
      active: isActive,
    }
    const type = Number(typeId)
    if (type) body.businessType = { id: type }
    const bank = Number(bankId)
    if (bank) body.bank = { id: bank }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-5 pt-6 sm:px-6">
            <DialogTitle>{editing ? 'Edit supplier' : 'Register supplier'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Supplier code cannot be changed.' : 'Leave code blank to auto-generate SUP-{timestamp}.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
            <SelectField
              label="Business type"
              value={typeId}
              onChange={setTypeId}
              options={types.map((item) => ({ value: String(item.id), label: item.name }))}
              placeholder={types.length ? 'Select type' : 'No types available'}
              emptyMessage="No business types available"
              emptyLabel="Not set"
            />
            <TextField label="Phone" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
            <TextField label="Email" type="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} />
            <TextField
              label="Physical address"
              value={physicalAddress}
              onChange={(event) => setPhysicalAddress(event.target.value)}
            />
            <TextField
              label="Postal address"
              value={postalAddress}
              onChange={(event) => setPostalAddress(event.target.value)}
            />
            <SelectField
              label="Bank"
              value={bankId}
              onChange={setBankId}
              options={banks.map((item) => ({ value: String(item.id), label: item.name }))}
              emptyLabel="Not set"
            />
            <TextField
              label="Account name"
              value={bankAccountName}
              onChange={(event) => setBankAccountName(event.target.value)}
            />
            <TextField
              label="Account number"
              value={bankAccountNumber}
              onChange={(event) => setBankAccountNumber(event.target.value)}
            />
            <TextField
              label="M-Pesa number"
              value={mpesaNumber}
              onChange={(event) => setMpesaNumber(event.target.value)}
            />
            <SwitchField label="Active" checked={isActive} onCheckedChange={setIsActive} />
            <TextareaField label="Comments" value={comments} onChange={(event) => setComments(event.target.value)} rows={3} />
          </div>
          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingLabel="Saving">
              {editing ? 'Save supplier' : 'Register'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ContractsDialog({
  supplier,
  onOpenChange,
  canWrite,
}: {
  supplier: Supplier | null
  onOpenChange: (open: boolean) => void
  canWrite: boolean
}): ReactNode {
  const list = useSupplierContractList(supplier?.id ?? null)
  const { createContract, updateContractStatus } = useSupplierMutations()
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const today = todayIso()

  const handleAdd = (event: FormEvent) => {
    event.preventDefault()
    if (!supplier || !description.trim() || !startDate || !endDate) return
    const body: SupplierContractWritePayload = {
      supplier: { id: supplier.id },
      description: description.trim(),
      startDate,
      endDate,
      status: 'ACTIVE',
    }
    createContract.mutate(body, {
      onSuccess: () => {
        setDescription('')
        setStartDate('')
        setEndDate('')
      },
    })
  }

  return (
    <Dialog open={supplier !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle>Contracts · {supplier?.name}</DialogTitle>
          <DialogDescription>Expired end dates are highlighted. Status can be changed with PATCH.</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
          {(list.data ?? []).length === 0 && !list.isLoading ? (
            <p className="type-caption text-muted-foreground">No contracts yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(list.data ?? []).map((contract: SupplierContract) => {
                const expired = contractIsExpired(contract, today)
                return (
                  <li
                    key={contract.id}
                    className={expired ? 'rounded-xl border border-destructive/40 bg-destructive-subtle/40 p-3' : 'rounded-xl border border-border p-3'}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="type-heading">{displayValue(contract.description)}</p>
                        <p className="type-caption text-muted-foreground">
                          {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
                        </p>
                      </div>
                      <Badge variant={expired ? 'destructive' : 'success'}>{expired ? 'Expired' : contract.status ?? 'ACTIVE'}</Badge>
                    </div>
                    {canWrite ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {CONTRACT_STATUSES.map((status) => (
                          <Button
                            key={status}
                            type="button"
                            size="sm"
                            variant={contract.status === status ? 'primary' : 'outline'}
                            onClick={() => updateContractStatus.mutate({ id: contract.id, status })}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
          {canWrite ? (
            <form onSubmit={handleAdd} className="flex flex-col gap-3 border-t border-border pt-4">
              <TextField
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
              <TextField label="Start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
              <TextField label="End" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
              <Button type="submit" isLoading={createContract.isPending} loadingLabel="Adding">
                Add contract
              </Button>
            </form>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
