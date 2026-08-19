import { BookOpen, Bus, GraduationCap, LayoutDashboard, Settings2, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { paths } from '@/routes/paths'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: paths.app, icon: LayoutDashboard, end: true }],
  },
  {
    title: 'People',
    items: [
      { label: 'Learners', to: paths.learners, icon: GraduationCap },
      { label: 'Staff', to: paths.staff, icon: Users },
    ],
  },
  {
    title: 'School',
    items: [
      { label: 'Academics', to: paths.academics, icon: BookOpen },
      { label: 'Logistics', to: paths.logistics, icon: Bus },
    ],
  },
  {
    title: 'Admin',
    items: [{ label: 'System', to: paths.system, icon: Settings2 }],
  },
]
