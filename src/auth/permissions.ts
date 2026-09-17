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
 * Asset mutations (`AssetController.isAuthorized`):
 *   role contains `ADMIN` OR `PROCUREMENT` OR `IT`
 *
 * Transport mutations (`TransportController.isAuthorized`):
 *   role contains `ADMIN` OR role contains `OPERATOR`
 *   POST /hires, POST/DELETE /assignments, and POST /logs require an
 *   Authorization header for audit logging but have no role check. The UI
 *   still gates them with `transport:write`.
 *
 * Store mutations (`StoreController.isAuthorized`):
 *   role contains `ADMIN` OR `MANAGER` OR `OPERATOR`
 *
 * Supplier and visitor writes require an Authorization header for audit
 * logging but have no role check. The UI still gates them.
 *
 * System logs / reset / email usage (`SystemController.isSuperAdmin`):
 *   role equals `ROLE_SUPER_ADMIN`
 *
 * System analytics (`SystemController.isITOrSuperAdmin`):
 *   role equals `ROLE_SUPER_ADMIN` OR contains `IT_ADMIN` OR `IT_OFFICER`
 *
 * Academic year/term mutations (`AcademicController.isAuthorized`):
 *   role contains `ADMIN` OR role contains `HEAD`. No DELETE in the controller.
 *
 * Staff role mutations (`LookupController`): no role check; Authorization is
 * used for audit logging. GET `/lookups/roles` returns a raw array.
 *
 * Class, stream, zone and house POSTs have no role check in the controller but
 * require an Authorization header for audit logging. The UI still gates them.
 *
 * Requisition writes (`RequisitionController`) have no role check. Create,
 * review, approve, receive, reject, and cost-center mutations require an
 * Authorization header so the controller can resolve staff via workEmail and
 * write audit logs. The UI still gates workflow and settings actions.
 *
 * Attendance writes (`AttendanceController`) have no role check. Mark,
 * session, and activity mutations require an Authorization header for
 * `recordedBy` / audit logs. The UI still gates register and lookup edits.
 *
 * Scheme of Work uploads (`SchemeOfWorkController`) have no role check. The
 * controller comments that only teachers should upload; the UI hides the form
 * from other roles. GET `/sow/report` is unauthenticated in the controller.
 *
 * Exam mark, type, and config writes (`ExamController`, `ExamTypeController`)
 * require an Authorization header for audit logging and have no role check.
 * Grading GET/POST/PUT/DELETE (`GradingScaleController`) have no Authorization
 * parameter. The UI still gates marks vs setup.
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
  | 'asset:write'
  | 'store:write'
  | 'transport:write'
  | 'supplier:write'
  | 'visitor:write'
  | 'admissions:write'
  | 'requisition:create'
  | 'requisition:review'
  | 'requisition:approve'
  | 'requisition:receive'
  | 'requisition:settings'
  | 'attendance:write'
  | 'attendance:settings'
  | 'sow:upload'
  | 'exam:write'
  | 'exam:setup'
  | 'system:super'
  | 'system:analytics'

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
    case 'asset:write':
      return (
        roleContains(role, 'ADMIN') ||
        roleContains(role, 'PROCUREMENT') ||
        roleContains(role, 'IT')
      )
    case 'store:write':
      return (
        roleContains(role, 'ADMIN') ||
        roleContains(role, 'MANAGER') ||
        roleContains(role, 'OPERATOR')
      )
    case 'transport:write':
      return roleContains(role, 'ADMIN') || roleContains(role, 'OPERATOR')
    case 'supplier:write':
      return (
        roleContains(role, 'ADMIN') ||
        roleContains(role, 'PROCUREMENT') ||
        roleContains(role, 'MANAGER')
      )
    case 'visitor:write':
      return roleContains(role, 'ADMIN') || roleContains(role, 'OPERATOR') || roleContains(role, 'HEAD')
    case 'admissions:write':
      return roleContains(role, 'ADMIN') || roleContains(role, 'HEAD')
    case 'requisition:create':
      return Boolean(role)
    case 'requisition:review':
      return roleContains(role, 'ADMIN') || roleContains(role, 'HEAD') || roleContains(role, 'DEAN')
    case 'requisition:approve':
      return (
        roleContains(role, 'ADMIN') ||
        roleContains(role, 'HEAD_OF_SCHOOL') ||
        roleContains(role, 'FINANCE')
      )
    case 'requisition:receive':
      return roleContains(role, 'ADMIN') || roleContains(role, 'OPERATOR') || roleContains(role, 'HEAD')
    case 'requisition:settings':
      return roleContains(role, 'ADMIN')
    case 'attendance:write':
      return (
        roleContains(role, 'ADMIN') ||
        roleContains(role, 'HEAD') ||
        roleContains(role, 'TEACHER') ||
        roleContains(role, 'OPERATOR')
      )
    case 'attendance:settings':
      return roleContains(role, 'ADMIN') || roleContains(role, 'HEAD')
    case 'sow:upload':
      return roleContains(role, 'TEACHER') || roleContains(role, 'ADMIN') || roleContains(role, 'HEAD')
    case 'exam:write':
      return roleContains(role, 'ADMIN') || roleContains(role, 'HEAD') || roleContains(role, 'TEACHER')
    case 'exam:setup':
      return roleContains(role, 'ADMIN') || roleContains(role, 'HEAD')
    case 'system:super':
      return hasRole(role, 'ROLE_SUPER_ADMIN')
    case 'system:analytics':
      return (
        hasRole(role, 'ROLE_SUPER_ADMIN') ||
        roleContains(role, 'IT_ADMIN') ||
        roleContains(role, 'IT_OFFICER')
      )
  }
}
