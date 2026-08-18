/**
 * Every route in the application, in one place.
 */
export const paths = {
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  app: '/app',
  staff: '/staff',
  staffNew: '/staff/new',
  staffDetail: (id: number | string) => `/staff/${id}`,
  staffEdit: (id: number | string) => `/staff/${id}/edit`,
  learners: '/learners',
  learnerNew: '/learners/new',
  learnerDetail: (id: number | string) => `/learners/${id}`,
  learnerEdit: (id: number | string) => `/learners/${id}/edit`,
} as const

/** Where users land after signing in. */
export const DEFAULT_AUTHENTICATED_PATH = paths.app
