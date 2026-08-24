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

/** Keys returned by `GET /api/system/analytics` usage maps. */
export const ANALYTICS_MODULES = ['Learners', 'Staff', 'Assets', 'Stores', 'Academics'] as const

export type AnalyticsModule = (typeof ANALYTICS_MODULES)[number]

export interface SystemAnalytics {
  totalActions: number
  usageBreakdown: Record<string, number>
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
  Other: '#94a3b8',
}

function asNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function analyticsSlices(data: SystemAnalytics | null | undefined): AnalyticsSlice[] {
  if (!data) return []
  const total = asNumber(data.totalActions)
  if (total <= 0) return []

  const counts = data.activityCounts ?? {}
  const rows: AnalyticsSlice[] = ANALYTICS_MODULES.map((name) => {
    const count = asNumber(counts[name])
    return {
      name,
      count,
      percent: (count * 100) / total,
      color: MODULE_COLORS[name] ?? '#94a3b8',
    }
  })

  const classified = rows.reduce((sum, row) => sum + row.count, 0)
  const other = Math.max(0, total - classified)
  if (other > 0) {
    rows.push({
      name: 'Other',
      count: other,
      percent: (other * 100) / total,
      color: '#94a3b8',
    })
  }

  return rows.filter((row) => row.count > 0)
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}
