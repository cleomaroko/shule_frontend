import { ImagePlus, Loader2, X } from 'lucide-react'
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'

import { toUserMessage, isApiError } from '@/api/errors'
import { FieldError } from '@/components/forms/FieldError'
import { DrivePhoto } from '@/components/media/DrivePhoto'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { uploadImageToSchoolDrive } from '@/features/media/media.api'
import { assertGoogleDriveImageFile, GOOGLE_DRIVE_IMAGE_ACCEPT } from '@/lib/google-drive'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

export interface GoogleDrivePhotoFieldHandle {
  /** Upload a newly chosen file, or return the already-saved Drive URL. */
  commit: () => Promise<string>
}

export interface GoogleDrivePhotoFieldProps {
  label?: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  error?: string | undefined
  hint?: string
  containerClassName?: string
}

export const GoogleDrivePhotoField = forwardRef<GoogleDrivePhotoFieldHandle, GoogleDrivePhotoFieldProps>(
  function GoogleDrivePhotoField(
    {
      label = 'Photo',
      value,
      onChange,
      disabled = false,
      error,
      hint = 'Choose a photo from this computer. It is sent to Google Drive when you save this record.',
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
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    pendingRef.current = pendingFile
    valueRef.current = value

    useEffect(() => {
      if (!pendingFile) {
        setPreviewUrl(null)
        return
      }
      const url = URL.createObjectURL(pendingFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }, [pendingFile])

    useImperativeHandle(ref, () => ({
      async commit() {
        const file = pendingRef.current
        if (!file) return valueRef.current
        setUploading(true)
        try {
          const uploaded = await uploadImageToSchoolDrive(file)
          setPendingFile(null)
          pendingRef.current = null
          onChangeRef.current(uploaded.url)
          return uploaded.url
        } catch (cause) {
          logger.error('Google Drive photo upload failed', cause)
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
        assertGoogleDriveImageFile(file)
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : toUserMessage(cause))
        return
      }
      setPendingFile(file)
    }

    const clear = () => {
      setPendingFile(null)
      onChange('')
    }

    const hasImage = Boolean(pendingFile || value)
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
            {previewUrl ? (
              <img src={previewUrl} alt="" className="size-full object-cover" />
            ) : value ? (
              <DrivePhoto url={value} />
            ) : (
              <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {pendingFile ? (
              <p className="type-caption break-all text-muted-foreground">
                {pendingFile.name} — uploaded when you save.
              </p>
            ) : value ? (
              <p className="type-caption break-all text-muted-foreground">Saved as a Google Drive link.</p>
            ) : (
              <p className="type-caption text-muted-foreground">No photo selected yet.</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                ref={inputRef}
                id={id}
                type="file"
                accept={GOOGLE_DRIVE_IMAGE_ACCEPT}
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
                {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
                {uploading ? 'Uploading…' : hasImage ? 'Change photo' : 'Choose photo'}
              </Button>
              {hasImage ? (
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
