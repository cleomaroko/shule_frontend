import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  CostCenter,
  CreateRequisitionPayload,
  Requisition,
  RequisitionQuery,
  RequisitionReportSummary,
  WorkflowActionPayload,
} from '@/features/requisitions/types/requisition.types'

export function compactRequisitionQuery(params?: RequisitionQuery): Record<string, string | number> {
  if (!params) return {}
  const out: Record<string, string | number> = {}
  if (params.status) out.status = params.status
  if (params.type) out.type = params.type
  if (params.campusId) out.campusId = params.campusId
  if (params.departmentId) out.departmentId = params.departmentId
  if (params.costCenterId) out.costCenterId = params.costCenterId
  if (params.staffId) out.staffId = params.staffId
  if (params.startDate) out.startDate = params.startDate
  if (params.endDate) out.endDate = params.endDate
  return out
}

export const requisitionsApi = {
  list: (params?: RequisitionQuery) =>
    api
      .get<Requisition[]>(endpoints.requisitions.list, { params: compactRequisitionQuery(params) })
      .then((r) => r.data ?? []),

  mine: () => api.get<Requisition[]>(endpoints.requisitions.mine).then((r) => r.data ?? []),

  getById: (id: number) =>
    api.get<Requisition>(endpoints.requisitions.byId(id)).then((r) => r.data as Requisition),

  summary: (params?: RequisitionQuery) =>
    api
      .get<RequisitionReportSummary>(endpoints.requisitions.summary, {
        params: compactRequisitionQuery(params),
      })
      .then((r) => r.data as RequisitionReportSummary),

  create: (body: CreateRequisitionPayload) =>
    api.post<Requisition>(endpoints.requisitions.create, body).then((r) => r.data as Requisition),

  review: (id: number, body: WorkflowActionPayload) =>
    api.patch<Requisition>(endpoints.requisitions.review(id), body).then((r) => r.data as Requisition),

  approve: (id: number, body: WorkflowActionPayload) =>
    api.patch<Requisition>(endpoints.requisitions.approve(id), body).then((r) => r.data as Requisition),

  receive: (id: number) =>
    api.patch<Requisition>(endpoints.requisitions.receive(id), {}).then((r) => r.data as Requisition),

  reject: (id: number, body: WorkflowActionPayload) =>
    api.patch<Requisition>(endpoints.requisitions.reject(id), body).then((r) => r.data as Requisition),

  listCostCenters: () =>
    api.get<CostCenter[]>(endpoints.requisitions.costCenters).then((r) => r.data ?? []),

  createCostCenter: (body: { name: string }) =>
    api.post<CostCenter>(endpoints.requisitions.costCenters, body).then((r) => r.data as CostCenter),

  updateCostCenter: (id: number, body: { name: string }) =>
    api
      .put<CostCenter>(endpoints.requisitions.costCenterById(id), body)
      .then((r) => r.data as CostCenter),

  deleteCostCenter: (id: number) =>
    api.delete(endpoints.requisitions.costCenterById(id)).then(() => undefined),
}
