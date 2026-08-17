/**
 * Types mirroring the backend authentication contract exactly.
 * Source: `com.lyrt.shule.auth.AuthController`.
 */

/**
 * Role string as persisted on `users.role`. The backend stores this as a free
 * -form column (seeded with `ROLE_SUPER_ADMIN`) and does *not* encode it into the
 * JWT, so it is kept as a plain string rather than a speculative union.
 */
export type UserRole = string

/** The only user information the backend discloses at sign-in. */
export interface AuthenticatedUser {
  username: string
  role: UserRole
}

/** `data` payload of a successful `POST /api/auth/login`. */
export interface LoginResponseData {
  token: string
  role: UserRole
  username: string
}

/** Request body for `POST /api/auth/login`. */
export interface LoginRequest {
  username: string
  password: string
}

/** Request body for `POST /api/auth/forgot-password`. */
export interface ForgotPasswordRequest {
  email: string
}

/**
 * Request body for `POST /api/auth/reset-password`.
 *
 * `confirmPassword` is required: the controller compares it against
 * `newPassword` before doing anything else, so omitting it fails the request.
 */
export interface ResetPasswordRequest {
  email: string
  code: string
  newPassword: string
  confirmPassword: string
}

/** A persisted, client-side session. */
export interface Session {
  token: string
  user: AuthenticatedUser
  /** Absolute expiry from the JWT `exp` claim, or `null` if unbounded. */
  expiresAt: number | null
}

export type AuthStatus = 'initialising' | 'authenticated' | 'unauthenticated'

/** Why a session ended — drives the message shown on the login screen. */
export type LogoutReason = 'user' | 'expired'
