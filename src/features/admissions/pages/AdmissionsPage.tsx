import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { SearchField } from '@/components/data/FilterBar'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { Button } from '@/components/ui/button'
import type { LearnerLead } from '@/features/admissions/api/admissions.api'
import { useAdmissionMutations, usePendingLeads } from '@/features/admissions/hooks/useAdmissions'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatDate, formatDateTime } from '@/lib/format'
import { paths } from '@/routes/paths'

const PAGE_SIZE = 10

function studentName(lead: LearnerLead): string {
  return [lead.studentFirstName, lead.studentMiddleName, lead.studentSurname].filter(Boolean).join(' ') || 'Unnamed'
}

export function AdmissionsPage(): ReactNode {
  useDocumentTitle('Admissions')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'admissions:write')
  const list = usePendingLeads()
  const { markProcessed } = useAdmissionMutations()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((lead) => {
      if (!needle) return true
      return [
        studentName(lead),
        lead.campus,
        lead.classApplied,
        lead.source,
        lead.parentFirstName,
        lead.parentSurname,
        lead.parentPhone,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [list.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<LearnerLead>> = [
    {
      id: 'student',
      header: 'Applicant',
      cell: (row) => (
        <span>
          <span className="block font-medium">{studentName(row)}</span>
          <span className="type-caption text-muted-foreground">{displayValue(row.classApplied)}</span>
        </span>
      ),
    },
    { id: 'campus', header: 'Campus', cell: (row) => displayValue(row.campus) },
    { id: 'source', header: 'Source', hideOnMobile: true, cell: (row) => displayValue(row.source) },
    {
      id: 'parent',
      header: 'Parent',
      hideOnMobile: true,
      cell: (row) => [row.parentFirstName, row.parentSurname].filter(Boolean).join(' ') || '—',
    },
    { id: 'phone', header: 'Phone', hideOnMobile: true, cell: (row) => displayValue(row.parentPhone) },
    { id: 'submitted', header: 'Submitted', cell: (row) => formatDateTime(row.submissionDate) },
    {
      id: 'actions',
      header: '',
      className: 'w-40 text-right',
      cell: (row) =>
        canWrite ? (
          <Button size="sm" onClick={() => markProcessed.mutate(row.id)} disabled={markProcessed.isPending}>
            Mark processed
          </Button>
        ) : null,
    },
  ]

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Website admissions"
        description="Pending applications from the public form. Processed leads leave this list. Enrol the learner separately."
      />
      <SearchField
        value={query}
        onChange={(value) => {
          setQuery(value)
          setPage(1)
        }}
        placeholder="Search applicants…"
      />
      {(list.data?.length ?? 0) === 0 && !list.isLoading ? (
        <EmptyState
          title="No pending applications"
          description="Public submissions appear here until they are marked processed. Enrol a learner from Learners when ready."
        />
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
              <p className="type-heading">{studentName(row)}</p>
              <p className="type-caption text-muted-foreground">
                {[row.campus, row.classApplied, formatDate(row.studentDob)].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
        />
      )}
      <p className="type-caption text-muted-foreground">
        After processing, register the student under{' '}
        <Link className="text-primary underline-offset-2 hover:underline" to={paths.learnerNew}>
          Learners
        </Link>
        .
      </p>
    </div>
  )
}
