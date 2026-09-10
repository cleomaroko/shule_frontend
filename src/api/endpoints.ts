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
    /** GET — `ApiResponse<Staff[]>` teachers/heads/deans (StaffRepository.findAllTeachers). */
    teachers: '/staff/teachers',
    /** POST — requires Authorization; creates Staff and a User login. */
    register: '/staff/register',
    /** PUT / DELETE — requires Authorization */
    byId: (id: number) => `/staff/${id}`,
  },
  learners: {
    list: '/learners',
    register: '/learners/register',
    byId: (id: number) => `/learners/${id}`,
  },
  admissions: {
    /** POST public — website lead capture. */
    submit: '/admissions/submit',
    /** GET wrapped pending leads (`processed == false`). Requires Authorization. */
    list: '/admissions/list',
    /** PATCH wrapped. Requires Authorization. */
    process: (id: number) => `/admissions/process/${id}`,
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
    classes: '/academic/classes',
    classById: (id: number) => `/academic/classes/${id}`,
    streams: '/academic/streams',
    streamById: (id: number) => `/academic/streams/${id}`,
    years: '/academic/years',
    yearById: (id: number) => `/academic/years/${id}`,
    terms: '/academic/terms',
    termById: (id: number) => `/academic/terms/${id}`,
    assignments: {
      list: '/academic/assignments',
      byId: (id: number) => `/academic/assignments/${id}`,
    },
  },
  subjects: {
    list: '/subjects',
    byId: (id: number) => `/subjects/${id}`,
  },
  logistics: {
    zones: '/logistics/zones',
    zoneById: (id: number) => `/logistics/zones/${id}`,
    houses: '/logistics/houses',
    houseById: (id: number) => `/logistics/houses/${id}`,
  },
  assets: {
    /** GET wrapped `ApiResponse<Asset[]>`. POST/PUT/DELETE: ADMIN, PROCUREMENT, or IT. */
    list: '/assets',
    byId: (id: number) => `/assets/${id}`,
    byTag: (tagId: string) => `/assets/tag/${encodeURIComponent(tagId)}`,
    /** GET wrapped. Optional query: brand, model, serialNumber, *Id filters, purchaseDate. */
    search: '/assets/search',
    /** GET wrapped map: categories, descriptions, conditions, statuses. */
    lookups: '/assets/lookups',
    /** GET raw arrays. POST/PUT/DELETE wrapped. */
    categories: '/assets/categories',
    categoryById: (id: number) => `/assets/categories/${id}`,
    descriptions: '/assets/descriptions',
    descriptionById: (id: number) => `/assets/descriptions/${id}`,
    conditions: '/assets/conditions',
    conditionById: (id: number) => `/assets/conditions/${id}`,
    statuses: '/assets/statuses',
    statusById: (id: number) => `/assets/statuses/${id}`,
  },
  store: {
    /** GET wrapped. POST/DELETE wrapped. No PUT. Auth: ADMIN, MANAGER, or OPERATOR. */
    locations: '/store/locations',
    locationById: (id: number) => `/store/locations/${id}`,
    /** GET wrapped. POST/DELETE wrapped. Optional parentCategory on POST. */
    categories: '/store/categories',
    categoryById: (id: number) => `/store/categories/${id}`,
    /** GET wrapped. POST/DELETE wrapped. No PUT. Auth: ADMIN, MANAGER, or OPERATOR. */
    units: '/store/units',
    unitById: (id: number) => `/store/units/${id}`,
    /** GET wrapped. POST/PUT/DELETE wrapped. */
    items: '/store/items',
    itemById: (id: number) => `/store/items/${id}`,
    /** GET wrapped `StockLog[]` ordered by date desc. */
    itemMovements: (id: number) => `/store/items/${id}/movements`,
    /** GET wrapped. Filter only when storeId, termId, startDate, and endDate are all set. */
    logs: '/store/logs',
    logById: (id: number) => `/store/logs/${id}`,
    /** PATCH wrapped. Marks a PENDING transfer as RECEIVED and adds stock at destination. */
    receiveLog: (id: number) => `/store/logs/${id}/receive`,
    /**
     * GET wrapped. Required: storeId, termId, startDate, endDate.
     * Some deployments return aggregated weekly rows; this repo's controller
     * still returns `StockLog[]` for the same path.
     */
    stockTake: '/store/stock-take',
    /** GET wrapped `ItemBatch[]`. Batches with status AVAILABLE expiring within 30 days. */
    expiringSoon: '/store/alerts/expiring-soon',
    /** GET wrapped. Optional query: itemId, storeId, status (AVAILABLE, EXPIRED, CONSUMED). */
    expiryReport: '/store/reports/expiries',
    /** PATCH wrapped body `{ expiryDate }`. Auth: ADMIN, MANAGER, or OPERATOR. */
    correctExpiry: (id: number) => `/store/batches/${id}/correct-expiry`,
  },
  transport: {
    vehicles: '/transport/vehicles',
    vehicleById: (id: number) => `/transport/vehicles/${id}`,
    /** GET wrapped. Optional query: logType, vehicleId, driverId, serviceTypeId, start, end. */
    logs: '/transport/logs',
    logById: (id: number) => `/transport/logs/${id}`,
    /** GET wrapped. POST wrapped. No PUT/DELETE. */
    stops: '/transport/stops',
    /** GET raw. POST wrapped. No PUT/DELETE. */
    serviceTypes: '/transport/service-types',
    /** GET raw `ExternalHire[]`. POST wrapped. No PUT/DELETE. */
    hires: '/transport/hires',
    /**
     * GET raw. Required query: vehicleId, tripType, term.
     * POST wrapped. DELETE wrapped. No PUT.
     */
    assignments: '/transport/assignments',
    assignmentById: (id: number) => `/transport/assignments/${id}`,
  },
  shuleAi: {
    /** GET plain text. Query: `message`. Sent to `env.aiApiBaseUrl`, not `apiBaseUrl`. */
    chat: '/shule-ai/chat',
  },
  suppliers: {
    /** GET raw `Supplier[]`. POST/PUT/DELETE wrapped. */
    list: '/suppliers',
    byId: (id: number) => `/suppliers/${id}`,
    /** GET raw. POST/PUT/DELETE wrapped. */
    types: '/suppliers/types',
    typeById: (id: number) => `/suppliers/types/${id}`,
    /** GET raw `SupplierContract[]`. */
    contractsBySupplier: (id: number) => `/suppliers/${id}/contracts`,
    contracts: '/suppliers/contracts',
    contractById: (id: number) => `/suppliers/contracts/${id}`,
    /** PATCH `?status=` */
    contractStatus: (id: number) => `/suppliers/contracts/${id}/status`,
  },
  requisitions: {
    /** GET wrapped. Optional query: status, type, campusId, departmentId, costCenterId, staffId, startDate, endDate. */
    list: '/requisitions',
    /** GET wrapped. Requires Authorization. Resolves staff via workEmail == JWT username. */
    mine: '/requisitions/my-requisitions',
    byId: (id: number) => `/requisitions/${id}`,
    /** GET wrapped `RequisitionReportSummary`. Same filters as list. */
    summary: '/requisitions/reports/summary',
    /** POST wrapped. Requires Authorization. Status is forced SUBMITTED. */
    create: '/requisitions',
    review: (id: number) => `/requisitions/${id}/review`,
    approve: (id: number) => `/requisitions/${id}/approve`,
    receive: (id: number) => `/requisitions/${id}/receive`,
    reject: (id: number) => `/requisitions/${id}/reject`,
    /** GET wrapped. POST/PUT/DELETE wrapped. Auth header on writes for audit. No role check. */
    costCenters: '/requisitions/cost-centers',
    costCenterById: (id: number) => `/requisitions/cost-centers/${id}`,
  },
  visitors: {
    /** GET wrapped. POST check-in wrapped. DELETE wrapped. */
    list: '/visitors',
    byId: (id: number) => `/visitors/${id}`,
    checkOut: (id: number) => `/visitors/${id}/check-out`,
    /** GET raw. POST wrapped. */
    categories: '/visitors/categories',
    purposes: '/visitors/purposes',
  },
  system: {
    reset: '/system/reset-to-defaults',
    logs: '/system/logs',
    emailUsage: '/system/email-usage',
    analytics: '/system/analytics',
  },
  lookups: {
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
    teachers: ['staff', 'teachers'] as const,
  },
  learners: {
    all: ['learners'] as const,
  },
  admissions: {
    pending: ['admissions', 'pending'] as const,
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
    lookups: ['assets', 'lookups'] as const,
    categories: ['assets', 'categories'] as const,
    descriptions: ['assets', 'descriptions'] as const,
    conditions: ['assets', 'conditions'] as const,
    statuses: ['assets', 'statuses'] as const,
  },
  store: {
    locations: ['store', 'locations'] as const,
    categories: ['store', 'categories'] as const,
    units: ['store', 'units'] as const,
    logs: ['store', 'logs'] as const,
    items: ['store', 'items'] as const,
    stockTake: (params: { storeId: number; termId: number; startDate: string; endDate: string }) =>
      ['store', 'stock-take', params] as const,
    itemMovements: (itemId: number) => ['store', 'items', itemId, 'movements'] as const,
    expiringSoon: ['store', 'alerts', 'expiring-soon'] as const,
    expiryReport: (params: { itemId?: number; storeId?: number; status?: string }) =>
      ['store', 'reports', 'expiries', params] as const,
  },
  transport: {
    vehicles: ['transport', 'vehicles'] as const,
    logs: ['transport', 'logs'] as const,
    stops: ['transport', 'stops'] as const,
    serviceTypes: ['transport', 'service-types'] as const,
    hires: ['transport', 'hires'] as const,
    assignments: (params: { vehicleId: number; tripType: string; term: string }) =>
      ['transport', 'assignments', params] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
    types: ['suppliers', 'types'] as const,
    contracts: (supplierId: number) => ['suppliers', 'contracts', supplierId] as const,
  },
  requisitions: {
    all: ['requisitions'] as const,
    list: (params: Record<string, string | number>) => ['requisitions', 'list', params] as const,
    mine: ['requisitions', 'mine'] as const,
    detail: (id: number) => ['requisitions', 'detail', id] as const,
    summary: (params: Record<string, string | number>) => ['requisitions', 'summary', params] as const,
    costCenters: ['requisitions', 'cost-centers'] as const,
  },
  visitors: {
    all: ['visitors'] as const,
    categories: ['visitors', 'categories'] as const,
    purposes: ['visitors', 'purposes'] as const,
  },
  logistics: {
    zones: ['logistics', 'zones'] as const,
    houses: ['logistics', 'houses'] as const,
  },
  system: {
    logs: ['system', 'logs'] as const,
    emailUsage: ['system', 'email-usage'] as const,
    analytics: ['system', 'analytics'] as const,
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
