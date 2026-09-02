import type { SelectOption } from '@/components/forms/select-utils'
import { formatClassLabel } from '@/lib/format'
import type {
  Campus,
  HouseOption,
  NamedLookup,
  SchoolClassOption,
  StreamOption,
  ZoneOption,
} from '@/features/lookups/lookups.types'

type ExistingLookup = string | Array<string | null | undefined> | null | undefined

/** Keep a saved name in the list when editing a record whose value is no longer in the lookup. */
export function withExistingSelectOption(options: SelectOption[], existing?: ExistingLookup): SelectOption[] {
  const extras = (Array.isArray(existing) ? existing : [existing])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
  let next = options
  for (const value of extras) {
    if (next.some((item) => item.value === value)) continue
    next = [{ value, label: value }, ...next]
  }
  return next
}

export function namedLookupOptions(items: NamedLookup[] | undefined, existing?: ExistingLookup): SelectOption[] {
  const options = (items ?? [])
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name))
    .map((name) => ({ value: name, label: name }))
  return withExistingSelectOption(options, existing)
}

export function campusLookupOptions(items: Campus[] | undefined, existing?: ExistingLookup): SelectOption[] {
  const options = (items ?? [])
    .filter((item) => item.name?.trim())
    .map((item) => ({
      value: item.name,
      label: item.location?.trim() ? `${item.name} · ${item.location}` : item.name,
    }))
  return withExistingSelectOption(options, existing)
}

/** Store `className` on the learner; show section in the label. */
export function classLookupOptions(items: SchoolClassOption[] | undefined, existing?: ExistingLookup): SelectOption[] {
  const seen = new Set<string>()
  const options: SelectOption[] = []
  for (const item of items ?? []) {
    const value = item.className?.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    options.push({ value, label: formatClassLabel(item) })
  }
  return withExistingSelectOption(options, existing)
}

export function streamLookupOptions(items: StreamOption[] | undefined, existing?: ExistingLookup): SelectOption[] {
  const options = (items ?? [])
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name))
    .map((name) => ({ value: name, label: name }))
  return withExistingSelectOption(options, existing)
}

export function houseLookupOptions(items: HouseOption[] | undefined, existing?: ExistingLookup): SelectOption[] {
  const options = (items ?? [])
    .map((item) => item.houseName?.trim())
    .filter((name): name is string => Boolean(name))
    .map((name) => ({ value: name, label: name }))
  return withExistingSelectOption(options, existing)
}

export function zoneLookupOptions(items: ZoneOption[] | undefined, existing?: ExistingLookup): SelectOption[] {
  const options = (items ?? [])
    .map((item) => item.zoneName?.trim())
    .filter((name): name is string => Boolean(name))
    .map((name) => ({ value: name, label: name }))
  return withExistingSelectOption(options, existing)
}

export function emptyLookupMessage(noun: string, where: string): string {
  return `No ${noun} available. Add them under ${where}.`
}
