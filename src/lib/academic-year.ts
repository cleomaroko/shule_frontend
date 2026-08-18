/**
 * Calendar-based academic year label for the shell footer.
 *
 * The backend does not expose a school-year setting, so this is derived from
 * the current date (January start, shown as `YYYY/YYYY+1`).
 */
export function formatAcademicYear(date = new Date()): string {
  const year = date.getFullYear()
  return `${year}/${year + 1}`
}
