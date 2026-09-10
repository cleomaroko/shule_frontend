import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { EmptyState, PageHeader } from '@/components/feedback/PageStates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AcademicReportsPanel } from '@/features/reports/components/AcademicReportsPanel'
import { AssetReportsPanel } from '@/features/reports/components/AssetReportsPanel'
import { PeopleReportsPanel } from '@/features/reports/components/PeopleReportsPanel'
import { StoreReportsPanel } from '@/features/reports/components/StoreReportsPanel'
import { RequisitionReportsPanel } from '@/features/reports/components/RequisitionReportsPanel'
import { SupplierReportsPanel } from '@/features/reports/components/SupplierReportsPanel'
import { TransportReportsPanel } from '@/features/reports/components/TransportReportsPanel'
import { UsageReportsPanel } from '@/features/reports/components/UsageReportsPanel'
import { VisitorReportsPanel } from '@/features/reports/components/VisitorReportsPanel'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const REPORT_TABS = [
  'people',
  'academics',
  'visitors',
  'assets',
  'stores',
  'requisitions',
  'transport',
  'suppliers',
  'usage',
] as const

type ReportTab = (typeof REPORT_TABS)[number]

function tabFromParam(value: string | null, canUsage: boolean): ReportTab {
  if (value && REPORT_TABS.includes(value as ReportTab)) {
    if (value === 'usage' && !canUsage) return 'people'
    return value as ReportTab
  }
  return 'people'
}

export function ReportsPage(): ReactNode {
  useDocumentTitle('Reports and analysis')
  const { user } = useAuth()
  const canUsage = can(user?.role, 'system:analytics') || can(user?.role, 'system:super')
  const [params, setParams] = useSearchParams()
  const tab = tabFromParam(params.get('tab'), canUsage)

  if (!user) {
    return (
      <EmptyState title="Sign in required" description="Reports are available after you sign in." />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports and analysis"
        description="Department summaries from existing records. Dedicated report APIs are used where they exist (store stock-take, requisition summary, asset search, transport logs, and system usage). Other tabs summarise the same list endpoints as each module."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          {canUsage ? <TabsTrigger value="usage">Usage</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="people">
          <PeopleReportsPanel />
        </TabsContent>
        <TabsContent value="academics">
          <AcademicReportsPanel />
        </TabsContent>
        <TabsContent value="visitors">
          <VisitorReportsPanel />
        </TabsContent>
        <TabsContent value="assets">
          <AssetReportsPanel />
        </TabsContent>
        <TabsContent value="stores">
          <StoreReportsPanel />
        </TabsContent>
        <TabsContent value="requisitions">
          <RequisitionReportsPanel />
        </TabsContent>
        <TabsContent value="transport">
          <TransportReportsPanel />
        </TabsContent>
        <TabsContent value="suppliers">
          <SupplierReportsPanel />
        </TabsContent>
        {canUsage ? (
          <TabsContent value="usage">
            <UsageReportsPanel />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
