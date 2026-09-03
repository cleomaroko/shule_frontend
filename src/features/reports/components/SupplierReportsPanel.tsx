import { useMemo, useState, type ReactNode } from 'react'
import { useQueries } from '@tanstack/react-query'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState } from '@/components/feedback/PageStates'
import { Badge } from '@/components/ui/badge'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy, todayIso } from '@/features/reports/lib/summaries'
import { suppliersApi } from '@/features/suppliers/api/suppliers.api'
import { useSupplierList } from '@/features/suppliers/hooks/useSuppliers'
import {
  contractIsExpired,
  supplierIsActive,
  type SupplierContract,
} from '@/features/suppliers/types/supplier.types'
import { displayValue, formatDate } from '@/lib/format'

const PAGE_SIZE = 12

interface ContractRow extends SupplierContract {
  supplierName: string
}

export function SupplierReportsPanel(): ReactNode {
  const suppliers = useSupplierList()
  const supplierRows = suppliers.data ?? []
  const today = todayIso()
  const [page, setPage] = useState(1)

  const contractQueries = useQueries({
    queries: supplierRows.map((supplier) => ({
      queryKey: queryKeys.suppliers.contracts(supplier.id),
      queryFn: () => suppliersApi.listContracts(supplier.id),
      enabled: suppliers.isSuccess,
    })),
  })

  const contracts = useMemo<ContractRow[]>(() => {
    return contractQueries.flatMap((query, index) => {
      const supplier = supplierRows[index]
      if (!supplier || !query.data) return []
      return query.data.map((contract) => ({
        ...contract,
        supplierName: supplier.name,
      }))
    })
  }, [contractQueries, supplierRows])

  const loadingContracts = contractQueries.some((query) => query.isLoading)
  const contractError = contractQueries.find((query) => query.isError)

  const expired = contracts.filter((row) => contractIsExpired(row, today))
  const activeContracts = contracts.filter((row) => (row.status ?? '').toUpperCase() === 'ACTIVE')
  const paged = contracts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<ContractRow>> = [
    { id: 'supplier', header: 'Supplier', cell: (row) => row.supplierName },
    { id: 'desc', header: 'Description', cell: (row) => displayValue(row.description) },
    { id: 'start', header: 'Start', cell: (row) => formatDate(row.startDate) },
    { id: 'end', header: 'End', cell: (row) => formatDate(row.endDate) },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={contractIsExpired(row, today) ? 'destructive' : 'success'}>
          {contractIsExpired(row, today) ? 'Expired' : displayValue(row.status)}
        </Badge>
      ),
    },
  ]

  if (suppliers.isError) {
    return <ErrorState message={toUserMessage(suppliers.error)} onRetry={() => void suppliers.refetch()} />
  }

  if (contractError) {
    return (
      <ErrorState
        message={toUserMessage(contractError.error)}
        onRetry={() => {
          for (const query of contractQueries) void query.refetch()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Suppliers and contracts"
        note="There is no all-contracts list. Each supplier's contracts are loaded from GET /api/suppliers/{id}/contracts. Expiry uses endDate compared with today, plus the backend expired flag when present."
      >
        <StatGrid
          items={[
            {
              label: 'Suppliers',
              value: supplierRows.length.toLocaleString(),
              hint: `${supplierRows.filter(supplierIsActive).length.toLocaleString()} marked active`,
            },
            { label: 'Contracts', value: contracts.length.toLocaleString(), hint: 'Loaded per supplier' },
            { label: 'Active status', value: activeContracts.length.toLocaleString(), hint: 'Status recorded as ACTIVE' },
            { label: 'Expired', value: expired.length.toLocaleString(), hint: 'endDate before today, or expired flag' },
          ]}
          loading={suppliers.isLoading || loadingContracts}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="Suppliers by business type"
            rows={countBy(supplierRows, (row) => row.businessType?.name)}
            empty="No suppliers yet."
            loading={suppliers.isLoading}
          />
          <BreakdownCard
            title="Contracts by status"
            rows={countBy(contracts, (row) =>
              contractIsExpired(row, today) ? 'Expired' : row.status,
            )}
            empty="No contracts yet."
            loading={loadingContracts}
          />
        </div>
      </ReportSection>

      <ReportSection title="Contract register">
        {contracts.length === 0 && !loadingContracts ? (
          <EmptyState
            title="No contracts yet"
            description="Add a contract on a supplier record to see expiry here."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={paged}
            getRowId={(row) => `${row.supplierName}-${row.id}`}
            isLoading={loadingContracts}
            page={page}
            pageSize={PAGE_SIZE}
            total={contracts.length}
            onPageChange={setPage}
            mobileCard={(row) => (
              <div>
                <p className="type-heading">{row.supplierName}</p>
                <p className="type-caption text-muted-foreground">
                  {displayValue(row.description)} · ends {formatDate(row.endDate)}
                </p>
              </div>
            )}
          />
        )}
      </ReportSection>
    </div>
  )
}
