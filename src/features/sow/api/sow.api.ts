import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { SOW_FILTER_ORDER, type SchemeOfWork, type SchemeOfWorkPayload, type SowReportQuery } from '@/features/sow/types/sow.types'

export function compactSowQuery(params?: SowReportQuery): Record<string, string | number> {
  if (!params) return {}
  for (const key of SOW_FILTER_ORDER) {
    const value = params[key]
    if (value) return { [key]: value }
  }
  return {}
}

export const sowApi = {
  report: (params?: SowReportQuery) =>
    api.get<SchemeOfWork[]>(endpoints.sow.report, { params: compactSowQuery(params) }).then((r) => r.data ?? []),

  upload: (body: SchemeOfWorkPayload) =>
    api.post<SchemeOfWork>(endpoints.sow.create, body).then((r) => r.data as SchemeOfWork),
}
