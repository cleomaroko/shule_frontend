export interface SystemLog {
  id: number
  username: string | null
  action: string | null
  details: string | null
  timestamp: string | null
}

export interface EmailUsage {
  sentToday: number
  dailyLimit: number
  remaining: number
}

/** `GET /api/system/analytics`. Module names are whatever keys `activityCounts` contains. */
export interface SystemAnalytics {
  totalActions: number
  activityCounts: Record<string, number>
}

export interface AnalyticsSlice {
  name: string
  count: number
  percent: number
  color: string
}

const MODULE_COLORS: Record<string, string> = {
  Learners: '#0e1f3d',
  Staff: '#23916b',
  Assets: '#3b82f6',
  Stores: '#b54708',
  Academics: '#7c3aed',
  Attendance: '#0f766e',
  Exams: '#4f46e5',
  Finance: '#047857',
  Ticketing: '#c2410c',
  Projects: '#0369a1',
}

/** Stable colors for modules the controller adds later, such as Sports. */
const EXTRA_COLORS = ['#db2777', '#0891b2', '#ca8a04', '#65a30d', '#9333ea', '#e11d48', '#0284c7', '#d97706']

function colorForModule(name: string): string {
  const known = MODULE_COLORS[name]
  if (known) return known
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0
  }
  return EXTRA_COLORS[hash % EXTRA_COLORS.length] ?? '#64748b'
}

function asNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** One slice per `activityCounts` key, in payload order. New keys appear without a frontend change. */
export function analyticsSlices(data: SystemAnalytics | null | undefined): AnalyticsSlice[] {
  if (!data?.activityCounts) return []
  const rows = Object.entries(data.activityCounts).map(([name, value]) => ({
    name,
    count: asNumber(value),
  }))
  if (rows.length === 0) return []
  const classified = rows.reduce((sum, row) => sum + row.count, 0)
  return rows.map((row) => ({
    name: row.name,
    count: row.count,
    percent: classified > 0 ? (row.count * 100) / classified : 0,
    color: colorForModule(row.name),
  }))
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}
