/**
 * Envelope returned by every endpoint on the Spring Boot backend
 * (`com.lyrt.shule.common.ApiResponse`).
 *
 * Important: the backend answers business failures with HTTP 200 and
 * `success: false`, so callers must branch on `success` rather than the status
 * code. See `unwrapEnvelope` in `api/client.ts`.
 */
export interface ApiEnvelope<T> {
  success: boolean
  message: string | null
  data: T | null
}

/** A successful, unwrapped response: the curated message plus its payload. */
export interface ApiResult<T> {
  message: string | null
  data: T
}
