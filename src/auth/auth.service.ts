import { ApiError } from '@/api/errors'
import { authApi } from '@/auth/auth.api'
import { sessionStorageAdapter } from '@/auth/auth.storage'
import type {
  ForgotPasswordRequest,
  LoginResponseData,
  ResetPasswordRequest,
  Session,
} from '@/auth/auth.types'
import { getTokenExpiryMs, isTokenExpired } from '@/lib/jwt'
import { logger } from '@/lib/logger'

/**
 * The exact copy `AuthController.login` returns for a bad credential pair.
 * Matched so it can be replaced with product-appropriate wording while any
 * other backend message is still passed through untouched.
 */
const INVALID_CREDENTIALS_MESSAGE = 'invalid username or password'

const INVALID_CREDENTIALS_COPY =
  'Those details do not match an account. Check your username and password, then try again.'

export interface LoginParams {
  username: string
  password: string
  rememberMe: boolean
}

function isLoginResponse(value: unknown): value is LoginResponseData {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.token === 'string' &&
    candidate.token.length > 0 &&
    typeof candidate.username === 'string' &&
    typeof candidate.role === 'string'
  )
}

/**
 * Authenticates against the backend and persists the resulting session.
 *
 * Rejects with an `ApiError`; invalid-credential failures arrive as
 * `kind: 'business'` because the backend answers them with HTTP 200.
 */
async function login({ username, password, rememberMe }: LoginParams): Promise<Session> {
  try {
    const { data } = await authApi.login({ username, password })

    if (!isLoginResponse(data)) {
      throw new ApiError({
        kind: 'unknown',
        message: 'Login response missing token',
        detail: data,
      })
    }

    const session: Session = {
      token: data.token,
      user: { username: data.username, role: data.role },
      expiresAt: getTokenExpiryMs(data.token),
    }

    sessionStorageAdapter.write(session, rememberMe)
    return session
  } catch (error) {
    throw rewriteInvalidCredentials(error)
  }
}

/** Swaps the backend's terse credential message for product copy. */
function rewriteInvalidCredentials(error: unknown): unknown {
  if (
    error instanceof ApiError &&
    error.kind === 'business' &&
    error.message.trim().toLowerCase() === INVALID_CREDENTIALS_MESSAGE
  ) {
    return new ApiError({
      kind: 'business',
      message: INVALID_CREDENTIALS_COPY,
      status: error.status,
      detail: error.detail,
      cause: error,
    })
  }
  return error
}

/**
 * Rehydrates a stored session on application start.
 *
 * The backend registers no JWT filter and exposes no `/me` endpoint, so a stored
 * token cannot be verified server-side. Expiry is therefore evaluated locally
 * from the `exp` claim.
 */
function restoreSession(): Session | null {
  const session = sessionStorageAdapter.read()
  if (!session) return null

  if (isTokenExpired(session.token)) {
    logger.debug('Stored session token has expired; clearing')
    sessionStorageAdapter.clear()
    return null
  }

  return session
}

/**
 * Ends the session.
 *
 * The backend has no logout endpoint and holds no server-side session state, so
 * this is purely a client-side discard of the token.
 */
function logout(): void {
  sessionStorageAdapter.clear()
}

async function requestPasswordReset(body: ForgotPasswordRequest): Promise<string | null> {
  const { message } = await authApi.forgotPassword(body)
  return message
}

async function resetPassword(body: ResetPasswordRequest): Promise<string | null> {
  const { message } = await authApi.resetPassword(body)
  return message
}

export const authService = {
  login,
  logout,
  restoreSession,
  requestPasswordReset,
  resetPassword,
}
