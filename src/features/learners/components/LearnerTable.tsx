import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { DataTable, StatusBadge, type DataColumn } from '@/components/data/DataTable'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Learner } from '@/features/learners/types/learner.types'
import { formatPersonName, getInitials } from '@/lib/format'
import { paths } from '@/routes/paths'

export interface LearnerTableProps {
  rows: Learner[]
  isLoading: boolean
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  canWrite: boolean
  onDelete: (learner: Learner) => void
}

export function LearnerTable({
  rows,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  canWrite,
  onDelete,
}: LearnerTableProps): ReactNode {
  const columns: Array<DataColumn<Learner>> = [
    { id: 'learner', header: 'Learner', cell: (row) => <LearnerIdentity learner={row} /> },
    { id: 'admission', header: 'Admission no.', cell: (row) => row.admissionNumber || '—' },
    { id: 'class', header: 'Class', cell: (row) => row.currentClass || row.admissionClass || '—' },
    { id: 'stream', header: 'Stream', cell: (row) => row.stream || '—' },
    { id: 'gender', header: 'Gender', cell: (row) => row.gender || '—' },
    {
      id: 'boarding',
      header: 'Board',
      cell: (row) => (
        <Badge variant={row.boarding ? 'primary' : 'neutral'}>{row.boarding ? 'Boarding' : 'Day'}</Badge>
      ),
    },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: '',
      className: 'w-14',
      cell: (row) => <LearnerRowActions learner={row} canWrite={canWrite} onDelete={onDelete} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      mobileCard={(row) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <LearnerIdentity learner={row} />
            <LearnerRowActions learner={row} canWrite={canWrite} onDelete={onDelete} />
          </div>
          <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
            <div>
              <dt>Admission</dt>
              <dd className="font-medium text-foreground">{row.admissionNumber || '—'}</dd>
            </div>
            <div>
              <dt>Class</dt>
              <dd className="font-medium text-foreground">{row.currentClass || row.admissionClass || '—'}</dd>
            </div>
            <div>
              <dt>Gender</dt>
              <dd className="font-medium text-foreground">{row.gender || '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={row.status} />
              </dd>
            </div>
          </dl>
        </div>
      )}
    />
  )
}

function LearnerIdentity({ learner }: { learner: Learner }): ReactNode {
  const name = formatPersonName({ firstName: learner.firstName, middleName: learner.middleName, lastName: learner.lastName })
  return (
    <Link to={paths.learnerDetail(learner.id)} className="flex min-w-0 items-center gap-3 hover:underline">
      <Avatar>
        {learner.photoLink ? <AvatarImage src={learner.photoLink} alt="" /> : null}
        <AvatarFallback>{getInitials({ firstName: learner.firstName, lastName: learner.lastName, fallback: name })}</AvatarFallback>
      </Avatar>
      <span className="type-heading truncate">{name}</span>
    </Link>
  )
}

function LearnerRowActions({
  learner,
  canWrite,
  onDelete,
}: {
  learner: Learner
  canWrite: boolean
  onDelete: (learner: Learner) => void
}): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${formatPersonName(learner)}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={paths.learnerDetail(learner.id)}>
            <Eye aria-hidden="true" />
            View
          </Link>
        </DropdownMenuItem>
        {canWrite ? (
          <>
            <DropdownMenuItem asChild>
              <Link to={paths.learnerEdit(learner.id)}>
                <Pencil aria-hidden="true" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(learner)}>
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
