import { useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { staffApi, type StaffBulkResult } from '@/features/staff/api/staff.api'
import { SpreadsheetFileField } from '@/components/forms/SpreadsheetFileField'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function StaffBulkCard({ canWrite }: { canWrite: boolean }): ReactNode {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<StaffBulkResult | null>(null)

  if (!canWrite) return null

  const download = async () => {
    setDownloading(true)
    try {
      const blob = await staffApi.downloadTemplate()
      saveBlob(blob, 'staff_enrollment_template.xlsx')
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      setDownloading(false)
    }
  }

  const upload = async (event: FormEvent) => {
    event.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      const imported = await staffApi.upload(file)
      setResult(imported)
      setFile(null)
      await queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success(`Imported ${imported.totalImported ?? 0} staff accounts.`)
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={(event) => void upload(event)} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-6">
      <div>
        <h2 className="type-heading">Bulk upload</h2>
        <p className="type-caption mt-1 text-muted-foreground">
          Download the Excel template, fill one row per person, then upload it. Each row creates a staff profile and a login.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="secondary" className="w-full sm:w-auto" isLoading={downloading} loadingLabel="Downloading" onClick={() => void download()}>
          Download template
        </Button>
        <SpreadsheetFileField file={file} onChange={setFile} />
        <Button type="submit" className="w-full sm:w-auto" disabled={!file} isLoading={uploading} loadingLabel="Uploading">
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
