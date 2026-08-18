import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, StatusBadge, type DataColumn } from '@/components/data/DataTable'
import { formatPersonName, getInitials } from '@/lib/format'
import { paths } from '@/routes/paths'
import type { Staff } from '@/features/staff/types/staff.types'

export interface StaffTableProps {
  rows: Staff[]
  isLoading: boolean
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  canWrite: boolean
  onDelete: (staff: Staff) => void
}

export function StaffTable({
  rows,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  canWrite,
  onDelete,
}: StaffTableProps): ReactNode {
  const columns: Array<DataColumn<Staff>> = [
    {
      id: 'staff',
      header: 'Staff',
      cell: (row) => <StaffIdentity staff={row} />,
    },
    {
      id: 'staffNumber',
      header: 'Staff no.',
      cell: (row) => row.staffNumber || '—',
    },
    {
      id: 'department',
      header: 'Department',
      cell: (row) => row.department || '—',
    },
    {
      id: 'role',
      header: 'Role',
      cell: (row) => row.systemRole || '—',
    },
    {
      id: 'phone',
      header: 'Phone',
      cell: (row) => row.phone || '—',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'actions',
      header: '',
      className: 'w-14 text-right',
      cell: (row) => <StaffRowActions staff={row} canWrite={canWrite} onDelete={onDelete} />,
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
            <StaffIdentity staff={row} />
            <StaffRowActions staff={row} canWrite={canWrite} onDelete={onDelete} />
          </div>
          <dl className="grid grid-cols-2 gap-2 type-caption text-muted-foreground">
            <div>
              <dt>Staff no.</dt>
              <dd className="font-medium text-foreground">{row.staffNumber || '—'}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd className="font-medium text-foreground">{row.department || '—'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd className="font-medium text-foreground">{row.systemRole || '—'}</dd>
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

function StaffIdentity({ staff }: { staff: Staff }): ReactNode {
  const name = formatPersonName(staff)
  return (
    <Link to={paths.staffDetail(staff.id)} className="flex items-center gap-3 min-w-0 hover:underline">
      <Avatar>
        {staff.googleDrivePhotoLink ? <AvatarImage src={staff.googleDrivePhotoLink} alt="" /> : null}
        <AvatarFallback>{getInitials({ firstName: staff.firstName, lastName: staff.lastName, fallback: name })}</AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="type-heading block truncate">{name}</span>
        <span className="type-caption block truncate text-muted-foreground">{staff.workEmail || 'No work email'}</span>
      </span>
    </Link>
  )
}

function StaffRowActions({
  staff,
  canWrite,
  onDelete,
}: {
  staff: Staff
  canWrite: boolean
  onDelete: (staff: Staff) => void
}): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${formatPersonName(staff)}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={paths.staffDetail(staff.id)}>
            <Eye aria-hidden="true" />
            View
          </Link>
        </DropdownMenuItem>
        {canWrite ? (
          <>
            <DropdownMenuItem asChild>
              <Link to={paths.staffEdit(staff.id)}>
                <Pencil aria-hidden="true" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(staff)}>
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
