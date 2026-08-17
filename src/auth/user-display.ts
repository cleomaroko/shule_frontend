import type { AuthenticatedUser, UserRole } from '@/auth/auth.types'

/**
 * Presentation helpers for the limited user data the backend returns at sign-in
 * (username and role only — there is no profile endpoint).
 */

/**
 * Turns a Spring-style authority into a readable label,
 * e.g. `ROLE_SUPER_ADMIN` → `Super Admin`.
 */
export function formatRoleLabel(role: UserRole): string {
  const cleaned = role.replace(/^ROLE_/i, '').replace(/[_-]+/g, ' ').trim()
  if (!cleaned) return 'Member'

  return cleaned
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Derives up to two initials for the avatar fallback. Handles usernames with
 * separators (`jane.doe` → `JD`) as well as single tokens (`mgaschool` → `MG`).
 */
export function getUserInitials(user: AuthenticatedUser): string {
  const tokens = user.username.split(/[\s._@-]+/).filter(Boolean)

  if (tokens.length === 0) return '?'
  if (tokens.length === 1) return tokens[0]!.slice(0, 2).toUpperCase()

  return `${tokens[0]!.charAt(0)}${tokens[1]!.charAt(0)}`.toUpperCase()
}
