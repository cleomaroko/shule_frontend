/**
 * Staff entity as returned by `StaffController`.
 * Source: `com.lyrt.shule.staff.Staff`.
 *
 * List endpoints return `StaffDto.Response` pages. Passwords, banking, and
 * identity documents are not included. Register and update still accept the
 * full profile.
 */
export interface Staff {
  id: number
  firstName: string | null
  secondName: string | null
  lastName: string | null
  fullName?: string | null
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
