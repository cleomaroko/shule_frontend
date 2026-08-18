/**
 * Staff entity as returned by `StaffController`.
 * Source: `com.lyrt.shule.staff.Staff`.
 *
 * Dates serialize as ISO `YYYY-MM-DD`. `password` is present on responses and
 * must never be displayed or posted back.
 */
export interface Staff {
  id: number
  firstName: string | null
  secondName: string | null
  lastName: string | null
  title: string | null
  gender: string | null
  dateOfBirth: string | null
  maritalStatus: string | null
  nationalId: string | null
  nationality: string | null
  phone: string | null
  workEmail: string | null
  personalEmail: string | null
  staffNumber: string | null
  dateOfEmployment: string | null
  dateLeft: string | null
  department: string | null
  profession: string | null
  schoolRank: string | null
  status: string | null
  systemRole: string | null
  institution: string | null
  supervisor: string | null
  bankName: string | null
  bankBranch: string | null
  bankAccount: string | null
  mpesaNumber: string | null
  kraPin: string | null
  nhifNumber: string | null
  nssfNumber: string | null
  saccoNumber: string | null
  pensionNumber: string | null
  taxExempt: string | null
  taxExemptReason: string | null
  deductHelb: string | null
  postalCode: string | null
  town: string | null
  ethnicity: string | null
  googleDrivePhotoLink: string | null
  dateAdded: string | null
  password?: string | null
}

export type StaffWritePayload = Omit<Staff, 'id' | 'dateAdded' | 'password'>
