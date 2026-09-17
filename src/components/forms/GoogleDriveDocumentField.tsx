import { FileText, Loader2, X } from 'lucide-react'
import {
  forwardRef,
  useImperativeHandle,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'

import { toUserMessage, isApiError } from '@/api/errors'
import { FieldError } from '@/components/forms/FieldError'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { uploadDocumentToSchoolDrive } from '@/features/media/media.api'
import { assertGoogleDriveDocumentFile, GOOGLE_DRIVE_DOCUMENT_ACCEPT } from '@/lib/google-drive'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

export interface GoogleDriveDocumentFieldHandle {
  /** Upload a newly chosen file, or return the already-saved Drive URL. */
  commit: () => Promise<string>
}

export interface GoogleDriveDocumentFieldProps {
  label?: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  error?: string | undefined
  hint?: string
  containerClassName?: string
}

export const GoogleDriveDocumentField = forwardRef<GoogleDriveDocumentFieldHandle, GoogleDriveDocumentFieldProps>(
  function GoogleDriveDocumentField(
    {
      label = 'Document',
      value,
      onChange,
      disabled = false,
      error,
      hint = 'Choose a PDF or Word file. It is sent to Google Drive when you save this record.',
      containerClassName,
    },
    ref,
  ): ReactNode {
    const id = useId()
    const errorId = `${id}-error`
    const hintId = `${id}-hint`
    const inputRef = useRef<HTMLInputElement>(null)
    const pendingRef = useRef<File | null>(null)
    const valueRef = useRef(value)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    pendingRef.current = pendingFile
    valueRef.current = value

    useImperativeHandle(ref, () => ({
      async commit() {
        const file = pendingRef.current
        if (!file) return valueRef.current
        setUploading(true)
        try {
          const uploaded = await uploadDocumentToSchoolDrive(file)
          setPendingFile(null)
          pendingRef.current = null
          onChangeRef.current(uploaded.url)
          return uploaded.url
        } catch (cause) {
          logger.error('Google Drive document upload failed', cause)
          toast.error(
            isApiError(cause)
              ? toUserMessage(cause)
              : cause instanceof Error
                ? cause.message
                : toUserMessage(cause),
          )
          throw cause
        } finally {
          setUploading(false)
        }
      },
    }))

    const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file || disabled || uploading) return
      try {
        assertGoogleDriveDocumentFile(file)
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : toUserMessage(cause))
        return
      }
      setPendingFile(file)
      onChange('')
    }

    const clear = () => {
      setPendingFile(null)
      onChange('')
    }

    const hasFile = Boolean(pendingFile || value)
    const busy = disabled || uploading

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        <Label htmlFor={id}>{label}</Label>
        <div
          className={cn(
            'flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center',
            error ? 'border-destructive' : 'border-input',
          )}
        >
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            <FileText className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            {pendingFile ? (
              <p className="type-caption break-all text-muted-foreground">
                {pendingFile.name} — uploaded when you save.
              </p>
            ) : value ? (
              <p className="type-caption break-all text-muted-foreground">Saved as a Google Drive link.</p>
            ) : (
              <p className="type-caption text-muted-foreground">No document selected yet.</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                ref={inputRef}
                id={id}
                type="file"
                accept={GOOGLE_DRIVE_DOCUMENT_ACCEPT}
                className="sr-only"
                disabled={busy}
                onChange={handleFile}
                aria-describedby={[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileText aria-hidden="true" />}
                {uploading ? 'Uploading…' : hasFile ? 'Change file' : 'Choose file'}
              </Button>
              {hasFile ? (
                <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={clear}>
                  <X aria-hidden="true" />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        {hint ? (
          <p id={hintId} className="type-caption text-muted-foreground">
            {hint}
          </p>
        ) : null}
        <FieldError id={errorId} message={error} />
      </div>
    )
  },
)
