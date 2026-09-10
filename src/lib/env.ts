/**
 * Single source of truth for build-time configuration.
 *
 * Every `VITE_*` value is embedded in the client bundle and therefore public.
 * Never read secrets (JWT signing keys, SMTP credentials, DB passwords) here.
 */
function readString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

/**
 * Base URL for the backend API, including the `/api` prefix.
 *
 * Defaults to the relative `/api` path so requests stay same-origin and are
 * forwarded by the Vite dev proxy — the backend registers no CORS policy, so a
 * cross-origin request from the browser would otherwise be blocked.
 */
const apiBaseUrl = readString(import.meta.env.VITE_API_BASE_URL, '/api').replace(/\/+$/, '')

/** Vite `base` without a trailing slash. Local dev is `/`. Production is `/dira`. */
const routerBasename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/'

export const env = {
  apiBaseUrl,
  appName: readString(import.meta.env.VITE_APP_NAME, 'Dira 365'),
  /**
   * React Router basename. Production on dira365.com is `/` (site root).
   * Local `npm run dev` is also `/`.
   */
  routerBasename,
  /**
   * Google Apps Script web-app URL that saves photos into the school Drive.
   * Same pattern as the careers form (`VITE_GOOGLE_JOBS_URL`): the browser posts
   * the file; Java only stores the returned share link. Public — not a secret.
   */
  googleDriveUploadUrl: readString(import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_URL, ''),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const
