import type { UserRole } from '@/auth/auth.types'

/**
 * Capability checks derived from the actual Java controllers.
 *
 * Staff mutations (`StaffController.isAuthorized`):
 *   role equals `ROLE_SUPER_ADMIN` OR role contains `ADMIN`
 *
 * Learner mutations (`LearnerController.isAuthorized`):
 *   role contains `ADMIN` OR role contains `HEAD`
 *
 * Subject mutations (`SubjectController.isAuthorized`):
 *   role equals `ROLE_SUPER_ADMIN` OR contains `IT_ADMIN` OR `HEAD_OF_SCHOOL`
 *   OR `SECTION_HEAD`
 *
 * Teacher assignment mutations (`TeacherAssignmentController.isAuthorized`):
 *   role contains `ADMIN` OR role contains `HEAD`
 *
 * System logs / reset / email usage (`SystemController.isSuperAdmin`):
 *   role equals `ROLE_SUPER_ADMIN`
 *
 * Class, stream, zone and house POSTs have no role check in the controller but
 * require an Authorization header for audit logging. The UI still gates them.
 *
 * The backend remains the security authority — these helpers only hide UI that
 * the current session is known to be declined for.
 */
export type Capability =
  | 'staff:write'
  | 'learner:write'
  | 'academic:setup'
  | 'subject:write'
  | 'assignment:write'
  | 'system:super'

export function hasRole(role: UserRole | null | undefined, expected: string): boolean {
  if (!role) return false
  return role.toUpperCase() === expected.toUpperCase()
}

export function hasAnyRole(role: UserRole | null | undefined, expected: string[]): boolean {
  return expected.some((value) => hasRole(role, value))
}

export function roleContains(role: UserRole | null | undefined, fragment: string): boolean {
  if (!role) return false
  return role.toUpperCase().includes(fragment.toUpperCase())
}

export function can(role: UserRole | null | undefined, capability: Capability): boolean {
  switch (capability) {
    case 'staff:write':
      return hasRole(role, 'ROLE_SUPER_ADMIN') || roleContains(role, 'ADMIN')
    case 'learner:write':
      return roleContains(role, 'ADMIN') || roleContains(role, 'HEAD')
    case 'academic:setup':
      return roleContains(role, 'ADMIN') || roleContains(role, 'HEAD')
    case 'subject:write':
      return (
        hasRole(role, 'ROLE_SUPER_ADMIN') ||
        roleContains(role, 'IT_ADMIN') ||
        roleContains(role, 'HEAD_OF_SCHOOL') ||
        roleContains(role, 'SECTION_HEAD')
      )
    case 'assignment:write':
      return roleContains(role, 'ADMIN') || roleContains(role, 'HEAD')
    case 'system:super':
      return hasRole(role, 'ROLE_SUPER_ADMIN')
  }
}
