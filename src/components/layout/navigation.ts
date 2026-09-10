import {
  BarChart3,
  BookOpen,
  Building2,
  Bus,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Package,
  Settings2,
  Truck,
  UserRound,
  Users,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { paths } from "@/routes/paths";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", to: paths.app, icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Learners", to: paths.learners, icon: GraduationCap },
      { label: "Staff", to: paths.staff, icon: Users },
      { label: "Admissions", to: paths.admissions, icon: ClipboardList },
      { label: "Visitors", to: paths.visitors, icon: UserRound },
    ],
  },
  {
    title: "School",
    items: [
      { label: "Academics", to: paths.academics, icon: BookOpen },
      { label: "Logistics", to: paths.logistics, icon: Bus },
      { label: "Transport", to: paths.transport, icon: Truck },
      { label: "Assets", to: paths.assets, icon: Package },
      { label: "Stores", to: paths.store, icon: Warehouse },
      { label: "Requisitions", to: paths.requisitions, icon: FileText },
      { label: "Suppliers", to: paths.suppliers, icon: Building2 },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "System", to: paths.system, icon: Settings2 },
      { label: "Reports", to: paths.reports, icon: BarChart3 },
    ],
  },
];
