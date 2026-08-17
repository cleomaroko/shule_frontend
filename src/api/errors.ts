/**
 * How a request failed. Callers branch on this instead of parsing messages.
 *
 * - `business`   the request reached the backend and it declined it
 *                (`success: false`); `message` is backend-authored and safe to show.
 * - `offline`    the browser reports no connectivity.
 * - `network`    the request never produced a response (backend down, DNS, CORS).
 * - `timeout`    the request was aborted before the backend answered.
 * - `unauthorized` the backend rejected the credentials/token (401/403).
 * - `notFound`   the endpoint does not exist (404).
 * - `server`     the backend raised an unhandled error (5xx).
 * - `unknown`    anything else, including malformed response bodies.
 */
export type ApiErrorKind =
  | 'business'
  | 'offline'
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'notFound'
  | 'server'
  | 'unknown'

interface ApiErrorOptions {
  kind: ApiErrorKind
  message: string
  status?: number | undefined
  /** Technical detail for logs only — never rendered to users. */
  detail?: unknown
  cause?: unknown
}

/**
 * Normalised transport-agnostic error. Every failure surfaced by the API layer
 * is an `ApiError`, so UI code never has to inspect Axios internals.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined
  readonly detail: unknown

  constructor({ kind, message, status, detail, cause }: ApiErrorOptions) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.detail = detail
  }

  /** True when the backend itself declined the request with a curated message. */
  get isBusinessError(): boolean {
    return this.kind === 'business'
  }

  /** True when the backend could not be reached at all. */
  get isConnectivityError(): boolean {
    return this.kind === 'offline' || this.kind === 'network' || this.kind === 'timeout'
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * User-facing copy for non-business failures. Raw exception text from the
 * backend or Axios is deliberately never shown.
 */
export const GENERIC_ERROR_MESSAGES: Record<Exclude<ApiErrorKind, 'business'>, string> = {
  offline: 'You appear to be offline. Check your connection and try again.',
  network: 'We could not reach the Dira server. Please try again in a moment.',
  timeout: 'The request took too long to complete. Please try again.',
  unauthorized: 'Your session has expired. Please sign in again.',
  notFound: 'That feature is unavailable right now. Please contact your administrator.',
  server: 'Something went wrong on our end. Please try again shortly.',
  unknown: 'Something unexpected happened. Please try again.',
}

/**
 * Resolves the message that may safely be rendered for any thrown value.
 */
export function toUserMessage(error: unknown): string {
  if (!isApiError(error)) return GENERIC_ERROR_MESSAGES.unknown
  if (error.kind === 'business') return error.message || GENERIC_ERROR_MESSAGES.unknown
  return GENERIC_ERROR_MESSAGES[error.kind]
}
