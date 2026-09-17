const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export const GOOGLE_DRIVE_IMAGE_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp'
export const GOOGLE_DRIVE_DOCUMENT_ACCEPT =
  'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx'

export interface UploadedDriveImage {
  id: string
  name: string
  url: string
}

export type UploadedDriveFile = UploadedDriveImage

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

function documentTypeFromName(name: string): string {
  const lower = name.trim().toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (lower.endsWith('.doc')) return 'application/msword'
  return ''
}

export function googleDriveDocumentMimeType(file: File): string {
  const type = file.type.trim().toLowerCase()
  if (ALLOWED_DOCUMENT_TYPES.has(type)) return type
  return documentTypeFromName(file.name)
}

export function assertGoogleDriveDocumentFile(file: File): void {
  if (!file.size) {
    throw new Error('The selected file is empty.')
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('Choose a PDF or Word document smaller than 15 MB.')
  }
  if (!googleDriveDocumentMimeType(file)) {
    throw new Error('Use a PDF or Word document (.pdf, .doc, or .docx).')
  }
}
