import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const GAPI_SRC = 'https://apis.google.com/js/api.js'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const IMAGE_MIME_TYPES = 'image/png,image/jpeg,image/jpg,image/gif,image/webp'

export interface PickedDriveImage {
  id: string
  name: string
  url: string
  /** False when Drive (or Workspace policy) blocked “anyone with the link”. */
  linkShareEnabled: boolean
}

let scriptsPromise: Promise<void> | null = null
let cachedToken: { accessToken: string; expiresAt: number } | null = null

export function isGoogleDrivePickerConfigured(): boolean {
  return Boolean(env.googleClientId && env.googleApiKey)
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

/** Required for staff/asset avatars: `<img>` cannot load a private Drive file. */
async function enableAnyoneWithLink(fileId: string, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions?supportsAllDrives=true`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      },
    )
    if (response.ok) return true
    const body = await response.text()
    if (response.status === 400 && /already exists|alreadyExists/i.test(body)) return true
    logger.warn('Could not enable Drive link sharing', { status: response.status, body })
    return false
  } catch (error) {
    logger.warn('Drive link sharing request failed', error)
    return false
  }
}

function loadScript(src: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
  if (existing) {
    if (existing.dataset.loaded === 'true') return Promise.resolve()
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

function loadPickerApi(): Promise<void> {
  const gapi = window.gapi
  if (!gapi) return Promise.reject(new Error('Google API loader is unavailable'))
  return new Promise((resolve) => {
    gapi.load('picker', () => resolve())
  })
}

export function preloadGooglePicker(): Promise<void> {
  if (!scriptsPromise) {
    scriptsPromise = (async () => {
      await Promise.all([loadScript(GAPI_SRC), loadScript(GIS_SRC)])
      await loadPickerApi()
    })().catch((error: unknown) => {
      scriptsPromise = null
      throw error
    })
  }
  return scriptsPromise
}

function requestAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now + 15_000) {
    return Promise.resolve(cachedToken.accessToken)
  }

  const initTokenClient = window.google?.accounts?.oauth2?.initTokenClient
  if (!initTokenClient) {
    return Promise.reject(new Error('Google sign-in is unavailable'))
  }

  return new Promise((resolve, reject) => {
    const client = initTokenClient({
      client_id: env.googleClientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          const code = response.error ?? ''
          if (code === 'access_denied') {
            reject(
              new Error(
                'This Google account is not a tester for Dira yet. Add it under Google Cloud → OAuth consent screen → Test users, then try again.',
              ),
            )
            return
          }
          reject(new Error(response.error_description || code || 'Google Drive access was not granted'))
          return
        }
        const lifetimeMs = (response.expires_in ?? 3600) * 1000
        cachedToken = { accessToken: response.access_token, expiresAt: Date.now() + lifetimeMs }
        resolve(response.access_token)
      },
    })
    client.requestAccessToken()
  })
}

export async function pickGoogleDriveImage(): Promise<PickedDriveImage | null> {
  if (!isGoogleDrivePickerConfigured()) {
    throw new Error('Google Drive picker is not configured. Add VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY.')
  }

  await preloadGooglePicker()
  const accessToken = await requestAccessToken()
  const pickerApi = window.google?.picker
  if (!pickerApi) {
    throw new Error('Google Drive picker failed to load')
  }

  return new Promise((resolve, reject) => {
    try {
      const view = new pickerApi.DocsView(pickerApi.ViewId.DOCS_IMAGES)
        .setIncludeFolders(true)
        .setMimeTypes(IMAGE_MIME_TYPES)

      const builder = new pickerApi.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(env.googleApiKey)
        .setTitle('Select a photo')
        .setOrigin(window.location.origin)
        .setMaxItems(1)
        .setCallback((data) => {
          const action = data[pickerApi.Response.ACTION]
          if (action === pickerApi.Action.CANCEL) {
            resolve(null)
            return
          }
          if (action !== pickerApi.Action.PICKED) return
          const documents = data[pickerApi.Response.DOCUMENTS]
          const doc = Array.isArray(documents) ? documents[0] : undefined
          if (!doc || typeof doc !== 'object') {
            reject(new Error('No image was selected'))
            return
          }
          const record = doc as Record<string, unknown>
          const id = String(record[pickerApi.Document.ID] ?? '')
          if (!id) {
            reject(new Error('Google Drive did not return a file id'))
            return
          }
          void enableAnyoneWithLink(id, accessToken)
            .then((linkShareEnabled) => {
              resolve({
                id,
                name: String(record[pickerApi.Document.NAME] ?? 'Selected image'),
                url: toDriveShareUrl(id),
                linkShareEnabled,
              })
            })
            .catch(() => {
              resolve({
                id,
                name: String(record[pickerApi.Document.NAME] ?? 'Selected image'),
                url: toDriveShareUrl(id),
                linkShareEnabled: false,
              })
            })
        })

      if (env.googleAppId) {
        builder.setAppId(env.googleAppId)
      }

      builder.build().setVisible(true)
    } catch (error) {
      logger.error('Failed to open Google Drive picker', error)
      reject(error instanceof Error ? error : new Error('Failed to open Google Drive'))
    }
  })
}
