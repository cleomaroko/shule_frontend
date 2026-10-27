/**
 * Learner entity as returned by `LearnerController`.
 * Source: `com.lyrt.shule.learner.Learner`.
 *
 * Primitive booleans serialize as JSON booleans. Dates are ISO `YYYY-MM-DD`.
 * `password` is present on responses and must never be displayed or posted.
 */

/** Body for `POST /api/learners/register` and `PUT /api/learners/{id}`. */
export type LearnerWriteBody = Record<string, string | boolean | { id: number }>

export interface Learner {
  id: number
  firstName: string | null
  middleName: string | null
  lastName: string | null
  gender: string | null
  dateOfBirth: string | null
  admissionNumber: string | null
  admissionClass: string | null
  admissionTerm: string | null
  admissionDate: string | null
  currentClass: string | null
  stream: string | null
  boarding: boolean
  /** `POST /api/learners/register` accepts `campus: { id }`. */
  campus?: { id: number; name?: string | null; location?: string | null } | null
  upiNemisNumber: string | null
  knecExamNumber: string | null
  birthCertificateNumber: string | null
  birthCertificateEntryNumber: string | null
  areaOfSpecialization: string | null
  county: string | null
  subCounty: string | null
  ward: string | null
  constituency: string | null
  feeSponsor: string | null
  ethnicity: string | null
  religion: string | null
  nationality: string | null
  languagesSpoken: string | null
  fatherFirstName: string | null
  fatherMiddleName: string | null
  fatherLastName: string | null
  fatherPhone: string | null
  fatherEmail: string | null
  fatherIdNumber: string | null
  fatherOccupation: string | null
  fatherPlaceOfWork: string | null
  fatherSocialIssues: boolean
  motherFirstName: string | null
  motherMiddleName: string | null
  motherLastName: string | null
  motherPhone: string | null
  motherEmail: string | null
  motherIdNumber: string | null
  motherOccupation: string | null
  motherPlaceOfWork: string | null
  motherSocialIssues: boolean
  guardianFirstName: string | null
  guardianMiddleName: string | null
  guardianLastName: string | null
  guardianPhone: string | null
  guardianEmail: string | null
  guardianIdNumber: string | null
  guardianOccupation: string | null
  guardianPlaceOfWork: string | null
  guardianSocialIssues: boolean
  status: string | null
  dateClearanceInitiated: string | null
  dateCleared: string | null
  dateLastInSchool: string | null
  nameOfNewInstitution: string | null
  dateLeftSchool: string | null
  leavingReason: string | null
  formerSchoolName: string | null
  locationOfPreviousSchool: string | null
  previousSchoolContactPerson: string | null
  previousSchoolTelephone: string | null
  reasonForTransfer: string | null
  emergency1Name: string | null
  emergency1Phone: string | null
  emergency2Name: string | null
  emergency2Phone: string | null
  transportZone: string | null
  hostelName: string | null
  email: string | null
  phoneNumber: string | null
  photoLink: string | null
  dateAdded: string | null
  password?: string | null
  allergyFood: boolean
  allergyMedication: boolean
  allergyAnimals: boolean
  allergyInsects: boolean
  allergyOther: boolean
  medicalConditions: string | null
  suffersDiabetes: boolean
  suffersBleedingDisorder: boolean
  suffersAsthma: boolean
  suffersEczema: boolean
  healthInfo: string | null
  dietaryRequirements: string | null
  specialNeeds: boolean
  kcpeScore: string | null
  ksceGrade: string | null
  kjseaEntry: string | null
  kjseaGrade: string | null
  currentIndexNumber: string | null
}

export const LEARNER_BOOLEAN_KEYS = [
  'boarding',
  'fatherSocialIssues',
  'motherSocialIssues',
  'guardianSocialIssues',
  'allergyFood',
  'allergyMedication',
  'allergyAnimals',
  'allergyInsects',
  'allergyOther',
  'suffersDiabetes',
  'suffersBleedingDisorder',
  'suffersAsthma',
  'suffersEczema',
  'specialNeeds',
] as const

export type LearnerBooleanKey = (typeof LEARNER_BOOLEAN_KEYS)[number]

/** `GET /api/learners/{id}/history`. */
export interface LearnerHistoryEntry {
  id: number
  academicYear: string | null
  term: string | null
  campus: string | null
  className: string | null
  stream: string | null
  status: string | null
  promotionDate: string | null
  actionBy: string | null
}

/** `POST /api/learners/promotions/bulk`. */
export interface BulkPromotionBody {
  campusId: number
  currentYearId: number
  nextYearId: number
  nextTermId: number
  fromClass: string
  targetClass: string
  fromStream?: string
  targetStream?: string
  excludedLearnerIds?: number[]
}
