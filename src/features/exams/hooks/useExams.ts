import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { examsApi } from '@/features/exams/api/exams.api'
import type {
  ExamMarkPayload,
  ExamSubjectConfigWritePayload,
  ExamTypeWritePayload,
  GradingScaleWritePayload,
} from '@/features/exams/types/exam.types'
import { logger } from '@/lib/logger'

export function useExamTypeList() {
  return useQuery({
    queryKey: queryKeys.exams.types,
    queryFn: examsApi.listTypes,
  })
}

export function useGradingScaleList() {
  return useQuery({
    queryKey: queryKeys.exams.grading,
    queryFn: examsApi.listGrading,
  })
}

export function useExamConfig(classId: number | null) {
  return useQuery({
    queryKey: queryKeys.exams.config(classId ?? 0),
    queryFn: () => examsApi.listConfig(classId as number),
    enabled: Boolean(classId),
  })
}

export function useExamAnalysis(learnerId: number | null, termId: number | null) {
  return useQuery({
    queryKey: queryKeys.exams.analysis(learnerId ?? 0, termId ?? 0),
    queryFn: () => examsApi.analysis(learnerId as number, termId as number),
    enabled: Boolean(learnerId) && Boolean(termId),
  })
}

export function usePathwayDistribution(classId: number | null, termId: number | null) {
  return useQuery({
    queryKey: queryKeys.exams.pathwayDistribution(classId ?? 0, termId ?? 0),
    queryFn: () => examsApi.pathwayDistribution(classId as number, termId as number),
    enabled: Boolean(classId) && Boolean(termId),
  })
}

export function useExamMutations() {
  const queryClient = useQueryClient()
  const invalidateTypes = () => queryClient.invalidateQueries({ queryKey: queryKeys.exams.types })
  const invalidateGrading = () => queryClient.invalidateQueries({ queryKey: queryKeys.exams.grading })
  const invalidateConfig = () => queryClient.invalidateQueries({ queryKey: ['exams', 'config'] })
  const invalidateReports = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['exams', 'analysis'] }),
      queryClient.invalidateQueries({ queryKey: ['exams', 'pathway-distribution'] }),
    ])

  const createType = useMutation({
    mutationFn: (body: ExamTypeWritePayload) => examsApi.createType(body),
    onSuccess: async () => {
      await invalidateTypes()
      toast.success('Exam type added.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const updateType = useMutation({
    mutationFn: ({ id, body }: { id: number; body: ExamTypeWritePayload }) => examsApi.updateType(id, body),
    onSuccess: async () => {
      await invalidateTypes()
      toast.success('Exam type updated.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const deleteType = useMutation({
    mutationFn: (id: number) => examsApi.deleteType(id),
    onSuccess: async () => {
      await invalidateTypes()
      toast.success('Exam type removed.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const createGrading = useMutation({
    mutationFn: (body: GradingScaleWritePayload) => examsApi.createGrading(body),
    onSuccess: async () => {
      await invalidateGrading()
      toast.success('Grading band saved.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const saveConfig = useMutation({
    mutationFn: (body: ExamSubjectConfigWritePayload) => examsApi.saveConfig(body),
    onSuccess: async () => {
      await invalidateConfig()
      toast.success('Subject config saved.')
    },
    onError: (error: unknown) => toast.error(toUserMessage(error)),
  })

  const addMark = useMutation({
    mutationFn: (body: ExamMarkPayload) => examsApi.addMark(body),
    onSuccess: async () => {
      await invalidateReports()
      toast.success('Mark saved.')
    },
    onError: (error: unknown) => {
      logger.error('Add exam mark failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const addMarksBatch = useMutation({
    mutationFn: (body: ExamMarkPayload[]) => examsApi.addMarksBatch(body),
    onSuccess: async (rows) => {
      await invalidateReports()
      toast.success(`Saved ${rows.length} mark${rows.length === 1 ? '' : 's'}.`)
    },
    onError: (error: unknown) => {
      logger.error('Batch exam marks failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return { createType, updateType, deleteType, createGrading, saveConfig, addMark, addMarksBatch }
}
