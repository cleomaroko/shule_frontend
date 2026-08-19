export function formatPersonName(parts: {
  firstName?: string | null
  secondName?: string | null
  middleName?: string | null
  lastName?: string | null
}): string {
  const name = [parts.firstName, parts.secondName ?? parts.middleName, parts.lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ')

  return name || 'Unnamed'
}

export function getInitials(parts: { firstName?: string | null; lastName?: string | null; fallback?: string }): string {
  const first = parts.firstName?.trim().charAt(0)
  const last = parts.lastName?.trim().charAt(0)
  const combined = `${first ?? ''}${last ?? ''}`.toUpperCase()
  if (combined) return combined
  return (parts.fallback ?? '?').slice(0, 2).toUpperCase()
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function formatClassLabel(parts: {
  section?: string | null
  className?: string | null
}): string {
  const label = [parts.section, parts.className]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' · ')
  return label || 'Unnamed class'
}

export function formatYear(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return String(date.getFullYear())
}

export function displayValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

export function isActiveStatus(status: string | null | undefined): boolean {
  if (!status) return false
  const normalised = status.trim().toLowerCase()
  return normalised === 'active' || normalised === 'yes'
}
