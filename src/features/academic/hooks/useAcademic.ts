import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { queryKeys } from '@/api/endpoints'
import { academicApi } from '@/features/academic/api/academic.api'
import type {
  AssignmentWritePayload,
  LearningAreaWritePayload,
} from '@/features/academic/types/academic.types'
import { logger } from '@/lib/logger'

export function useClassList() {
  return useQuery({
    queryKey: queryKeys.academic.classes,
    queryFn: academicApi.listClasses,
  })
}

export function useStreamList() {
  return useQuery({
    queryKey: queryKeys.academic.streams,
    queryFn: academicApi.listStreams,
  })
}

export function useLearningAreaList() {
  return useQuery({
    queryKey: queryKeys.academic.subjects,
    queryFn: academicApi.listLearningAreas,
  })
}

export function useAssignmentList() {
  return useQuery({
    queryKey: queryKeys.academic.assignments,
    queryFn: academicApi.listAssignments,
  })
}

export function useAcademicMutations() {
  const queryClient = useQueryClient()

  const invalidateClasses = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.academic.classes }),
      queryClient.invalidateQueries({ queryKey: queryKeys.lookups.classes }),
    ])
  }

  const invalidateStreams = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.academic.streams }),
      queryClient.invalidateQueries({ queryKey: queryKeys.lookups.streams }),
    ])
  }

  const createClass = useMutation({
    mutationFn: (body: { section: string; className: string }) => academicApi.createClass(body),
    onSuccess: async () => {
      await invalidateClasses()
      toast.success('Class added.')
    },
    onError: (error: unknown) => {
      logger.error('Create class failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createStream = useMutation({
    mutationFn: (body: { name: string }) => academicApi.createStream(body),
    onSuccess: async () => {
      await invalidateStreams()
      toast.success('Stream added.')
    },
    onError: (error: unknown) => {
      logger.error('Create stream failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createLearningArea = useMutation({
    mutationFn: (body: LearningAreaWritePayload) => academicApi.createLearningArea(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.academic.subjects })
      toast.success('Learning area created.')
    },
    onError: (error: unknown) => {
      logger.error('Create learning area failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const updateLearningArea = useMutation({
    mutationFn: ({ id, body }: { id: number; body: LearningAreaWritePayload }) =>
      academicApi.updateLearningArea(id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.academic.subjects })
      toast.success('Learning area updated.')
    },
    onError: (error: unknown) => {
      logger.error('Update learning area failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteLearningArea = useMutation({
    mutationFn: (id: number) => academicApi.deleteLearningArea(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.academic.subjects })
      toast.success('Learning area removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete learning area failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const createAssignment = useMutation({
    mutationFn: (body: AssignmentWritePayload) => academicApi.createAssignment(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.academic.assignments })
      toast.success('Teacher assigned.')
    },
    onError: (error: unknown) => {
      logger.error('Create assignment failed', error)
      toast.error(toUserMessage(error))
    },
  })

  const deleteAssignment = useMutation({
    mutationFn: (id: number) => academicApi.deleteAssignment(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.academic.assignments })
      toast.success('Assignment removed.')
    },
    onError: (error: unknown) => {
      logger.error('Delete assignment failed', error)
      toast.error(toUserMessage(error))
    },
  })

  return {
    createClass,
    createStream,
    createLearningArea,
    updateLearningArea,
    deleteLearningArea,
    createAssignment,
    deleteAssignment,
  }
}
