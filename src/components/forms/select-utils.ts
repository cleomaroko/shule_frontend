export interface SelectOption {
  value: string
  label: string
}

/** Maps the empty sentinel back to an empty string for form state. */
export function fromSelectValue(value: string): string {
  return value === '__empty' ? '' : value
}

export function toSelectOptions(values: string[]): SelectOption[] {
  return values.filter(Boolean).map((value) => ({ value, label: value }))
}
