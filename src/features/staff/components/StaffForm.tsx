import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { FormSection } from '@/components/forms/FormSection'
import { GoogleDrivePhotoField } from '@/components/forms/GoogleDrivePhotoField'
import { LookupSelect } from '@/components/forms/LookupSelect'
import { SelectField } from '@/components/forms/SelectField'
import { toSelectOptions } from '@/components/forms/select-utils'
import { TextField } from '@/components/forms/TextField'
import {
  campusLookupOptions,
  emptyLookupMessage,
  namedLookupOptions,
} from '@/features/lookups/lookup-options'
import {
  useBanks,
  useCampuses,
  useDepartments,
  useEmploymentStatuses,
  useGenders,
  useMaritalStatuses,
  useTaxExemptReasons,
  useTitles,
  useStaffRoles,
} from '@/features/lookups/useLookups'
import {
  emptyStaffForm,
  staffFormSchema,
  staffFormToPayload,
  staffToFormValues,
  type StaffFormValues,
} from '@/features/staff/schemas/staff.schema'
import type { Staff, StaffWritePayload } from '@/features/staff/types/staff.types'
import { COUNTRIES, KENYAN_ETHNICITIES, withExistingOption } from '@/lib/demographics'
import { paths } from '@/routes/paths'

const YES_NO = ['Yes', 'No']

export interface StaffFormProps {
  staff?: Staff | null
  isSubmitting: boolean
  submitLabel: string
  onSubmit: (payload: StaffWritePayload) => void
}

export function StaffForm({ staff, isSubmitting, submitLabel, onSubmit }: StaffFormProps): ReactNode {
  const titlesQuery = useTitles()
  const gendersQuery = useGenders()
  const maritalQuery = useMaritalStatuses()
  const departmentsQuery = useDepartments()
  const campusesQuery = useCampuses()
  const statusesQuery = useEmploymentStatuses()
  const rolesQuery = useStaffRoles()
  const banksQuery = useBanks()
  const taxReasonsQuery = useTaxExemptReasons()
  const titles = namedLookupOptions(titlesQuery.data, staff?.title)
  const genders = namedLookupOptions(gendersQuery.data, staff?.gender)
  const marital = namedLookupOptions(maritalQuery.data, staff?.maritalStatus)
  const departments = namedLookupOptions(departmentsQuery.data, staff?.department)
  const campuses = campusLookupOptions(campusesQuery.data, staff?.institution)
  const statuses = namedLookupOptions(statusesQuery.data, staff?.status ?? 'Active')
  const roles = namedLookupOptions(rolesQuery.data, staff?.systemRole)
  const banks = namedLookupOptions(banksQuery.data, staff?.bankName)
  const taxReasons = namedLookupOptions(taxReasonsQuery.data, staff?.taxExemptReason)
  const nationalities = withExistingOption(COUNTRIES, staff?.nationality)
  const ethnicities = withExistingOption(KENYAN_ETHNICITIES, staff?.ethnicity)
  const isEdit = Boolean(staff)
  const systemLists = 'System → Reference lists'

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: staff ? staffToFormValues(staff) : emptyStaffForm(),
    mode: 'onSubmit',
  })

  const taxExempt = form.watch('taxExempt')

  const handleSubmit = form.handleSubmit((values) => {
    if (isSubmitting) return
    onSubmit(staffFormToPayload(values) as StaffWritePayload)
  })

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <FormSection title="Personal information">
        <TextField label="First name" autoComplete="given-name" error={form.formState.errors.firstName?.message} disabled={isSubmitting} {...form.register('firstName')} />
        <TextField label="Second name" error={form.formState.errors.secondName?.message} disabled={isSubmitting} {...form.register('secondName')} />
        <TextField label="Last name" autoComplete="family-name" error={form.formState.errors.lastName?.message} disabled={isSubmitting} {...form.register('lastName')} />
        <LookupSelect
          control={form.control}
          name="title"
          label="Title"
          options={titles}
          isLoading={titlesQuery.isLoading}
          emptyMessage={emptyLookupMessage('titles', systemLists)}
          error={form.formState.errors.title?.message}
          disabled={isSubmitting}
        />
        <LookupSelect
          control={form.control}
          name="gender"
          label="Gender"
          options={genders}
          isLoading={gendersQuery.isLoading}
          emptyMessage={emptyLookupMessage('genders', systemLists)}
          error={form.formState.errors.gender?.message}
          disabled={isSubmitting}
        />
        <TextField label="Date of birth" type="date" error={form.formState.errors.dateOfBirth?.message} disabled={isSubmitting} {...form.register('dateOfBirth')} />
        <LookupSelect
          control={form.control}
          name="maritalStatus"
          label="Marital status"
          options={marital}
          isLoading={maritalQuery.isLoading}
          emptyMessage={emptyLookupMessage('marital statuses', systemLists)}
          error={form.formState.errors.maritalStatus?.message}
          disabled={isSubmitting}
        />
        <LookupSelect
          control={form.control}
          name="nationality"
          label="Nationality"
          options={nationalities}
          fallbackToText={false}
          error={form.formState.errors.nationality?.message}
          disabled={isSubmitting}
        />
        <TextField label="National ID" error={form.formState.errors.nationalId?.message} disabled={isSubmitting} {...form.register('nationalId')} />
        <LookupSelect
          control={form.control}
          name="ethnicity"
          label="Ethnicity"
          options={ethnicities}
          fallbackToText={false}
          error={form.formState.errors.ethnicity?.message}
          disabled={isSubmitting}
        />
      </FormSection>

      <FormSection title="Contact information">
        <TextField label="Phone" type="tel" autoComplete="tel" error={form.formState.errors.phone?.message} disabled={isSubmitting} {...form.register('phone')} />
        <TextField
          label="Work email"
          type="email"
          autoComplete="email"
          hint={
            isEdit
              ? 'Work email cannot be changed after registration. The backend does not update it on save.'
              : 'Becomes the login username. The account is created with role ROLE_STAFF and the backend default password.'
          }
          error={form.formState.errors.workEmail?.message}
          disabled={isSubmitting || isEdit}
          {...form.register('workEmail')}
        />
        <TextField label="Personal email" type="email" error={form.formState.errors.personalEmail?.message} disabled={isSubmitting} {...form.register('personalEmail')} />
        <TextField label="Town" error={form.formState.errors.town?.message} disabled={isSubmitting} {...form.register('town')} />
        <TextField label="Postal code" error={form.formState.errors.postalCode?.message} disabled={isSubmitting} {...form.register('postalCode')} />
      </FormSection>

      <FormSection title="Employment information">
        <TextField label="Staff number" hint="Payroll number" error={form.formState.errors.staffNumber?.message} disabled={isSubmitting} {...form.register('staffNumber')} />
        <TextField label="Date of employment" type="date" error={form.formState.errors.dateOfEmployment?.message} disabled={isSubmitting} {...form.register('dateOfEmployment')} />
        <TextField label="Date left" type="date" error={form.formState.errors.dateLeft?.message} disabled={isSubmitting} {...form.register('dateLeft')} />
        <LookupSelect
          control={form.control}
          name="department"
          label="Department"
          options={departments}
          isLoading={departmentsQuery.isLoading}
          emptyMessage={emptyLookupMessage('departments', 'System → Departments')}
          error={form.formState.errors.department?.message}
          disabled={isSubmitting}
        />
        <TextField label="Profession" error={form.formState.errors.profession?.message} disabled={isSubmitting} {...form.register('profession')} />
        <TextField label="School rank" error={form.formState.errors.schoolRank?.message} disabled={isSubmitting} {...form.register('schoolRank')} />
        <LookupSelect
          control={form.control}
          name="status"
          label="Status"
          options={statuses}
          isLoading={statusesQuery.isLoading}
          emptyMessage={emptyLookupMessage('employment statuses', systemLists)}
          error={form.formState.errors.status?.message}
          disabled={isSubmitting}
        />
        <LookupSelect
          control={form.control}
          name="systemRole"
          label="Staff role"
          options={roles}
          isLoading={rolesQuery.isLoading}
          emptyMessage={emptyLookupMessage('staff roles', 'System → Staff roles')}
          hint="Stored on the staff record only. New logins are always created as ROLE_STAFF; this field does not change the users table."
          error={form.formState.errors.systemRole?.message}
          disabled={isSubmitting}
        />
        <LookupSelect
          control={form.control}
          name="institution"
          label="Institution / campus"
          options={campuses}
          isLoading={campusesQuery.isLoading}
          emptyMessage={emptyLookupMessage('campuses', 'System → Campuses')}
          error={form.formState.errors.institution?.message}
          disabled={isSubmitting}
        />
        <TextField label="Supervisor" error={form.formState.errors.supervisor?.message} disabled={isSubmitting} {...form.register('supervisor')} />
      </FormSection>

      <FormSection title="Financial and statutory information">
        <LookupSelect
          control={form.control}
          name="bankName"
          label="Bank"
          options={banks}
          isLoading={banksQuery.isLoading}
          emptyMessage={emptyLookupMessage('banks', systemLists)}
          error={form.formState.errors.bankName?.message}
          disabled={isSubmitting}
        />
        <TextField label="Bank branch" error={form.formState.errors.bankBranch?.message} disabled={isSubmitting} {...form.register('bankBranch')} />
        <TextField label="Bank account" error={form.formState.errors.bankAccount?.message} disabled={isSubmitting} {...form.register('bankAccount')} />
        <TextField label="M-Pesa number" error={form.formState.errors.mpesaNumber?.message} disabled={isSubmitting} {...form.register('mpesaNumber')} />
        <TextField label="KRA PIN" error={form.formState.errors.kraPin?.message} disabled={isSubmitting} {...form.register('kraPin')} />
        <TextField label="NHIF number" error={form.formState.errors.nhifNumber?.message} disabled={isSubmitting} {...form.register('nhifNumber')} />
        <TextField label="NSSF number" error={form.formState.errors.nssfNumber?.message} disabled={isSubmitting} {...form.register('nssfNumber')} />
        <TextField label="SACCO number" error={form.formState.errors.saccoNumber?.message} disabled={isSubmitting} {...form.register('saccoNumber')} />
        <TextField label="Pension number" error={form.formState.errors.pensionNumber?.message} disabled={isSubmitting} {...form.register('pensionNumber')} />
        <Controller
          control={form.control}
          name="taxExempt"
          render={({ field }) => (
            <SelectField
              label="Tax exempt"
              value={field.value}
              onChange={field.onChange}
              options={toSelectOptions(YES_NO)}
              allowEmpty={false}
              disabled={isSubmitting}
            />
          )}
        />
        {taxExempt === 'Yes' ? (
          <LookupSelect
            control={form.control}
            name="taxExemptReason"
            label="Tax exempt reason"
            options={taxReasons}
            isLoading={taxReasonsQuery.isLoading}
            emptyMessage={emptyLookupMessage('tax exempt reasons', systemLists)}
            error={form.formState.errors.taxExemptReason?.message}
            disabled={isSubmitting}
          />
        ) : null}
        <Controller
          control={form.control}
          name="deductHelb"
          render={({ field }) => (
            <SelectField
              label="Deduct HELB"
              value={field.value}
              onChange={field.onChange}
              options={toSelectOptions(YES_NO)}
              allowEmpty={false}
              disabled={isSubmitting}
            />
          )}
        />
      </FormSection>

      <FormSection title="Profile photo">
        <Controller
          control={form.control}
          name="googleDrivePhotoLink"
          render={({ field }) => (
            <GoogleDrivePhotoField
              value={field.value}
              onChange={field.onChange}
              error={form.formState.errors.googleDrivePhotoLink?.message}
              disabled={isSubmitting}
              containerClassName="sm:col-span-2"
            />
          )}
        />
      </FormSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="secondary">
          <Link to={staff ? paths.staffDetail(staff.id) : paths.staff}>Cancel</Link>
        </Button>
        <Button type="submit" isLoading={isSubmitting} loadingLabel="Saving">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
