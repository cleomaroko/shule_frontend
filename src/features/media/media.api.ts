import { extractDriveFileId, assertGoogleDriveImageFile, type UploadedDriveImage } from '@/lib/google-drive'
import { env } from '@/lib/env'

const UPLOAD_TIMEOUT_MS = 60_000
const POLL_INTERVAL_MS = 500

interface DriveScriptResponse {
  success?: boolean
  pending?: boolean
  message?: string
  id?: string
  name?: string
  url?: string
  fileUrl?: string
  webViewLink?: string
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string' || !result) {
        reject(new Error('Could not read that file.'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

function parseJson(body: unknown): DriveScriptResponse {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as DriveScriptResponse
    } catch {
      throw new Error('Google Drive did not return a share link.')
    }
  }
  if (!body || typeof body !== 'object') {
    throw new Error('Google Drive did not return a share link.')
  }
  return body as DriveScriptResponse
}

function toUploadedImage(payload: DriveScriptResponse): UploadedDriveImage | null {
  if (payload.success === false) {
    throw new Error(payload.message || 'Google Drive rejected the photo.')
  }
  if (payload.pending) return null
  const url = payload.url || payload.fileUrl || payload.webViewLink || ''
  const id = payload.id || extractDriveFileId(url) || ''
  if (!url && !id) return null
  return {
    id,
    name: payload.name || 'photo',
    url: url || `https://drive.google.com/file/d/${id}/view?usp=sharing`,
  }
}

function statusUrl(endpoint: string, requestId: string): string {
  const url = new URL(endpoint)
  url.searchParams.set('request_id', requestId)
  return url.toString()
}

async function waitForShareLink(endpoint: string, requestId: string, deadline: number): Promise<UploadedDriveImage> {
  while (Date.now() < deadline) {
    const response = await fetch(statusUrl(endpoint, requestId), {
      method: 'GET',
      credentials: 'omit',
    })
    if (!response.ok) {
      throw new Error(
        'Could not read the Google Drive upload result. Redeploy DriveUpload.gs as a web app with access Anyone.',
      )
    }
    const uploaded = toUploadedImage(parseJson(await response.text()))
    if (uploaded) return uploaded
    await delay(POLL_INTERVAL_MS)
  }
  throw new Error(
    'The photo did not finish uploading. Paste the latest DriveUpload.gs, deploy a new version (Anyone), and try again.',
  )
}

/**
 * Saves the image in the school Drive via the same browser → Apps Script path
 * as the careers form: POST with `no-cors` (`ApplyModal`), then GET the JSON
 * (`CareersPage`). Java only stores the returned share link.
 */
export async function uploadImageToSchoolDrive(file: File): Promise<UploadedDriveImage> {
  assertGoogleDriveImageFile(file)
  const endpoint = env.googleDriveUploadUrl
  if (!endpoint) {
    throw new Error(
      'Photo upload is not configured. Set VITE_GOOGLE_DRIVE_UPLOAD_URL to the deployed Apps Script web app URL.',
    )
  }

  const requestId = crypto.randomUUID()
  const fileData = await readAsDataUrl(file)
  const deadline = Date.now() + UPLOAD_TIMEOUT_MS

  await fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    credentials: 'omit',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      request_id: requestId,
      file_data: fileData,
      file_name: file.name,
      mime_type: file.type,
    }),
  })

  return waitForShareLink(endpoint, requestId, deadline)
}
