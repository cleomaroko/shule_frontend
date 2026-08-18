/**
 * Every backend route the frontend is allowed to call, resolved relative to
 * `env.apiBaseUrl` (which already includes the `/api` prefix).
 *
 * Only routes verified in the Java source are listed.
 */
export const endpoints = {
  auth: {
    login: '/auth/login',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  staff: {
    /** GET — `ApiResponse<Staff[]>` */
    list: '/staff',
    /** POST — requires Authorization; body is a Staff entity */
    register: '/staff/register',
    /** PUT — requires Authorization; full overwrite of copied fields */
    byId: (id: number) => `/staff/${id}`,
  },
  learners: {
    /** GET — `ApiResponse<Learner[]>` (exists in source; omitted from older docs) */
    list: '/learners',
    /** POST — requires Authorization */
    register: '/learners/register',
    /** PUT / DELETE — requires Authorization */
    byId: (id: number) => `/learners/${id}`,
  },
  campuses: '/campuses',
  departments: '/departments',
  lookups: {
    titles: '/lookups/titles',
    genders: '/lookups/genders',
    maritalStatuses: '/lookups/marital-statuses',
    banks: '/lookups/banks',
    employmentStatuses: '/lookups/employment-statuses',
    taxExemptReasons: '/lookups/tax-exempt-reasons',
  },
  pickers: {
    counties: '/pickers/counties',
    classes: '/pickers/classes',
    streams: '/pickers/streams',
    zones: '/pickers/zones',
    houses: '/pickers/houses',
  },
} as const

export const queryKeys = {
  staff: {
    all: ['staff'] as const,
  },
  learners: {
    all: ['learners'] as const,
  },
  lookups: {
    campuses: ['lookups', 'campuses'] as const,
    departments: ['lookups', 'departments'] as const,
    titles: ['lookups', 'titles'] as const,
    genders: ['lookups', 'genders'] as const,
    maritalStatuses: ['lookups', 'marital-statuses'] as const,
    banks: ['lookups', 'banks'] as const,
    employmentStatuses: ['lookups', 'employment-statuses'] as const,
    taxExemptReasons: ['lookups', 'tax-exempt-reasons'] as const,
    counties: ['lookups', 'counties'] as const,
    classes: ['lookups', 'classes'] as const,
    streams: ['lookups', 'streams'] as const,
    zones: ['lookups', 'zones'] as const,
    houses: ['lookups', 'houses'] as const,
  },
} as const
