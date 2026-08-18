import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/data/DataTable'
import { ProfileField, ProfileSection } from '@/components/forms/FormSection'
import { displayValue, formatDate, formatPersonName, getInitials } from '@/lib/format'
import { paths } from '@/routes/paths'
import type { Staff } from '@/features/staff/types/staff.types'

export function StaffProfile({ staff, canWrite }: { staff: Staff; canWrite: boolean }): ReactNode {
  const name = formatPersonName(staff)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {staff.googleDrivePhotoLink ? <AvatarImage src={staff.googleDrivePhotoLink} alt="" /> : null}
            <AvatarFallback className="text-base">
              {getInitials({ firstName: staff.firstName, lastName: staff.lastName, fallback: name })}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="type-page-title">{name}</h1>
            <p className="type-body mt-1 text-muted-foreground">
              {[staff.staffNumber, staff.department].filter(Boolean).join(' · ') || 'No employment details yet'}
            </p>
            <div className="mt-2">
              <StatusBadge status={staff.status} />
            </div>
          </div>
        </div>
        {canWrite ? (
          <Button asChild variant="secondary">
            <Link to={paths.staffEdit(staff.id)}>Edit profile</Link>
          </Button>
        ) : null}
      </div>

      <ProfileSection title="Contact">
        <ProfileField label="Work email" value={displayValue(staff.workEmail)} />
        <ProfileField label="Personal email" value={displayValue(staff.personalEmail)} />
        <ProfileField label="Phone" value={displayValue(staff.phone)} />
        <ProfileField label="Town" value={displayValue(staff.town)} />
        <ProfileField label="Postal code" value={displayValue(staff.postalCode)} />
      </ProfileSection>

      <ProfileSection title="Personal information">
        <ProfileField label="Title" value={displayValue(staff.title)} />
        <ProfileField label="Gender" value={displayValue(staff.gender)} />
        <ProfileField label="Date of birth" value={formatDate(staff.dateOfBirth)} />
        <ProfileField label="Marital status" value={displayValue(staff.maritalStatus)} />
        <ProfileField label="Nationality" value={displayValue(staff.nationality)} />
        <ProfileField label="National ID" value={displayValue(staff.nationalId)} />
        <ProfileField label="Ethnicity" value={displayValue(staff.ethnicity)} />
      </ProfileSection>

      <ProfileSection title="Employment">
        <ProfileField label="Staff number" value={displayValue(staff.staffNumber)} />
        <ProfileField label="Date of employment" value={formatDate(staff.dateOfEmployment)} />
        <ProfileField label="Date left" value={formatDate(staff.dateLeft)} />
        <ProfileField label="Department" value={displayValue(staff.department)} />
        <ProfileField label="Profession" value={displayValue(staff.profession)} />
        <ProfileField label="School rank" value={displayValue(staff.schoolRank)} />
        <ProfileField label="System role" value={displayValue(staff.systemRole)} />
        <ProfileField label="Institution" value={displayValue(staff.institution)} />
        <ProfileField label="Supervisor" value={displayValue(staff.supervisor)} />
        <ProfileField label="Status" value={<StatusBadge status={staff.status} />} />
      </ProfileSection>

      <ProfileSection title="Financial information">
        <ProfileField label="Bank" value={displayValue(staff.bankName)} />
        <ProfileField label="Branch" value={displayValue(staff.bankBranch)} />
        <ProfileField label="Account" value={displayValue(staff.bankAccount)} />
        <ProfileField label="M-Pesa number" value={displayValue(staff.mpesaNumber)} />
        <ProfileField label="KRA PIN" value={displayValue(staff.kraPin)} />
        <ProfileField label="NHIF number" value={displayValue(staff.nhifNumber)} />
        <ProfileField label="NSSF number" value={displayValue(staff.nssfNumber)} />
        <ProfileField label="SACCO number" value={displayValue(staff.saccoNumber)} />
        <ProfileField label="Pension number" value={displayValue(staff.pensionNumber)} />
        <ProfileField label="Tax exempt" value={displayValue(staff.taxExempt)} />
        <ProfileField label="Tax exempt reason" value={displayValue(staff.taxExemptReason)} />
        <ProfileField label="Deduct HELB" value={displayValue(staff.deductHelb)} />
      </ProfileSection>
    </div>
  )
}
