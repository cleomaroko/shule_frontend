import { ImagePlus, Loader2, X } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { FieldError } from '@/components/forms/FieldError'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  isGoogleDrivePickerConfigured,
  pickGoogleDriveImage,
  preloadGooglePicker,
  toDriveImageSrc,
} from '@/lib/google-drive'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

export interface GoogleDrivePhotoFieldProps {
  label?: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  error?: string | undefined
  hint?: string
  containerClassName?: string
}

export function GoogleDrivePhotoField({
  label = 'Photo',
  value,
  onChange,
  disabled = false,
  error,
  hint = 'Opens Google Drive so you can pick an image. The shareable link is saved automatically.',
  containerClassName,
}: GoogleDrivePhotoFieldProps): ReactNode {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const [picking, setPicking] = useState(false)
  const previewSrc = toDriveImageSrc(value)
  const configured = isGoogleDrivePickerConfigured()

  useEffect(() => {
    if (configured) void preloadGooglePicker().catch(() => undefined)
  }, [configured])

  const handlePick = async () => {
    if (disabled || picking) return
    setPicking(true)
    try {
      const picked = await pickGoogleDriveImage()
      if (!picked) return
      onChange(picked.url)
    } catch (cause) {
      logger.error('Google Drive photo pick failed', cause)
      toast.error(cause instanceof Error ? cause.message : 'Could not open Google Drive')
    } finally {
      setPicking(false)
    }
  }

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
          {previewSrc ? (
            <img src={previewSrc} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {value ? (
            <p className="type-caption break-all text-muted-foreground">Link extracted from Google Drive.</p>
          ) : (
            <p className="type-caption text-muted-foreground">No photo selected yet.</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              id={id}
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled || picking || !configured}
              onClick={() => void handlePick()}
              aria-describedby={[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined}
            >
              {picking ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
              {value ? 'Change photo' : 'Choose from Google Drive'}
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || picking}
                onClick={() => onChange('')}
              >
                <X aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {hint ? (
        <p id={hintId} className="type-caption text-muted-foreground">
          {configured ? hint : 'Google Drive picker needs VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY.'}
        </p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  )
}
