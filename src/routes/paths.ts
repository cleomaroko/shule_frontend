/**
 * Every route in the application, in one place.
 *
 * Future ERP modules (`/app/students`, `/app/fees`, …) should be registered here
 * rather than written as string literals across the codebase.
 */
export const paths = {
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  app: '/app',
} as const

/** Where users land after signing in. */
export const DEFAULT_AUTHENTICATED_PATH = paths.app
