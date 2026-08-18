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
import { LearnerTable } from '@/features/learners/components/LearnerTable'
import { useLearnerList, useLearnerMutations } from '@/features/learners/hooks/useLearners'
import type { Learner } from '@/features/learners/types/learner.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatPersonName, formatYear } from '@/lib/format'
import { paths } from '@/routes/paths'

const PAGE_SIZE = 10

export function LearnersPage(): ReactNode {
  useDocumentTitle('Learners')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'learner:write')
  const list = useLearnerList()
  const { remove } = useLearnerMutations()

  const [query, setQuery] = useState('')
  const [klass, setKlass] = useState('all')
  const [gender, setGender] = useState('all')
  const [boarding, setBoarding] = useState('all')
  const [status, setStatus] = useState('all')
  const [year, setYear] = useState('all')
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<Learner | null>(null)

  const classes = unique(list.data?.map((item) => item.currentClass || item.admissionClass))
  const genders = unique(list.data?.map((item) => item.gender))
  const statuses = unique(list.data?.map((item) => item.status))
  const years = unique(list.data?.map((item) => formatYear(item.admissionDate)))

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((item) => {
      if (klass !== 'all' && (item.currentClass || item.admissionClass) !== klass) return false
      if (gender !== 'all' && item.gender !== gender) return false
      if (boarding === 'boarding' && !item.boarding) return false
      if (boarding === 'day' && item.boarding) return false
      if (status !== 'all' && item.status !== status) return false
      if (year !== 'all' && formatYear(item.admissionDate) !== year) return false
      if (!needle) return true
      const haystack = [
        item.firstName,
        item.middleName,
        item.lastName,
        item.admissionNumber,
        item.currentClass,
        item.stream,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [list.data, query, klass, gender, boarding, status, year])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  const isEmpty = !list.isLoading && (list.data?.length ?? 0) === 0
  const noMatches = !list.isLoading && !isEmpty && filtered.length === 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Learners"
        description="Manage enrolled learners."
        actions={
          canWrite ? (
            <Button asChild>
              <Link to={paths.learnerNew}>
                <Plus aria-hidden="true" />
                Add learner
              </Link>
            </Button>
          ) : null
        }
      />

      <SearchField
        value={query}
        onChange={(value) => {
          setQuery(value)
          setPage(1)
        }}
        placeholder="Search learners…"
      />

      <div className="flex flex-col gap-2">
        <FilterRow
          label="Class"
          values={['all', ...classes]}
          current={klass}
          onChange={(value) => {
            setKlass(value)
            setPage(1)
          }}
        />
        <FilterRow
          label="Gender"
          values={['all', ...genders]}
          current={gender}
          onChange={(value) => {
            setGender(value)
            setPage(1)
          }}
        />
        <FilterRow
          label="Boarding"
          values={['all', 'boarding', 'day']}
          current={boarding}
          onChange={(value) => {
            setBoarding(value)
            setPage(1)
          }}
          formatLabel={(value) => (value === 'all' ? 'All' : value === 'boarding' ? 'Boarding' : 'Day scholar')}
        />
        <FilterRow
          label="Status"
          values={['all', ...statuses]}
          current={status}
          onChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
        />
        <FilterRow
          label="Year"
          values={['all', ...years]}
          current={year}
          onChange={(value) => {
            setYear(value)
            setPage(1)
          }}
        />
      </div>

      {isEmpty ? (
        <EmptyState
          title="No learners found"
          description="Enrol your first learner to get started."
          actionLabel={canWrite ? 'Add learner' : undefined}
          actionTo={canWrite ? paths.learnerNew : undefined}
        />
      ) : noMatches ? (
        <EmptyState title="No matching learners" description="Try a different search or filter." />
      ) : (
        <LearnerTable
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
        title="Delete learner?"
        description={
          pendingDelete
            ? `This will permanently remove ${formatPersonName(pendingDelete)}. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete learner"
        isConfirming={remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          remove.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

function unique(values: Array<string | null | undefined> | undefined): string[] {
  return Array.from(new Set((values ?? []).map((value) => value?.trim()).filter((value): value is string => Boolean(value)))).sort()
}

function FilterRow({
  label,
  values,
  current,
  onChange,
  formatLabel,
}: {
  label: string
  values: string[]
  current: string
  onChange: (value: string) => void
  formatLabel?: (value: string) => string
}): ReactNode {
  if (values.length <= 1) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="type-caption w-20 shrink-0 font-medium text-muted-foreground">{label}</span>
      {values.map((value) => (
        <FilterChip
          key={value}
          label={formatLabel ? formatLabel(value) : value === 'all' ? `All ${label.toLowerCase()}` : value}
          active={current === value}
          onClick={() => onChange(value)}
        />
      ))}
    </div>
  )
}
