const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])

export const GOOGLE_DRIVE_IMAGE_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp'

export interface UploadedDriveImage {
  id: string
  name: string
  url: string
}

export function extractDriveFileId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    const id = match?.[1]
    if (id) return id
  }
  return null
}

/**
 * `<img>` candidates for a saved Drive share URL.
 * Google often blocks `drive.google.com/thumbnail` when the page sends a Referer
 * (localhost / VPS). `lh3.googleusercontent.com` is the URL that actually renders
 * after the file is shared with “anyone with the link”.
 */
export function driveImageSrcCandidates(url: string | null | undefined): string[] {
  if (!url?.trim()) return []
  const id = extractDriveFileId(url)
  if (!id) return [url.trim()]
  return [
    `https://lh3.googleusercontent.com/d/${id}=s400`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w400`,
    `https://drive.google.com/uc?export=view&id=${id}`,
  ]
}

/** First display URL for a saved Drive share link. */
export function toDriveImageSrc(url: string | null | undefined): string | undefined {
  return driveImageSrcCandidates(url)[0]
}

export function toDriveShareUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
}

function normalizeImageType(type: string): string {
  const trimmed = type.trim().toLowerCase()
  if (trimmed === 'image/jpg') return 'image/jpeg'
  return trimmed
}

export function assertGoogleDriveImageFile(file: File): void {
  if (!file.size) {
    throw new Error('The selected file is empty.')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Choose an image smaller than 8 MB.')
  }
  const type = normalizeImageType(file.type)
  if (!ALLOWED_IMAGE_TYPES.has(type)) {
    throw new Error('Use a PNG, JPEG, GIF, or WebP image.')
  }
}
