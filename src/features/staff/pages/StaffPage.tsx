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
import { StaffBulkCard } from '@/features/staff/components/StaffBulkCard'
import { StaffTable } from '@/features/staff/components/StaffTable'
import { useStaffMutations, useStaffPage } from '@/features/staff/hooks/useStaff'
import type { Staff } from '@/features/staff/types/staff.types'
import type { StaffListKind } from '@/features/staff/api/staff.api'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatPersonName } from '@/lib/format'
import { paths } from '@/routes/paths'

const PAGE_SIZE = 10

const GROUPS: Array<{ id: StaffListKind; label: string }> = [
  { id: 'all', label: 'All staff' },
  { id: 'teachers', label: 'Teachers' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'security', label: 'Security' },
]

export function StaffPage(): ReactNode {
  useDocumentTitle('Staff')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'staff:write')
  const [kind, setKind] = useState<StaffListKind>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const list = useStaffPage(kind, page, PAGE_SIZE)
  const { remove } = useStaffMutations()
  const [pendingDelete, setPendingDelete] = useState<Staff | null>(null)

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const content = list.data?.content ?? []
    if (!needle) return content
    return content.filter((item) =>
      [item.firstName, item.secondName, item.lastName, item.fullName, item.staffNumber, item.workEmail, item.phone, item.department, item.systemRole]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [list.data, query])

  const handleSearch = (value: string) => {
    setQuery(value)
  }

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  const total = list.data?.totalElements ?? 0
  const isEmpty = !list.isLoading && total === 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff"
        description="Teachers, drivers, security, and other employees. The list is paged on the server and does not include passwords."
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

      <StaffBulkCard canWrite={canWrite} />

      <div className="flex flex-col gap-3">
        <SearchField value={query} onChange={handleSearch} placeholder="Search this page…" />
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((group) => (
            <FilterChip
              key={group.id}
              label={group.label}
              active={kind === group.id}
              onClick={() => {
                setKind(group.id)
                setPage(1)
                setQuery('')
              }}
            />
          ))}
        </div>
        <p className="type-caption text-muted-foreground">
          Search looks at the people on this page. Change page to look further.
        </p>
      </div>

      {isEmpty ? (
        <EmptyState
          title="No staff members yet"
          description="Add a person or upload the Excel template."
          actionLabel={canWrite ? 'Add staff' : undefined}
          actionTo={canWrite ? paths.staffNew : undefined}
        />
      ) : query.trim() && rows.length === 0 ? (
        <EmptyState title="No matches on this page" description="Try another page or clear the search." />
      ) : (
        <StaffTable
          rows={rows}
          isLoading={list.isLoading}
          page={query.trim() ? 1 : page}
          pageSize={query.trim() ? Math.max(rows.length, 1) : PAGE_SIZE}
          total={query.trim() ? rows.length : total}
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
