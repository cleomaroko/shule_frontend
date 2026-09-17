import {
  assertGoogleDriveDocumentFile,
  assertGoogleDriveImageFile,
  extractDriveFileId,
  googleDriveDocumentMimeType,
  type UploadedDriveFile,
} from '@/lib/google-drive'
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

function toUploadedFile(payload: DriveScriptResponse): UploadedDriveFile | null {
  if (payload.success === false) {
    throw new Error(payload.message || 'Google Drive rejected the file.')
  }
  if (payload.pending) return null
  const url = payload.url || payload.fileUrl || payload.webViewLink || ''
  const id = payload.id || extractDriveFileId(url) || ''
  if (!url && !id) return null
  return {
    id,
    name: payload.name || 'file',
    url: url || `https://drive.google.com/file/d/${id}/view?usp=sharing`,
  }
}

function statusUrl(endpoint: string, requestId: string): string {
  const url = new URL(endpoint)
  url.searchParams.set('request_id', requestId)
  return url.toString()
}

async function waitForShareLink(endpoint: string, requestId: string, deadline: number): Promise<UploadedDriveFile> {
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
    const uploaded = toUploadedFile(parseJson(await response.text()))
    if (uploaded) return uploaded
    await delay(POLL_INTERVAL_MS)
  }
  throw new Error(
    'The file did not finish uploading. Paste the latest DriveUpload.gs, deploy a new version (Anyone), and try again.',
  )
}

async function postFileToSchoolDrive(file: File, mimeType?: string): Promise<UploadedDriveFile> {
  const endpoint = env.googleDriveUploadUrl
  if (!endpoint) {
    throw new Error(
      'File upload is not configured. Set VITE_GOOGLE_DRIVE_UPLOAD_URL to the deployed Apps Script web app URL.',
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
      mime_type: mimeType || file.type,
    }),
  })

  return waitForShareLink(endpoint, requestId, deadline)
}

/**
 * Saves the image in the school Drive via the same browser → Apps Script path
 * as the careers form: POST with `no-cors` (`ApplyModal`), then GET the JSON
 * (`CareersPage`). Java only stores the returned share link.
 */
export async function uploadImageToSchoolDrive(file: File): Promise<UploadedDriveFile> {
  assertGoogleDriveImageFile(file)
  return postFileToSchoolDrive(file)
}

function isStaleImageOnlyDriveScript(message: string): boolean {
  return /png,\s*jpeg,\s*gif,\s*or\s*webp image/i.test(message) && !/pdf/i.test(message)
}

/** Same Drive web app as staff photos; Java only stores the returned share link. */
export async function uploadDocumentToSchoolDrive(file: File): Promise<UploadedDriveFile> {
  assertGoogleDriveDocumentFile(file)
  try {
    return await postFileToSchoolDrive(file, googleDriveDocumentMimeType(file))
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (isStaleImageOnlyDriveScript(message)) {
      throw new Error(
        'Google Drive is still set to photos only. Paste the updated Example Files/DriveUpload.gs into the Apps Script project, deploy a new web app version with access Anyone, then try the PDF or Word file again.',
      )
    }
    throw error
  }
}
