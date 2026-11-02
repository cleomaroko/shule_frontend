import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { SelectField } from '@/components/forms/SelectField'
import { SpreadsheetFileField } from '@/components/forms/SpreadsheetFileField'
import { Button } from '@/components/ui/button'
import { useAcademicYearList } from '@/features/academic/hooks/useAcademic'
import { learnersApi } from '@/features/learners/api/learners.api'
import type { LearnerBulkResult } from '@/features/learners/types/learner.types'
import { useCampuses, useSchoolClasses } from '@/features/lookups/useLookups'
import { formatClassLabel } from '@/lib/format'
import { useQueryClient } from '@tanstack/react-query'

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function LearnerEnrollmentCard({ canWrite }: { canWrite: boolean }): ReactNode {
  const queryClient = useQueryClient()
  const campuses = useCampuses()
  const classes = useSchoolClasses()
  const years = useAcademicYearList()
  const [campusId, setCampusId] = useState('')
  const [classId, setClassId] = useState('')
  const [streamId, setStreamId] = useState('')
  const [yearId, setYearId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<LearnerBulkResult | null>(null)

  const selectedClass = useMemo(
    () => (classes.data ?? []).find((item) => String(item.id) === classId),
    [classes.data, classId],
  )

  if (!canWrite) {
    return (
      <p className="type-caption text-muted-foreground">
        Bulk enrolment is available to administrators and heads.
      </p>
    )
  }

  const paramsReady = Boolean(campusId && classId)

  const download = async () => {
    if (!paramsReady) {
      toast.error('Choose a campus and class before downloading the template.')
      return
    }
    setDownloading(true)
    try {
      const blob = await learnersApi.downloadTemplate({
        campusId: Number(campusId),
        classId: Number(classId),
        ...(streamId ? { streamId: Number(streamId) } : {}),
      })
      saveBlob(blob, 'learner_enrollment_template.xlsx')
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      setDownloading(false)
    }
  }

  const upload = async (event: FormEvent) => {
    event.preventDefault()
    if (!file || !paramsReady) return
    setUploading(true)
    try {
      const imported = await learnersApi.upload(file, {
        campusId: Number(campusId),
        classId: Number(classId),
        ...(streamId ? { streamId: Number(streamId) } : {}),
        ...(yearId ? { academicYearId: Number(yearId) } : {}),
      })
      setResult(imported)
      setFile(null)
      await queryClient.invalidateQueries({ queryKey: ['learners'] })
      toast.success(`Imported ${imported.totalImported ?? 0} learners.`)
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={(event) => void upload(event)} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-6">
      <div>
        <h2 className="type-heading">Bulk enrolment</h2>
        <p className="type-caption mt-1 text-muted-foreground">
          Download a template for one campus and class, fill a row per learner, then upload the sheet.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Campus"
          value={campusId}
          onChange={setCampusId}
          options={(campuses.data ?? []).map((campus) => ({ value: String(campus.id), label: campus.name }))}
          emptyLabel="Select campus"
        />
        <SelectField
          label="Class"
          value={classId}
          onChange={(value) => {
            setClassId(value)
            setStreamId('')
          }}
          options={(classes.data ?? []).map((item) => ({ value: String(item.id), label: formatClassLabel(item) }))}
          emptyLabel="Select class"
        />
        <SelectField
          label="Stream"
          value={streamId}
          onChange={setStreamId}
          options={(selectedClass?.streams ?? []).map((stream) => ({ value: String(stream.id), label: stream.name }))}
          emptyLabel="Whole class"
        />
        <SelectField
          label="Academic year"
          value={yearId}
          onChange={setYearId}
          options={(years.data ?? []).map((year) => ({ value: String(year.id), label: year.name || `Year ${year.id}` }))}
          emptyLabel="Not set"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="secondary" className="w-full sm:w-auto" isLoading={downloading} loadingLabel="Downloading" onClick={() => void download()}>
          Download template
        </Button>
        <SpreadsheetFileField file={file} onChange={setFile} />
        <Button type="submit" className="w-full sm:w-auto" disabled={!file || !paramsReady} isLoading={uploading} loadingLabel="Uploading">
          Upload sheet
        </Button>
      </div>
      {result ? (
        <p className="type-caption text-muted-foreground">
          Imported {result.totalImported ?? 0}. Failed rows: {result.failedRows ?? 0}.
          {result.errors?.length ? ` ${result.errors.join(' ')}` : ''}
        </p>
      ) : null}
    </form>
  )
}
