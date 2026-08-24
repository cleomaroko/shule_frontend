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
    /** POST — requires Authorization; creates Staff and a User login (username = workEmail, role ROLE_STAFF). */
    register: '/staff/register',
    /** PUT — requires Authorization; full overwrite of copied fields. Does not update workEmail or password. */
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
  campuses: {
    list: '/campuses',
    byId: (id: number) => `/campuses/${id}`,
  },
  departments: {
    list: '/departments',
    byId: (id: number) => `/departments/${id}`,
  },
  academic: {
    /** GET raw `SchoolClass[]`; POST/PUT/DELETE wrapped, Authorization used for audit logging. */
    classes: '/academic/classes',
    classById: (id: number) => `/academic/classes/${id}`,
    /** GET raw `Stream[]`; POST/PUT/DELETE wrapped. */
    streams: '/academic/streams',
    streamById: (id: number) => `/academic/streams/${id}`,
    /** GET wrapped. POST/PUT wrapped; require ADMIN or HEAD. No DELETE. */
    years: '/academic/years',
    yearById: (id: number) => `/academic/years/${id}`,
    /** GET wrapped. POST/PUT wrapped; require ADMIN or HEAD. PUT does not change academicYear. No DELETE. */
    terms: '/academic/terms',
    termById: (id: number) => `/academic/terms/${id}`,
    assignments: {
      /** GET raw `TeacherAssignment[]`. */
      list: '/academic/assignments',
      /** DELETE wrapped; POST/DELETE require ADMIN or HEAD. */
      byId: (id: number) => `/academic/assignments/${id}`,
    },
  },
  subjects: {
    /** GET wrapped `ApiResponse<Subject[]>`. Mutations: SUPER_ADMIN / IT_ADMIN / HEAD_OF_SCHOOL / SECTION_HEAD. */
    list: '/subjects',
    byId: (id: number) => `/subjects/${id}`,
  },
  logistics: {
    /** GET raw arrays; POST/PUT/DELETE wrapped and Authorization is required for logging. */
    zones: '/logistics/zones',
    zoneById: (id: number) => `/logistics/zones/${id}`,
    houses: '/logistics/houses',
    houseById: (id: number) => `/logistics/houses/${id}`,
  },
  assets: {
    /** GET wrapped `ApiResponse<Asset[]>`. POST/PUT/DELETE require ADMIN or PROCUREMENT. */
    list: '/assets',
    byId: (id: number) => `/assets/${id}`,
    /** GET raw `AssetCategory[]`; POST wrapped. No PUT/DELETE in the controller. */
    categories: '/assets/categories',
  },
  store: {
    /** GET wrapped list; POST/PUT/DELETE require Authorization for audit logging. */
    logs: '/store/logs',
    logById: (id: number) => `/store/logs/${id}`,
    /** GET/POST wrapped. No PUT/DELETE for items. No units list endpoint in the controller. */
    items: '/store/items',
  },
  system: {
    reset: '/system/reset-to-defaults',
    logs: '/system/logs',
    emailUsage: '/system/email-usage',
  },
  lookups: {
    /** GET raw `StaffRole[]`. POST/PUT/DELETE wrapped; Authorization used for audit logging. */
    roles: '/lookups/roles',
    roleById: (id: number) => `/lookups/roles/${id}`,
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
  academic: {
    classes: ['academic', 'classes'] as const,
    streams: ['academic', 'streams'] as const,
    assignments: ['academic', 'assignments'] as const,
    subjects: ['academic', 'subjects'] as const,
    years: ['academic', 'years'] as const,
    terms: ['academic', 'terms'] as const,
  },
  assets: {
    all: ['assets'] as const,
    categories: ['assets', 'categories'] as const,
  },
  store: {
    logs: ['store', 'logs'] as const,
    items: ['store', 'items'] as const,
  },
  logistics: {
    zones: ['logistics', 'zones'] as const,
    houses: ['logistics', 'houses'] as const,
  },
  system: {
    logs: ['system', 'logs'] as const,
    emailUsage: ['system', 'email-usage'] as const,
  },
  lookups: {
    campuses: ['lookups', 'campuses'] as const,
    departments: ['lookups', 'departments'] as const,
    roles: ['lookups', 'roles'] as const,
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
