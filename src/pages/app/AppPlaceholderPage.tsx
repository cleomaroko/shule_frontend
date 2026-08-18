import { ArrowUpRight, GraduationCap, Plus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { can } from '@/auth/permissions'
import { getGreetingName } from '@/auth/user-display'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLearnerList } from '@/features/learners/hooks/useLearners'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, formatPersonName, isActiveStatus } from '@/lib/format'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

interface StatCardProps {
  label: string
  value: string
  hint: string
  icon: ReactNode
  loading: boolean
}

function StatCard({ label, value, hint, icon, loading }: StatCardProps): ReactNode {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="type-caption font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="type-page-title mt-1 truncate">{value}</p>
          )}
          <p className="type-caption mt-1 text-muted-foreground">{hint}</p>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Authenticated landing dashboard. Counts and recent records come from the
 * staff and learner APIs; unimplemented ERP modules are not shown as live.
 */
export function AppPlaceholderPage(): ReactNode {
  useDocumentTitle('Dashboard')

  const { user, token } = useAuth()
  const staff = useStaffList()
  const learners = useLearnerList()

  if (!user || !token) return null

  const canWriteStaff = can(user.role, 'staff:write')
  const canWriteLearners = can(user.role, 'learner:write')
  const loading = staff.isLoading || learners.isLoading

  const learnerCount = learners.data?.length ?? 0
  const staffCount = staff.data?.length ?? 0
  const activeLearners = (learners.data ?? []).filter((item) => isActiveStatus(item.status)).length
  const activeStaff = (staff.data ?? []).filter((item) => isActiveStatus(item.status)).length

  const recent = [
    ...(learners.data ?? []).map((item) => ({
      id: `learner-${item.id}`,
      kind: 'Learner' as const,
      name: formatPersonName(item),
      date: item.dateAdded,
      to: paths.learnerDetail(item.id),
    })),
    ...(staff.data ?? []).map((item) => ({
      id: `staff-${item.id}`,
      kind: 'Staff' as const,
      name: formatPersonName(item),
      date: item.dateAdded,
      to: paths.staffDetail(item.id),
    })),
  ]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 6)

  const quickAction = canWriteLearners
    ? { to: paths.learnerNew, label: 'Enroll learner' }
    : canWriteStaff
      ? { to: paths.staffNew, label: 'Add staff' }
      : null

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="type-page-title">Dashboard</h1>
          <p className="type-body mt-1.5 max-w-2xl text-muted-foreground">
            Welcome back, {getGreetingName(user)}. Manage the people in your school from here.
          </p>
        </div>
        {quickAction ? (
          <Button asChild>
            <Link to={quickAction.to}>
              <Plus aria-hidden="true" />
              {quickAction.label}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total learners"
          value={learnerCount.toLocaleString()}
          hint={`${activeLearners.toLocaleString()} marked active`}
          icon={<GraduationCap className="size-5" aria-hidden="true" />}
          loading={loading}
        />
        <StatCard
          label="Total staff"
          value={staffCount.toLocaleString()}
          hint={`${activeStaff.toLocaleString()} marked active`}
          icon={<Users className="size-5" aria-hidden="true" />}
          loading={loading}
        />
        <StatCard
          label="Active learners"
          value={activeLearners.toLocaleString()}
          hint="Status recorded as active"
          icon={<GraduationCap className="size-5" aria-hidden="true" />}
          loading={loading}
        />
        <StatCard
          label="Active staff"
          value={activeStaff.toLocaleString()}
          hint="Status recorded as active"
          icon={<Users className="size-5" aria-hidden="true" />}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <Card className="rounded-xl">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="type-section-title">Modules</CardTitle>
            <p className="type-caption text-muted-foreground">Implemented records in this workspace</p>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 pt-3 sm:grid-cols-2">
            <ModuleLink
              to={paths.learners}
              title="Learners"
              description="Student records and enrolment information"
              icon={<GraduationCap className="size-5" aria-hidden="true" />}
              tone="navy"
            />
            <ModuleLink
              to={paths.staff}
              title="Staff"
              description="Staff records and employment information"
              icon={<Users className="size-5" aria-hidden="true" />}
              tone="green"
            />
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="type-section-title">Recent records</CardTitle>
            <p className="type-caption text-muted-foreground">Newest staff and learner entries</p>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            {loading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recent.length === 0 ? (
              <p className="type-caption px-2 py-8 text-center text-muted-foreground">
                No staff or learner records yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.to}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="type-label truncate">{item.name}</p>
                        <p className="type-caption text-muted-foreground">
                          {item.kind}
                          {item.date ? ` · ${formatDate(item.date)}` : ''}
                        </p>
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ModuleLink({
  to,
  title,
  description,
  icon,
  tone,
}: {
  to: string
  title: string
  description: string
  icon: ReactNode
  tone: 'navy' | 'green'
}): ReactNode {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/30 hover:bg-card"
    >
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl',
          tone === 'navy'
            ? 'bg-navy-800/10 text-navy-800 dark:bg-sky-400/10 dark:text-sky-400'
            : 'bg-primary/10 text-primary',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="type-heading flex items-center gap-1">
          {title}
          <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="type-caption mt-0.5 block text-muted-foreground">{description}</span>
      </span>
    </Link>
  )
}
