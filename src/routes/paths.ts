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
  academics: '/academics',
  attendance: '/attendance',
  exams: '/exams',
  schemes: '/schemes',
  logistics: '/logistics',
  assets: '/assets',
  store: '/store',
  transport: '/transport',
  suppliers: '/suppliers',
  visitors: '/visitors',
  admissions: '/admissions',
  requisitions: '/requisitions',
  fees: '/fees',
  finance: '/finance',
  forms: '/forms',
  formShared: (id: number | string) => `/forms/shared/${id}`,
  formSharedResults: (id: number | string) => `/forms/shared/${id}/results`,
  tickets: '/tickets',
  projects: '/projects',
  reports: '/reports',
  system: '/system',
} as const

/** Where users land after signing in. */
export const DEFAULT_AUTHENTICATED_PATH = paths.app
