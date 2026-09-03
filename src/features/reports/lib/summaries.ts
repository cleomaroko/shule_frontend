export interface CountRow {
  label: string
  count: number
}

export function countBy<T>(items: T[], keyFn: (item: T) => string | null | undefined): CountRow[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const raw = keyFn(item)?.trim()
    const label = raw && raw.length > 0 ? raw : 'Not set'
    map.set(label, (map.get(label) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso(from = new Date()): string {
  return toIsoDate(from)
}

export function currentMonthRange(from = new Date()): { start: string; end: string } {
  const start = new Date(from.getFullYear(), from.getMonth(), 1)
  const end = new Date(from.getFullYear(), from.getMonth() + 1, 0)
  return { start: toIsoDate(start), end: toIsoDate(end) }
}

/** Parses backend `stayDuration` values such as `"1h 45m"`. */
export function parseStayMinutes(value: string | null | undefined): number | null {
  if (!value) return null
  const hours = /(\d+)\s*h/i.exec(value)
  const mins = /(\d+)\s*m/i.exec(value)
  if (!hours && !mins) return null
  return (hours ? Number(hours[1]) : 0) * 60 + (mins ? Number(mins[1]) : 0)
}

export function formatStayMinutes(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = Math.round(total % 60)
  if (hours <= 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function checkInHourLabel(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const hour = date.getHours()
  const next = (hour + 1) % 24
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(hour)}:00–${pad(next)}:00`
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
