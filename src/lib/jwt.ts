import { logger } from '@/lib/logger'

/**
 * Claims issued by the backend's `JwtUtils.generateToken`, which signs only
 * `sub` (username), `iat` and `exp`. Notably the role is *not* a claim — it is
 * returned alongside the token in the login response body.
 */
export interface JwtPayload {
  sub?: string
  iat?: number
  exp?: number
}

function decodeBase64Url(segment: string): string {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='))

  // Recover multi-byte UTF-8 characters that atob leaves as raw bytes.
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Reads the claims out of a JWT without verifying its signature.
 *
 * Verification is the backend's responsibility; this is used purely to avoid
 * presenting an authenticated UI with a token that has already expired.
 */
export function decodeJwt(token: string): JwtPayload | null {
  const payloadSegment = token.split('.')[1]
  if (!payloadSegment) return null

  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(payloadSegment))
    if (typeof parsed !== 'object' || parsed === null) return null
    return parsed as JwtPayload
  } catch (error) {
    logger.warn('Failed to decode JWT payload', error)
    return null
  }
}

/** Absolute expiry time in milliseconds, or `null` when the token has no `exp`. */
export function getTokenExpiryMs(token: string): number | null {
  const exp = decodeJwt(token)?.exp
  return typeof exp === 'number' ? exp * 1000 : null
}

/**
 * A small skew keeps the client from trusting a token that will lapse in-flight.
 */
const EXPIRY_SKEW_MS = 30_000

export function isTokenExpired(token: string, skewMs: number = EXPIRY_SKEW_MS): boolean {
  const expiryMs = getTokenExpiryMs(token)

  // A token without an `exp` claim cannot be evaluated; treat it as usable and
  // let the backend reject it.
  if (expiryMs === null) return false

  return Date.now() + skewMs >= expiryMs
}
