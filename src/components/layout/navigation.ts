import { GraduationCap, LayoutDashboard, Users } from 'lucide-react'
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
]
