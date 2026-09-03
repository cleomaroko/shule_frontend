import { useMemo, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { ErrorState } from '@/components/feedback/PageStates'
import { usePendingLeads } from '@/features/admissions/hooks/useAdmissions'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { countBy } from '@/features/reports/lib/summaries'
import { useLearnerList } from '@/features/learners/hooks/useLearners'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { isActiveStatus } from '@/lib/format'

export function PeopleReportsPanel(): ReactNode {
  const learners = useLearnerList()
  const staff = useStaffList()
  const leads = usePendingLeads()

  const learnerRows = learners.data ?? []
  const staffRows = staff.data ?? []
  const leadRows = leads.data ?? []

  const learnerStats = useMemo(() => {
    const active = learnerRows.filter((row) => isActiveStatus(row.status)).length
    const boarding = learnerRows.filter((row) => row.boarding === true).length
    return [
      { label: 'Learners', value: learnerRows.length.toLocaleString(), hint: `${active.toLocaleString()} marked active` },
      { label: 'Boarding', value: boarding.toLocaleString(), hint: 'From the boarding flag on each record' },
      { label: 'Day', value: (learnerRows.length - boarding).toLocaleString(), hint: 'Not marked as boarding' },
    ]
  }, [learnerRows])

  const staffStats = useMemo(() => {
    const active = staffRows.filter((row) => isActiveStatus(row.status)).length
    return [
      { label: 'Staff', value: staffRows.length.toLocaleString(), hint: `${active.toLocaleString()} marked active` },
    ]
  }, [staffRows])

  if (learners.isError) {
    return <ErrorState message={toUserMessage(learners.error)} onRetry={() => void learners.refetch()} />
  }
  if (staff.isError) {
    return <ErrorState message={toUserMessage(staff.error)} onRetry={() => void staff.refetch()} />
  }

  return (
    <div className="flex flex-col gap-8">
      <ReportSection
        title="Learners"
        note="Summary of GET /api/learners. There is no separate learner report endpoint."
      >
        <StatGrid items={learnerStats} loading={learners.isLoading} />
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="By class"
            rows={countBy(learnerRows, (row) => row.currentClass)}
            empty="No learner records yet."
            loading={learners.isLoading}
          />
          <BreakdownCard
            title="By status"
            rows={countBy(learnerRows, (row) => row.status)}
            empty="No learner records yet."
            loading={learners.isLoading}
          />
          <BreakdownCard
            title="By gender"
            rows={countBy(learnerRows, (row) => row.gender)}
            empty="No learner records yet."
            loading={learners.isLoading}
          />
          <BreakdownCard
            title="By transport zone"
            rows={countBy(learnerRows, (row) => row.transportZone)}
            empty="No learner records yet."
            loading={learners.isLoading}
          />
          <BreakdownCard
            title="By hostel"
            rows={countBy(learnerRows, (row) => row.hostelName)}
            empty="No learner records yet."
            loading={learners.isLoading}
          />
        </div>
      </ReportSection>

      <ReportSection title="Staff" note="Summary of GET /api/staff. There is no separate staff report endpoint.">
        <StatGrid items={staffStats} loading={staff.isLoading} />
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard
            title="By department"
            rows={countBy(staffRows, (row) => row.department)}
            empty="No staff records yet."
            loading={staff.isLoading}
          />
          <BreakdownCard
            title="By status"
            rows={countBy(staffRows, (row) => row.status)}
            empty="No staff records yet."
            loading={staff.isLoading}
          />
          <BreakdownCard
            title="By profession"
            rows={countBy(staffRows, (row) => row.profession)}
            empty="No staff records yet."
            loading={staff.isLoading}
          />
        </div>
      </ReportSection>

      <ReportSection
        title="Pending admissions"
        note="GET /api/admissions/list returns only unprocessed website applications."
      >
        {leads.isError ? (
          <ErrorState message={toUserMessage(leads.error)} onRetry={() => void leads.refetch()} />
        ) : (
          <>
            <StatGrid
              items={[
                {
                  label: 'Pending applications',
                  value: leadRows.length.toLocaleString(),
                  hint: 'Processed leads are not returned by this endpoint',
                },
              ]}
              loading={leads.isLoading}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <BreakdownCard
                title="By campus"
                rows={countBy(leadRows, (row) => row.campus)}
                empty="No pending applications."
                loading={leads.isLoading}
              />
              <BreakdownCard
                title="By class applied"
                rows={countBy(leadRows, (row) => row.classApplied)}
                empty="No pending applications."
                loading={leads.isLoading}
              />
              <BreakdownCard
                title="By source"
                rows={countBy(leadRows, (row) => row.source)}
                empty="No pending applications."
                loading={leads.isLoading}
              />
            </div>
          </>
        )}
      </ReportSection>
    </div>
  )
}
