import {
  BarChart3,
  Briefcase,
  BookOpen,
  Building2,
  Bus,
  CalendarCheck,
  CarFront,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  Package,
  Receipt,
  Settings2,
  Ticket,
  Truck,
  UserRound,
  Users,
  Wallet,
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
      { label: "Attendance", to: paths.attendance, icon: CalendarCheck },
      { label: "Exams", to: paths.exams, icon: ClipboardCheck },
      { label: "Schemes of work", to: paths.schemes, icon: NotebookPen },
      { label: "Forms", to: paths.forms, icon: ClipboardList },
      { label: "Tickets", to: paths.tickets, icon: Ticket },
      { label: "Projects", to: paths.projects, icon: FolderKanban },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Transport", to: paths.transport, icon: Truck },
      { label: "Vehicles", to: `${paths.transport}?tab=fleet`, icon: CarFront },
      { label: "Logistics", to: paths.logistics, icon: Bus },
      { label: "Stores", to: paths.store, icon: Warehouse },
      { label: "Assets", to: paths.assets, icon: Package },
      { label: "Requisitions", to: paths.requisitions, icon: FileText },
      { label: "Suppliers", to: paths.suppliers, icon: Building2 },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Fees", to: paths.fees, icon: Receipt },
      { label: "Finance", to: paths.finance, icon: Wallet },
    ],
  },
  {
    title: "HR",
    items: [{ label: "HR", to: paths.hr, icon: Briefcase }],
  },
  {
    title: "Admin",
    items: [
      { label: "System", to: paths.system, icon: Settings2 },
      { label: "Reports", to: paths.reports, icon: BarChart3 },
    ],
  },
];
