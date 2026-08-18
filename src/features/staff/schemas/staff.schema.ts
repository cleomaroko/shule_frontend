import { z } from 'zod'

const optionalText = z.string()
const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === '' || z.email().safeParse(value).success, 'Enter a valid email address')

export const staffFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name').max(80),
  secondName: optionalText,
  lastName: z.string().trim().min(1, 'Enter a last name').max(80),
  title: optionalText,
  gender: optionalText,
  dateOfBirth: optionalText,
  maritalStatus: optionalText,
  nationalId: optionalText,
  nationality: optionalText,
  phone: z.string().trim().min(1, 'Enter a phone number').max(30),
  workEmail: z
    .string()
    .trim()
    .min(1, 'Enter a work email')
    .pipe(z.email('Enter a valid work email')),
  personalEmail: optionalEmail,
  staffNumber: optionalText,
  dateOfEmployment: optionalText,
  dateLeft: optionalText,
  department: optionalText,
  profession: optionalText,
  schoolRank: optionalText,
  status: optionalText,
  systemRole: optionalText,
  institution: optionalText,
  supervisor: optionalText,
  bankName: optionalText,
  bankBranch: optionalText,
  bankAccount: optionalText,
  mpesaNumber: optionalText,
  kraPin: optionalText,
  nhifNumber: optionalText,
  nssfNumber: optionalText,
  saccoNumber: optionalText,
  pensionNumber: optionalText,
  taxExempt: optionalText,
  taxExemptReason: optionalText,
  deductHelb: optionalText,
  postalCode: optionalText,
  town: optionalText,
  ethnicity: optionalText,
  googleDrivePhotoLink: optionalText,
})

export type StaffFormValues = z.infer<typeof staffFormSchema>

export const emptyStaffForm = (): StaffFormValues => ({
  firstName: '',
  secondName: '',
  lastName: '',
  title: '',
  gender: '',
  dateOfBirth: '',
  maritalStatus: '',
  nationalId: '',
  nationality: '',
  phone: '',
  workEmail: '',
  personalEmail: '',
  staffNumber: '',
  dateOfEmployment: '',
  dateLeft: '',
  department: '',
  profession: '',
  schoolRank: '',
  status: 'Active',
  systemRole: '',
  institution: '',
  supervisor: '',
  bankName: '',
  bankBranch: '',
  bankAccount: '',
  mpesaNumber: '',
  kraPin: '',
  nhifNumber: '',
  nssfNumber: '',
  saccoNumber: '',
  pensionNumber: '',
  taxExempt: 'No',
  taxExemptReason: '',
  deductHelb: 'No',
  postalCode: '',
  town: '',
  ethnicity: '',
  googleDrivePhotoLink: '',
})

function asText(value: string | null | undefined): string {
  return value ?? ''
}

export function staffToFormValues(staff: {
  [K in keyof StaffFormValues]: string | null | undefined
}): StaffFormValues {
  const empty = emptyStaffForm()
  const next = { ...empty }
  for (const key of Object.keys(empty) as Array<keyof StaffFormValues>) {
    next[key] = asText(staff[key])
  }
  return next
}

/** Empty strings become null so the backend does not persist "" where a date is expected. */
export function staffFormToPayload(values: StaffFormValues): Record<string, string | null> {
  const payload: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(values)) {
    const trimmed = value.trim()
    payload[key] = trimmed.length === 0 ? null : trimmed
  }
  return payload
}
