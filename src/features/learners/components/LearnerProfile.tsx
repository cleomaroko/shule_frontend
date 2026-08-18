import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { StatusBadge } from '@/components/data/DataTable'
import { ProfileField, ProfileSection } from '@/components/forms/FormSection'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Learner } from '@/features/learners/types/learner.types'
import { displayValue, formatDate, formatPersonName, getInitials } from '@/lib/format'
import { paths } from '@/routes/paths'

export function LearnerProfile({ learner, canWrite }: { learner: Learner; canWrite: boolean }): ReactNode {
  const name = formatPersonName({
    firstName: learner.firstName,
    middleName: learner.middleName,
    lastName: learner.lastName,
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {learner.photoLink ? <AvatarImage src={learner.photoLink} alt="" /> : null}
            <AvatarFallback className="text-base">
              {getInitials({ firstName: learner.firstName, lastName: learner.lastName, fallback: name })}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="type-page-title">{name}</h1>
            <p className="type-body mt-1 text-muted-foreground">
              {[learner.admissionNumber, learner.currentClass || learner.admissionClass].filter(Boolean).join(' · ') ||
                'No placement yet'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge status={learner.status} />
              <Badge variant={learner.boarding ? 'primary' : 'neutral'}>
                {learner.boarding ? 'Boarding' : 'Day scholar'}
              </Badge>
            </div>
          </div>
        </div>
        {canWrite ? (
          <Button asChild variant="secondary">
            <Link to={paths.learnerEdit(learner.id)}>Edit profile</Link>
          </Button>
        ) : null}
      </div>

      <ProfileSection title="Personal information">
        <ProfileField label="Gender" value={displayValue(learner.gender)} />
        <ProfileField label="Date of birth" value={formatDate(learner.dateOfBirth)} />
        <ProfileField label="Nationality" value={displayValue(learner.nationality)} />
        <ProfileField label="Religion" value={displayValue(learner.religion)} />
        <ProfileField label="Ethnicity" value={displayValue(learner.ethnicity)} />
        <ProfileField label="Languages" value={displayValue(learner.languagesSpoken)} />
        <ProfileField label="Email" value={displayValue(learner.email)} />
        <ProfileField label="Phone" value={displayValue(learner.phoneNumber)} />
      </ProfileSection>

      <ProfileSection title="Academic information">
        <ProfileField label="Admission number" value={displayValue(learner.admissionNumber)} />
        <ProfileField label="Admission class" value={displayValue(learner.admissionClass)} />
        <ProfileField label="Admission date" value={formatDate(learner.admissionDate)} />
        <ProfileField label="Admission term" value={displayValue(learner.admissionTerm)} />
        <ProfileField label="Current class" value={displayValue(learner.currentClass)} />
        <ProfileField label="Stream" value={displayValue(learner.stream)} />
        <ProfileField label="Specialisation" value={displayValue(learner.areaOfSpecialization)} />
        <ProfileField label="KCPE score" value={displayValue(learner.kcpeScore)} />
        <ProfileField label="KCSE grade" value={displayValue(learner.ksceGrade)} />
        <ProfileField label="KJSEA" value={[learner.kjseaEntry, learner.kjseaGrade].filter(Boolean).join(' · ') || '—'} />
        <ProfileField label="Index number" value={displayValue(learner.currentIndexNumber)} />
        <ProfileField label="KNEC exam number" value={displayValue(learner.knecExamNumber)} />
      </ProfileSection>

      <ProfileSection title="Parent / guardian">
        <ProfileField
          label="Father"
          value={contactBlock(learner.fatherFirstName, learner.fatherLastName, learner.fatherPhone, learner.fatherEmail)}
        />
        <ProfileField
          label="Mother"
          value={contactBlock(learner.motherFirstName, learner.motherLastName, learner.motherPhone, learner.motherEmail)}
        />
        <ProfileField
          label="Guardian"
          value={contactBlock(
            learner.guardianFirstName,
            learner.guardianLastName,
            learner.guardianPhone,
            learner.guardianEmail,
          )}
        />
        <ProfileField label="Emergency 1" value={contactBlock(learner.emergency1Name, null, learner.emergency1Phone, null)} />
        <ProfileField label="Emergency 2" value={contactBlock(learner.emergency2Name, null, learner.emergency2Phone, null)} />
      </ProfileSection>

      <ProfileSection title="Medical information">
        <ProfileField label="Food allergy" value={displayValue(learner.allergyFood)} />
        <ProfileField label="Medication allergy" value={displayValue(learner.allergyMedication)} />
        <ProfileField label="Animal allergy" value={displayValue(learner.allergyAnimals)} />
        <ProfileField label="Insect allergy" value={displayValue(learner.allergyInsects)} />
        <ProfileField label="Other allergy" value={displayValue(learner.allergyOther)} />
        <ProfileField label="Asthma" value={displayValue(learner.suffersAsthma)} />
        <ProfileField label="Diabetes" value={displayValue(learner.suffersDiabetes)} />
        <ProfileField label="Eczema" value={displayValue(learner.suffersEczema)} />
        <ProfileField label="Bleeding disorder" value={displayValue(learner.suffersBleedingDisorder)} />
        <ProfileField label="Special needs" value={displayValue(learner.specialNeeds)} />
        <ProfileField label="Medical conditions" value={displayValue(learner.medicalConditions)} />
        <ProfileField label="Health info" value={displayValue(learner.healthInfo)} />
        <ProfileField label="Dietary requirements" value={displayValue(learner.dietaryRequirements)} />
      </ProfileSection>

      <ProfileSection title="Boarding and transport">
        <ProfileField label="Boarding" value={learner.boarding ? 'Boarding' : 'Day scholar'} />
        <ProfileField label="Hostel" value={displayValue(learner.hostelName)} />
        <ProfileField label="Transport zone" value={displayValue(learner.transportZone)} />
      </ProfileSection>

      <ProfileSection title="Additional information">
        <ProfileField label="County" value={displayValue(learner.county)} />
        <ProfileField label="Sub-county" value={displayValue(learner.subCounty)} />
        <ProfileField label="Ward" value={displayValue(learner.ward)} />
        <ProfileField label="Constituency" value={displayValue(learner.constituency)} />
        <ProfileField label="UPI / NEMIS" value={displayValue(learner.upiNemisNumber)} />
        <ProfileField label="Birth certificate" value={displayValue(learner.birthCertificateNumber)} />
        <ProfileField label="Fee sponsor" value={displayValue(learner.feeSponsor)} />
        <ProfileField label="Former school" value={displayValue(learner.formerSchoolName)} />
        <ProfileField label="Transfer reason" value={displayValue(learner.reasonForTransfer)} />
        <ProfileField label="Leaving reason" value={displayValue(learner.leavingReason)} />
      </ProfileSection>
    </div>
  )
}

function contactBlock(
  first: string | null,
  last: string | null,
  phone: string | null,
  email: string | null,
): ReactNode {
  const name = [first, last].filter(Boolean).join(' ')
  if (!name && !phone && !email) return '—'
  return (
    <span className="flex flex-col">
      <span>{name || '—'}</span>
      {phone ? <span className="type-caption font-normal text-muted-foreground">{phone}</span> : null}
      {email ? <span className="type-caption font-normal text-muted-foreground">{email}</span> : null}
    </span>
  )
}
