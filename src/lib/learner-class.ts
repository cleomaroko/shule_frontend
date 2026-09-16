import type { AcademicStream, SchoolClass } from '@/features/academic/types/academic.types'
import type { Learner } from '@/features/learners/types/learner.types'
import { formatClassLabel } from '@/lib/format'

/** Learners store class/stream as names; attendance and exam POSTs need academic ids. */
export function learnerMatchesClass(
  learner: Pick<Learner, 'currentClass'>,
  schoolClass: SchoolClass,
): boolean {
  const current = learner.currentClass?.trim().toLowerCase() ?? ''
  const className = schoolClass.className?.trim().toLowerCase() ?? ''
  const classLabel = formatClassLabel(schoolClass).toLowerCase()
  return (
    Boolean(current) &&
    (current === className || current === classLabel || (className !== '' && current.includes(className)))
  )
}

export function learnerMatchesClassStream(
  learner: Pick<Learner, 'currentClass' | 'stream'>,
  schoolClass: SchoolClass,
  stream: AcademicStream,
): boolean {
  const learnerStream = learner.stream?.trim().toLowerCase() ?? ''
  const streamName = stream.name?.trim().toLowerCase() ?? ''
  return learnerMatchesClass(learner, schoolClass) && Boolean(learnerStream) && learnerStream === streamName
}
