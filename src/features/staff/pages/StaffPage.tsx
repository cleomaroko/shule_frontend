import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { FilterChip, SearchField } from '@/components/data/FilterBar'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { Button } from '@/components/ui/button'
import { StaffTable } from '@/features/staff/components/StaffTable'
import { useStaffList, useStaffMutations } from '@/features/staff/hooks/useStaff'
import type { Staff } from '@/features/staff/types/staff.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatPersonName } from '@/lib/format'
import { paths } from '@/routes/paths'

const PAGE_SIZE = 10

export function StaffPage(): ReactNode {
  useDocumentTitle('Staff')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'staff:write')
  const list = useStaffList()
  const { remove } = useStaffMutations()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<Staff | null>(null)

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
        item.firstName,
        item.secondName,
        item.lastName,
        item.staffNumber,
        item.workEmail,
        item.phone,
        item.department,
        item.systemRole,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [list.data, query, status])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = (value: string) => {
    setQuery(value)
    setPage(1)
  }

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  const isEmpty = !list.isLoading && (list.data?.length ?? 0) === 0
  const noMatches = !list.isLoading && !isEmpty && filtered.length === 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff"
        description="Manage teachers and school employees."
        actions={
          canWrite ? (
            <Button asChild>
              <Link to={paths.staffNew}>
                <Plus aria-hidden="true" />
                Add staff
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={handleSearch} placeholder="Search staff…" />
        <div className="flex flex-wrap gap-2">
          {statuses.map((value) => (
            <FilterChip
              key={value}
              label={value === 'all' ? 'All staff' : value}
              active={status === value}
              onClick={() => {
                setStatus(value)
                setPage(1)
              }}
            />
          ))}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          title="No staff members yet"
          description="Add your first staff member to get started."
          actionLabel={canWrite ? 'Add staff' : undefined}
          actionTo={canWrite ? paths.staffNew : undefined}
        />
      ) : noMatches ? (
        <EmptyState title="No matching staff" description="Try a different search or status filter." />
      ) : (
        <StaffTable
          rows={paged}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
          canWrite={canWrite}
          onDelete={setPendingDelete}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="Delete staff member?"
        description={
          pendingDelete
            ? `This will permanently remove ${formatPersonName(pendingDelete)}. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete staff"
        isConfirming={remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          remove.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}
