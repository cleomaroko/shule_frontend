import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'

export interface BiometricPunchView {
  id: number
  empCode: string | null
  personName: string | null
  punchTime: string | null
  /** Mapped by the server: CHECK_IN, CHECK_OUT, or PUNCH. */
  punchState: string | null
  terminalSn: string | null
  syncedAt: string | null
}

export interface BiometricPage {
  content: BiometricPunchView[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface BiometricSummary {
  date: string
  totalPunches: number
  uniquePeoplePunched: number
  totalCheckIns: number
  totalCheckOuts: number
  recentPunches: BiometricPunchView[]
}

export interface BiometricFilterQuery {
  query?: string
  state?: 'CHECK_IN' | 'CHECK_OUT'
  date?: string
  startDate?: string
  endDate?: string
  page: number
  size: number
}

export function toBiometricParams(query: BiometricFilterQuery): Record<string, string | number> {
  const params: Record<string, string | number> = { page: query.page, size: query.size }
  if (query.query) params.query = query.query
  if (query.state) params.state = query.state
  if (query.date) params.date = query.date
  if (query.startDate) params.startDate = query.startDate
  if (query.endDate) params.endDate = query.endDate
  return params
}

const emptyPage = (): BiometricPage => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 0,
})

export const biometricApi = {
  summary: (date: string) =>
    api.get<BiometricSummary>(endpoints.biometric.summary, { params: { date } }).then((r) => r.data),
  filter: (query: BiometricFilterQuery) =>
    api
      .get<BiometricPage>(endpoints.biometric.filter, { params: toBiometricParams(query) })
      .then((r) => r.data ?? emptyPage()),
}
