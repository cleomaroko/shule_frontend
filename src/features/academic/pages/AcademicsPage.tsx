import { useSearchParams } from 'react-router-dom'
import type { ReactNode } from 'react'

import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/feedback/PageStates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssignmentsPanel } from '@/features/academic/components/AssignmentsPanel'
import { ClassesPanel } from '@/features/academic/components/ClassesPanel'
import { LearningAreasPanel } from '@/features/academic/components/LearningAreasPanel'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TABS = ['classes', 'learning-areas', 'assignments'] as const
type AcademicTab = (typeof TABS)[number]

function isTab(value: string | null): value is AcademicTab {
  return TABS.some((tab) => tab === value)
}

export function AcademicsPage(): ReactNode {
  useDocumentTitle('Academics')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const rawTab = params.get('tab')
  const tab: AcademicTab = isTab(rawTab) ? rawTab : 'classes'

  const canSetup = can(user?.role, 'academic:setup')
  const canSubjects = can(user?.role, 'subject:write')
  const canAssign = can(user?.role, 'assignment:write')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Academics"
        description="Configure classes, learning areas, and teaching assignments."
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setParams({ tab: value }, { replace: true })}
      >
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="learning-areas">Learning areas</TabsTrigger>
          <TabsTrigger value="assignments">Teacher assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="classes">
          <ClassesPanel canWrite={canSetup} />
        </TabsContent>
        <TabsContent value="learning-areas">
          <LearningAreasPanel canWrite={canSubjects} />
        </TabsContent>
        <TabsContent value="assignments">
          <AssignmentsPanel canWrite={canAssign} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
