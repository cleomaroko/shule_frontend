import { z } from 'zod'

import { LEARNER_BOOLEAN_KEYS, type Learner, type LearnerBooleanKey } from '@/features/learners/types/learner.types'

const text = z.string()
const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === '' || z.email().safeParse(value).success, 'Enter a valid email address')

export const learnerFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name').max(80),
  middleName: text,
  lastName: z.string().trim().min(1, 'Enter a last name').max(80),
  gender: z.string().min(1, 'Select a gender'),
  dateOfBirth: text,
  admissionNumber: text,
  admissionClass: text,
  admissionTerm: text,
  admissionDate: text,
  currentClass: text,
  stream: text,
  boarding: z.boolean(),
  upiNemisNumber: text,
  knecExamNumber: text,
  birthCertificateNumber: text,
  birthCertificateEntryNumber: text,
  areaOfSpecialization: text,
  county: text,
  subCounty: text,
  ward: text,
  constituency: text,
  feeSponsor: text,
  ethnicity: text,
  religion: text,
  nationality: text,
  languagesSpoken: text,
  fatherFirstName: text,
  fatherMiddleName: text,
  fatherLastName: text,
  fatherPhone: text,
  fatherEmail: optionalEmail,
  fatherIdNumber: text,
  fatherOccupation: text,
  fatherPlaceOfWork: text,
  fatherSocialIssues: z.boolean(),
  motherFirstName: text,
  motherMiddleName: text,
  motherLastName: text,
  motherPhone: text,
  motherEmail: optionalEmail,
  motherIdNumber: text,
  motherOccupation: text,
  motherPlaceOfWork: text,
  motherSocialIssues: z.boolean(),
  guardianFirstName: text,
  guardianMiddleName: text,
  guardianLastName: text,
  guardianPhone: text,
  guardianEmail: optionalEmail,
  guardianIdNumber: text,
  guardianOccupation: text,
  guardianPlaceOfWork: text,
  guardianSocialIssues: z.boolean(),
  status: text,
  dateClearanceInitiated: text,
  dateCleared: text,
  dateLastInSchool: text,
  nameOfNewInstitution: text,
  dateLeftSchool: text,
  leavingReason: text,
  formerSchoolName: text,
  locationOfPreviousSchool: text,
  previousSchoolContactPerson: text,
  previousSchoolTelephone: text,
  reasonForTransfer: text,
  emergency1Name: text,
  emergency1Phone: text,
  emergency2Name: text,
  emergency2Phone: text,
  transportZone: text,
  hostelName: text,
  email: optionalEmail,
  phoneNumber: text,
  photoLink: text,
  allergyFood: z.boolean(),
  allergyMedication: z.boolean(),
  allergyAnimals: z.boolean(),
  allergyInsects: z.boolean(),
  allergyOther: z.boolean(),
  medicalConditions: text,
  suffersDiabetes: z.boolean(),
  suffersBleedingDisorder: z.boolean(),
  suffersAsthma: z.boolean(),
  suffersEczema: z.boolean(),
  healthInfo: text,
  dietaryRequirements: text,
  specialNeeds: z.boolean(),
  kcpeScore: text,
  ksceGrade: text,
  kjseaEntry: text,
  kjseaGrade: text,
  currentIndexNumber: text,
})

export type LearnerFormValues = z.infer<typeof learnerFormSchema>

const BOOLEAN_DEFAULTS: Record<LearnerBooleanKey, boolean> = {
  boarding: false,
  fatherSocialIssues: false,
  motherSocialIssues: false,
  guardianSocialIssues: false,
  allergyFood: false,
  allergyMedication: false,
  allergyAnimals: false,
  allergyInsects: false,
  allergyOther: false,
  suffersDiabetes: false,
  suffersBleedingDisorder: false,
  suffersAsthma: false,
  suffersEczema: false,
  specialNeeds: false,
}

export function emptyLearnerForm(): LearnerFormValues {
  return {
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    admissionNumber: '',
    admissionClass: '',
    admissionTerm: '',
    admissionDate: '',
    currentClass: '',
    stream: '',
    upiNemisNumber: '',
    knecExamNumber: '',
    birthCertificateNumber: '',
    birthCertificateEntryNumber: '',
    areaOfSpecialization: '',
    county: '',
    subCounty: '',
    ward: '',
    constituency: '',
    feeSponsor: '',
    ethnicity: '',
    religion: '',
    nationality: '',
    languagesSpoken: '',
    fatherFirstName: '',
    fatherMiddleName: '',
    fatherLastName: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherIdNumber: '',
    fatherOccupation: '',
    fatherPlaceOfWork: '',
    motherFirstName: '',
    motherMiddleName: '',
    motherLastName: '',
    motherPhone: '',
    motherEmail: '',
    motherIdNumber: '',
    motherOccupation: '',
    motherPlaceOfWork: '',
    guardianFirstName: '',
    guardianMiddleName: '',
    guardianLastName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianIdNumber: '',
    guardianOccupation: '',
    guardianPlaceOfWork: '',
    status: 'ACTIVE',
    dateClearanceInitiated: '',
    dateCleared: '',
    dateLastInSchool: '',
    nameOfNewInstitution: '',
    dateLeftSchool: '',
    leavingReason: '',
    formerSchoolName: '',
    locationOfPreviousSchool: '',
    previousSchoolContactPerson: '',
    previousSchoolTelephone: '',
    reasonForTransfer: '',
    emergency1Name: '',
    emergency1Phone: '',
    emergency2Name: '',
    emergency2Phone: '',
    transportZone: '',
    hostelName: '',
    email: '',
    phoneNumber: '',
    photoLink: '',
    medicalConditions: '',
    healthInfo: '',
    dietaryRequirements: '',
    kcpeScore: '',
    ksceGrade: '',
    kjseaEntry: '',
    kjseaGrade: '',
    currentIndexNumber: '',
    ...BOOLEAN_DEFAULTS,
  }
}

export function learnerToFormValues(learner: Learner): LearnerFormValues {
  const empty = emptyLearnerForm()
  const next = { ...empty }

  for (const key of Object.keys(empty) as Array<keyof LearnerFormValues>) {
    const value = learner[key as keyof Learner]
    if (LEARNER_BOOLEAN_KEYS.includes(key as LearnerBooleanKey)) {
      next[key] = Boolean(value) as never
    } else if (value === null || value === undefined) {
      next[key] = '' as never
    } else {
      next[key] = String(value) as never
    }
  }

  return next
}

function isBooleanKey(key: string): key is LearnerBooleanKey {
  return (LEARNER_BOOLEAN_KEYS as readonly string[]).includes(key)
}

/**
 * Create payload: omit empty strings and omit admissionNumber when blank so the
 * backend generates ADM-YYYY-NNNN. Never send password/id/dateAdded.
 */
export function learnerFormToCreatePayload(values: LearnerFormValues): Record<string, string | boolean> {
  const payload: Record<string, string | boolean> = {}

  for (const [key, value] of Object.entries(values)) {
    if (key === 'admissionNumber' && typeof value === 'string' && value.trim() === '') continue
    if (isBooleanKey(key)) {
      payload[key] = Boolean(value)
      continue
    }
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.length > 0) payload[key] = trimmed
    }
  }

  return payload
}

/**
 * Partial update payload for `PUT /api/learners/{id}`.
 *
 * The controller copies only non-null properties, and always ignores id,
 * password, admissionNumber and dateAdded. Empty strings *do* overwrite, so a
 * cleared field is sent as "" rather than omitted.
 */
export function learnerFormToPatchPayload(
  values: LearnerFormValues,
  original: Learner,
): Record<string, string | boolean> {
  const originalForm = learnerToFormValues(original)
  const payload: Record<string, string | boolean> = {}

  for (const key of Object.keys(values) as Array<keyof LearnerFormValues>) {
    if (key === 'admissionNumber') continue
    const next = values[key]
    const prev = originalForm[key]
    if (next === prev) continue

    if (isBooleanKey(key)) {
      payload[key] = Boolean(next)
    } else if (typeof next === 'string') {
      payload[key] = next.trim()
    }
  }

  return payload
}
