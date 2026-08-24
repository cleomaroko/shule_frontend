import { useEffect, useState, type ReactNode } from 'react'

import { AvatarImage } from '@/components/ui/avatar'
import { driveImageSrcCandidates } from '@/lib/google-drive'
import { cn } from '@/lib/utils'

function nextSrcIndex(current: number, total: number): number {
  return current + 1 < total ? current + 1 : current
}

/** Profile/list avatar image. Falls back through Drive URL formats; Radix shows initials if all fail. */
export function DriveAvatarImage({
  url,
  alt = '',
}: {
  url: string | null | undefined
  alt?: string
}): ReactNode {
  const candidates = driveImageSrcCandidates(url)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [url])

  const src = candidates[index]
  if (!src) return null

  return (
    <AvatarImage
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setIndex((current) => nextSrcIndex(current, candidates.length))}
    />
  )
}

/** Inline preview (form field). `referrerPolicy` is required or Google often returns 403. */
export function DrivePhoto({
  url,
  alt = '',
  className,
}: {
  url: string | null | undefined
  alt?: string
  className?: string
}): ReactNode {
  const candidates = driveImageSrcCandidates(url)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [url])

  const src = candidates[index]
  if (!src) return null

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={cn('size-full object-cover', className)}
      onError={() => setIndex((current) => nextSrcIndex(current, candidates.length))}
    />
  )
}
