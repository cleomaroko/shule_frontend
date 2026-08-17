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

export const env = {
  apiBaseUrl,
  appName: readString(import.meta.env.VITE_APP_NAME, 'Dira'),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const
