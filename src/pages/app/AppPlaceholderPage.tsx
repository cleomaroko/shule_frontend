import { ArrowUpRight, BarChart3, BookOpen, Building2, Bus, ClipboardList, GraduationCap, Package, Plus, Settings2, Truck, UserRound, Users, Warehouse } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { can } from '@/auth/permissions'
import { getGreetingName } from '@/auth/user-display'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAssetList } from '@/features/assets/hooks/useAssets'
import { useLearnerList } from '@/features/learners/hooks/useLearners'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { useVehicleList } from '@/features/transport/hooks/useTransport'
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
  const assets = useAssetList()
  const fleet = useVehicleList()

  if (!user || !token) return null

  const canWriteStaff = can(user.role, 'staff:write')
  const canWriteLearners = can(user.role, 'learner:write')
  const loading = staff.isLoading || learners.isLoading
  const assetsLoading = assets.isLoading

  const learnerCount = learners.data?.length ?? 0
  const staffCount = staff.data?.length ?? 0
  const assetCount = assets.data?.length ?? 0
  const fleetCount = fleet.data?.length ?? 0
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
            Welcome back, {getGreetingName(user)}. Manage people, academics, and school setup from here.
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
          label="Assets"
          value={assetCount.toLocaleString()}
          hint="Registered inventory items"
          icon={<Package className="size-5" aria-hidden="true" />}
          loading={assetsLoading}
        />
        <StatCard
          label="Fleet"
          value={fleetCount.toLocaleString()}
          hint="Registered school vehicles"
          icon={<Truck className="size-5" aria-hidden="true" />}
          loading={fleet.isLoading}
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
              to={paths.admissions}
              title="Admissions"
              description="Pending website applications"
              icon={<ClipboardList className="size-5" aria-hidden="true" />}
              tone="amber"
            />
            <ModuleLink
              to={paths.learners}
              title="Learners"
              description="Student records and enrolment information"
              icon={<GraduationCap className="size-5" aria-hidden="true" />}
              tone="green"
            />
            <ModuleLink
              to={paths.visitors}
              title="Visitors"
              description="Check-in, check-out, and stay duration"
              icon={<UserRound className="size-5" aria-hidden="true" />}
              tone="teal"
            />
            <ModuleLink
              to={paths.staff}
              title="Staff"
              description="Staff records and employment information"
              icon={<Users className="size-5" aria-hidden="true" />}
              tone="navy"
            />
            <ModuleLink
              to={paths.academics}
              title="Academics"
              description="Classes, learning areas, and teacher assignments"
              icon={<BookOpen className="size-5" aria-hidden="true" />}
              tone="violet"
            />
            <ModuleLink
              to={paths.logistics}
              title="Logistics"
              description="Transport zones and boarding houses"
              icon={<Bus className="size-5" aria-hidden="true" />}
              tone="sky"
            />
            <ModuleLink
              to={paths.transport}
              title="Transport"
              description="Fleet, learner register, hires, and fuel logs"
              icon={<Truck className="size-5" aria-hidden="true" />}
              tone="orange"
            />
            <ModuleLink
              to={paths.assets}
              title="Asset Management"
              description="Inventory with descriptions, conditions, and suppliers"
              icon={<Package className="size-5" aria-hidden="true" />}
              tone="blue"
            />
            <ModuleLink
              to={paths.store}
              title="Store Management"
              description="Locations, transfers, consumption, and weekly sheets"
              icon={<Warehouse className="size-5" aria-hidden="true" />}
              tone="rose"
            />
            <ModuleLink
              to={paths.suppliers}
              title="Suppliers"
              description="Vendors and contract expiry tracking"
              icon={<Building2 className="size-5" aria-hidden="true" />}
              tone="indigo"
            />
            <ModuleLink
              to={paths.system}
              title="System"
              description="Audit logs, campuses, and reference lists"
              icon={<Settings2 className="size-5" aria-hidden="true" />}
              tone="slate"
            />
            <ModuleLink
              to={paths.reports}
              title="Reports and analysis"
              description="Department summaries from existing records and report APIs"
              icon={<BarChart3 className="size-5" aria-hidden="true" />}
              tone="emerald"
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

const MODULE_TONES = {
  green: 'bg-primary/15 text-primary dark:bg-emerald-400/15 dark:text-emerald-300',
  emerald: 'bg-emerald-600/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  navy: 'bg-navy-800/15 text-navy-800 dark:bg-sky-400/15 dark:text-sky-300',
  sky: 'bg-sky-500/15 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
  blue: 'bg-blue-500/15 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  indigo: 'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
  violet: 'bg-violet-500/15 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
  teal: 'bg-teal-500/15 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
  amber: 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  orange: 'bg-orange-500/15 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300',
  rose: 'bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  slate: 'bg-slate-500/15 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300',
} as const

type ModuleTone = keyof typeof MODULE_TONES

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
  tone: ModuleTone
}): ReactNode {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/30 hover:bg-card"
    >
      <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', MODULE_TONES[tone])}>
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
