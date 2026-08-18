import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { FormSection } from '@/components/forms/FormSection'
import { LookupSelect } from '@/components/forms/LookupSelect'
import { SwitchField } from '@/components/forms/SwitchField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import {
  useCounties,
  useGenders,
  useHouses,
  useSchoolClasses,
  useStreams,
  useZones,
  namesOf,
} from '@/features/lookups/useLookups'
import {
  emptyLearnerForm,
  learnerFormSchema,
  learnerFormToCreatePayload,
  learnerFormToPatchPayload,
  learnerToFormValues,
  type LearnerFormValues,
} from '@/features/learners/schemas/learner.schema'
import type { Learner } from '@/features/learners/types/learner.types'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { toast } from 'sonner'

const STEPS = [
  { id: 'basic', title: 'Basic' },
  { id: 'academic', title: 'Academic' },
  { id: 'family', title: 'Family' },
  { id: 'medical', title: 'Medical' },
  { id: 'logistics', title: 'Boarding & transport' },
  { id: 'additional', title: 'Additional' },
] as const

const STEP_FIELDS: Array<Array<keyof LearnerFormValues>> = [
  ['firstName', 'lastName', 'gender', 'dateOfBirth', 'admissionNumber', 'admissionClass'],
  ['currentClass', 'stream', 'admissionTerm', 'admissionDate'],
  ['fatherFirstName', 'fatherPhone', 'fatherEmail', 'motherEmail', 'guardianEmail'],
  [],
  [],
  ['email'],
]

export interface LearnerFormProps {
  learner?: Learner | null
  isSubmitting: boolean
  submitLabel: string
  onSubmit: (payload: Record<string, string | boolean>) => void
}

export function LearnerForm({ learner, isSubmitting, submitLabel, onSubmit }: LearnerFormProps): ReactNode {
  const isEdit = Boolean(learner)
  const [step, setStep] = useState(0)
  const form = useForm<LearnerFormValues>({
    resolver: zodResolver(learnerFormSchema),
    defaultValues: learner ? learnerToFormValues(learner) : emptyLearnerForm(),
    mode: 'onSubmit',
  })

  const genders = namesOf(useGenders().data)
  const classes = (useSchoolClasses().data ?? [])
    .map((item) => item.className)
    .filter((name): name is string => Boolean(name))
  const uniqueClasses = Array.from(new Set(classes))
  const streams = (useStreams().data ?? []).map((item) => item.name).filter(Boolean)
  const counties = namesOf(useCounties().data)
  const houses = (useHouses().data ?? []).map((item) => item.houseName).filter(Boolean)
  const zones = (useZones().data ?? []).map((item) => item.zoneName).filter(Boolean)

  const goNext = async () => {
    const fields = STEP_FIELDS[step] ?? []
    const valid = fields.length === 0 ? true : await form.trigger(fields)
    if (!valid) return
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const handleSubmit = form.handleSubmit((values) => {
    if (isSubmitting) return
    if (isEdit && learner) {
      const patch = learnerFormToPatchPayload(values, learner)
      if (Object.keys(patch).length === 0) {
        toast.info('No changes to save.')
        return
      }
      onSubmit(patch)
      return
    }
    onSubmit(learnerFormToCreatePayload(values))
  })

  const ctx = {
    register: form.register,
    control: form.control,
    errors: form.formState.errors,
    disabled: isSubmitting,
    genders,
    uniqueClasses,
    streams,
    counties,
    houses,
    zones,
    isEdit,
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <ol className="flex flex-wrap gap-2" aria-label="Registration steps">
        {STEPS.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                'type-caption rounded-full border px-3 py-1.5 font-medium',
                index === step
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent',
              )}
            >
              {index + 1}. {item.title}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 ? <BasicStep {...ctx} /> : null}
      {step === 1 ? <AcademicStep {...ctx} /> : null}
      {step === 2 ? <FamilyStep {...ctx} /> : null}
      {step === 3 ? <MedicalStep {...ctx} /> : null}
      {step === 4 ? <LogisticsStep {...ctx} /> : null}
      {step === 5 ? <AdditionalStep {...ctx} /> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button asChild variant="secondary">
          <Link to={learner ? paths.learnerDetail(learner.id) : paths.learners}>Cancel</Link>
        </Button>
        <div className="flex gap-2">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => void goNext()}>
              Continue
            </Button>
          ) : (
            <Button type="submit" isLoading={isSubmitting} loadingLabel="Saving">
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

interface StepProps {
  register: UseFormRegister<LearnerFormValues>
  control: Control<LearnerFormValues>
  errors: FieldErrors<LearnerFormValues>
  disabled: boolean
  genders: string[]
  uniqueClasses: string[]
  streams: string[]
  counties: string[]
  houses: string[]
  zones: string[]
  isEdit: boolean
}

function BasicStep({ register, control, errors, disabled, genders, uniqueClasses, isEdit }: StepProps): ReactNode {
  return (
    <FormSection title="Basic information" description="Required details for enrolment.">
      <TextField label="First name" error={errors.firstName?.message} disabled={disabled} {...register('firstName')} />
      <TextField label="Middle name" error={errors.middleName?.message} disabled={disabled} {...register('middleName')} />
      <TextField label="Last name" error={errors.lastName?.message} disabled={disabled} {...register('lastName')} />
      <LookupSelect control={control} name="gender" label="Gender" options={genders} error={errors.gender?.message} disabled={disabled} />
      <TextField label="Date of birth" type="date" error={errors.dateOfBirth?.message} disabled={disabled} {...register('dateOfBirth')} />
      <TextField
        label="Admission number"
        hint={isEdit ? 'Admission numbers cannot be changed after enrolment.' : 'Leave blank to let the system generate ADM-YYYY-NNNN.'}
        error={errors.admissionNumber?.message}
        disabled={disabled || isEdit}
        {...register('admissionNumber')}
      />
      <LookupSelect control={control} name="admissionClass" label="Admission class" options={uniqueClasses} error={errors.admissionClass?.message} disabled={disabled} />
      <TextField label="Phone number" type="tel" error={errors.phoneNumber?.message} disabled={disabled} {...register('phoneNumber')} />
      <TextField label="Email" type="email" error={errors.email?.message} disabled={disabled} {...register('email')} />
    </FormSection>
  )
}

function AcademicStep({ register, control, errors, disabled, uniqueClasses, streams }: StepProps): ReactNode {
  return (
    <>
      <FormSection title="Placement">
        <LookupSelect control={control} name="currentClass" label="Current class" options={uniqueClasses} error={errors.currentClass?.message} disabled={disabled} />
        <LookupSelect control={control} name="stream" label="Stream" options={streams} error={errors.stream?.message} disabled={disabled} />
        <TextField label="Admission term" error={errors.admissionTerm?.message} disabled={disabled} {...register('admissionTerm')} />
        <TextField label="Admission date" type="date" error={errors.admissionDate?.message} disabled={disabled} {...register('admissionDate')} />
        <TextField label="Area of specialisation" error={errors.areaOfSpecialization?.message} disabled={disabled} {...register('areaOfSpecialization')} />
        <LookupSelect control={control} name="status" label="Status" options={['ACTIVE', 'INACTIVE', 'CLEARED']} fallbackToText={false} error={errors.status?.message} disabled={disabled} />
      </FormSection>
      <FormSection title="Academic history">
        <TextField label="KCPE score" error={errors.kcpeScore?.message} disabled={disabled} {...register('kcpeScore')} />
        <TextField label="KCSE grade" error={errors.ksceGrade?.message} disabled={disabled} {...register('ksceGrade')} />
        <TextField label="KJSEA entry" error={errors.kjseaEntry?.message} disabled={disabled} {...register('kjseaEntry')} />
        <TextField label="KJSEA grade" error={errors.kjseaGrade?.message} disabled={disabled} {...register('kjseaGrade')} />
        <TextField label="Current index number" error={errors.currentIndexNumber?.message} disabled={disabled} {...register('currentIndexNumber')} />
        <TextField label="KNEC exam number" error={errors.knecExamNumber?.message} disabled={disabled} {...register('knecExamNumber')} />
      </FormSection>
    </>
  )
}

function FamilyStep({ register, control, errors, disabled }: StepProps): ReactNode {
  return (
    <>
      <FormSection title="Father">
        <TextField label="First name" error={errors.fatherFirstName?.message} disabled={disabled} {...register('fatherFirstName')} />
        <TextField label="Middle name" error={errors.fatherMiddleName?.message} disabled={disabled} {...register('fatherMiddleName')} />
        <TextField label="Last name" error={errors.fatherLastName?.message} disabled={disabled} {...register('fatherLastName')} />
        <TextField label="Phone" error={errors.fatherPhone?.message} disabled={disabled} {...register('fatherPhone')} />
        <TextField label="Email" type="email" error={errors.fatherEmail?.message} disabled={disabled} {...register('fatherEmail')} />
        <TextField label="ID number" error={errors.fatherIdNumber?.message} disabled={disabled} {...register('fatherIdNumber')} />
        <TextField label="Occupation" error={errors.fatherOccupation?.message} disabled={disabled} {...register('fatherOccupation')} />
        <TextField label="Place of work" error={errors.fatherPlaceOfWork?.message} disabled={disabled} {...register('fatherPlaceOfWork')} />
        <div className="sm:col-span-2">
          <BooleanField control={control} name="fatherSocialIssues" label="Social issues noted" disabled={disabled} />
        </div>
      </FormSection>
      <FormSection title="Mother">
        <TextField label="First name" error={errors.motherFirstName?.message} disabled={disabled} {...register('motherFirstName')} />
        <TextField label="Middle name" error={errors.motherMiddleName?.message} disabled={disabled} {...register('motherMiddleName')} />
        <TextField label="Last name" error={errors.motherLastName?.message} disabled={disabled} {...register('motherLastName')} />
        <TextField label="Phone" error={errors.motherPhone?.message} disabled={disabled} {...register('motherPhone')} />
        <TextField label="Email" type="email" error={errors.motherEmail?.message} disabled={disabled} {...register('motherEmail')} />
        <TextField label="ID number" error={errors.motherIdNumber?.message} disabled={disabled} {...register('motherIdNumber')} />
        <TextField label="Occupation" error={errors.motherOccupation?.message} disabled={disabled} {...register('motherOccupation')} />
        <TextField label="Place of work" error={errors.motherPlaceOfWork?.message} disabled={disabled} {...register('motherPlaceOfWork')} />
        <div className="sm:col-span-2">
          <BooleanField control={control} name="motherSocialIssues" label="Social issues noted" disabled={disabled} />
        </div>
      </FormSection>
      <FormSection title="Guardian">
        <TextField label="First name" error={errors.guardianFirstName?.message} disabled={disabled} {...register('guardianFirstName')} />
        <TextField label="Middle name" error={errors.guardianMiddleName?.message} disabled={disabled} {...register('guardianMiddleName')} />
        <TextField label="Last name" error={errors.guardianLastName?.message} disabled={disabled} {...register('guardianLastName')} />
        <TextField label="Phone" error={errors.guardianPhone?.message} disabled={disabled} {...register('guardianPhone')} />
        <TextField label="Email" type="email" error={errors.guardianEmail?.message} disabled={disabled} {...register('guardianEmail')} />
        <TextField label="ID number" error={errors.guardianIdNumber?.message} disabled={disabled} {...register('guardianIdNumber')} />
        <TextField label="Occupation" error={errors.guardianOccupation?.message} disabled={disabled} {...register('guardianOccupation')} />
        <TextField label="Place of work" error={errors.guardianPlaceOfWork?.message} disabled={disabled} {...register('guardianPlaceOfWork')} />
        <div className="sm:col-span-2">
          <BooleanField control={control} name="guardianSocialIssues" label="Social issues noted" disabled={disabled} />
        </div>
      </FormSection>
      <FormSection title="Emergency contacts">
        <TextField label="Emergency contact 1 name" error={errors.emergency1Name?.message} disabled={disabled} {...register('emergency1Name')} />
        <TextField label="Emergency contact 1 phone" error={errors.emergency1Phone?.message} disabled={disabled} {...register('emergency1Phone')} />
        <TextField label="Emergency contact 2 name" error={errors.emergency2Name?.message} disabled={disabled} {...register('emergency2Name')} />
        <TextField label="Emergency contact 2 phone" error={errors.emergency2Phone?.message} disabled={disabled} {...register('emergency2Phone')} />
      </FormSection>
    </>
  )
}

function MedicalStep({ register, control, errors, disabled }: StepProps): ReactNode {
  return (
    <FormSection title="Medical information">
      <div className="sm:col-span-2 grid gap-3">
        <BooleanField control={control} name="allergyFood" label="Food allergy" disabled={disabled} />
        <BooleanField control={control} name="allergyMedication" label="Medication allergy" disabled={disabled} />
        <BooleanField control={control} name="allergyAnimals" label="Animal allergy" disabled={disabled} />
        <BooleanField control={control} name="allergyInsects" label="Insect allergy" disabled={disabled} />
        <BooleanField control={control} name="allergyOther" label="Other allergy" disabled={disabled} />
        <BooleanField control={control} name="suffersDiabetes" label="Diabetes" disabled={disabled} />
        <BooleanField control={control} name="suffersBleedingDisorder" label="Bleeding disorder" disabled={disabled} />
        <BooleanField control={control} name="suffersAsthma" label="Asthma" disabled={disabled} />
        <BooleanField control={control} name="suffersEczema" label="Eczema" disabled={disabled} />
        <BooleanField control={control} name="specialNeeds" label="Special needs" disabled={disabled} />
      </div>
      <TextareaField label="Medical conditions" containerClassName="sm:col-span-2" error={errors.medicalConditions?.message} disabled={disabled} {...register('medicalConditions')} />
      <TextareaField label="Health information" containerClassName="sm:col-span-2" error={errors.healthInfo?.message} disabled={disabled} {...register('healthInfo')} />
      <TextareaField label="Dietary requirements" containerClassName="sm:col-span-2" error={errors.dietaryRequirements?.message} disabled={disabled} {...register('dietaryRequirements')} />
    </FormSection>
  )
}

function LogisticsStep({ control, errors, disabled, houses, zones }: StepProps): ReactNode {
  return (
    <>
      <FormSection title="Boarding">
        <div className="sm:col-span-2">
          <BooleanField control={control} name="boarding" label="Boarding learner" description="Day scholars should leave this off." disabled={disabled} />
        </div>
        <LookupSelect control={control} name="hostelName" label="Hostel / house" options={houses} error={errors.hostelName?.message} disabled={disabled} />
      </FormSection>
      <FormSection title="Transport">
        <LookupSelect control={control} name="transportZone" label="Transport zone" options={zones} error={errors.transportZone?.message} disabled={disabled} />
      </FormSection>
    </>
  )
}

function AdditionalStep({ register, control, errors, disabled, counties }: StepProps): ReactNode {
  return (
    <>
      <FormSection title="Identification">
        <TextField label="UPI / NEMIS number" error={errors.upiNemisNumber?.message} disabled={disabled} {...register('upiNemisNumber')} />
        <TextField label="Birth certificate number" error={errors.birthCertificateNumber?.message} disabled={disabled} {...register('birthCertificateNumber')} />
        <TextField label="Birth certificate entry number" error={errors.birthCertificateEntryNumber?.message} disabled={disabled} {...register('birthCertificateEntryNumber')} />
        <TextField label="Photo link" error={errors.photoLink?.message} disabled={disabled} {...register('photoLink')} />
      </FormSection>
      <FormSection title="Background">
        <LookupSelect control={control} name="county" label="County" options={counties} error={errors.county?.message} disabled={disabled} />
        <TextField label="Sub-county" error={errors.subCounty?.message} disabled={disabled} {...register('subCounty')} />
        <TextField label="Ward" error={errors.ward?.message} disabled={disabled} {...register('ward')} />
        <TextField label="Constituency" error={errors.constituency?.message} disabled={disabled} {...register('constituency')} />
        <TextField label="Nationality" error={errors.nationality?.message} disabled={disabled} {...register('nationality')} />
        <TextField label="Ethnicity" error={errors.ethnicity?.message} disabled={disabled} {...register('ethnicity')} />
        <TextField label="Religion" error={errors.religion?.message} disabled={disabled} {...register('religion')} />
        <TextField label="Languages spoken" error={errors.languagesSpoken?.message} disabled={disabled} {...register('languagesSpoken')} />
        <TextField label="Fee sponsor" error={errors.feeSponsor?.message} disabled={disabled} {...register('feeSponsor')} />
      </FormSection>
      <FormSection title="Previous school">
        <TextField label="Former school" error={errors.formerSchoolName?.message} disabled={disabled} {...register('formerSchoolName')} />
        <TextField label="Location" error={errors.locationOfPreviousSchool?.message} disabled={disabled} {...register('locationOfPreviousSchool')} />
        <TextField label="Contact person" error={errors.previousSchoolContactPerson?.message} disabled={disabled} {...register('previousSchoolContactPerson')} />
        <TextField label="Telephone" error={errors.previousSchoolTelephone?.message} disabled={disabled} {...register('previousSchoolTelephone')} />
        <TextareaField label="Reason for transfer" containerClassName="sm:col-span-2" error={errors.reasonForTransfer?.message} disabled={disabled} {...register('reasonForTransfer')} />
      </FormSection>
      <FormSection title="Exit">
        <TextField label="Clearance initiated" type="date" error={errors.dateClearanceInitiated?.message} disabled={disabled} {...register('dateClearanceInitiated')} />
        <TextField label="Date cleared" type="date" error={errors.dateCleared?.message} disabled={disabled} {...register('dateCleared')} />
        <TextField label="Last day in school" type="date" error={errors.dateLastInSchool?.message} disabled={disabled} {...register('dateLastInSchool')} />
        <TextField label="Date left school" type="date" error={errors.dateLeftSchool?.message} disabled={disabled} {...register('dateLeftSchool')} />
        <TextField label="New institution" error={errors.nameOfNewInstitution?.message} disabled={disabled} {...register('nameOfNewInstitution')} />
        <TextareaField label="Leaving reason" containerClassName="sm:col-span-2" error={errors.leavingReason?.message} disabled={disabled} {...register('leavingReason')} />
      </FormSection>
    </>
  )
}

function BooleanField({
  control,
  name,
  label,
  description,
  disabled,
}: {
  control: Control<LearnerFormValues>
  name: LearnerBooleanKeyFromForm
  label: string
  description?: string
  disabled: boolean
}): ReactNode {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SwitchField
          label={label}
          description={description}
          checked={Boolean(field.value)}
          onCheckedChange={field.onChange}
          disabled={disabled}
          name={field.name}
        />
      )}
    />
  )
}

type LearnerBooleanKeyFromForm = Extract<keyof LearnerFormValues, `${string}`> &
  (
    | 'boarding'
    | 'fatherSocialIssues'
    | 'motherSocialIssues'
    | 'guardianSocialIssues'
    | 'allergyFood'
    | 'allergyMedication'
    | 'allergyAnimals'
    | 'allergyInsects'
    | 'allergyOther'
    | 'suffersDiabetes'
    | 'suffersBleedingDisorder'
    | 'suffersAsthma'
    | 'suffersEczema'
    | 'specialNeeds'
  )
