import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'

import { ApiError } from '@/api/errors'
import type { ApiEnvelope, ApiResult } from '@/api/types'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

const REQUEST_TIMEOUT_MS = 20_000

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

type TokenProvider = () => string | null
type UnauthorizedHandler = () => void

let tokenProvider: TokenProvider = () => null
let unauthorizedHandler: UnauthorizedHandler = () => {}

/**
 * Lets the auth module supply the bearer token without the API layer importing
 * it, which keeps this module free of auth-specific dependencies.
 */
export function setAuthTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider
}

/** Registers the callback used to tear down the session on a 401/403. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler
}

httpClient.interceptors.request.use((config) => {
  const token = tokenProvider()
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

/** Maps an Axios failure onto the normalised `ApiError` taxonomy. */
function normaliseAxiosError(error: AxiosError): ApiError {
  const detail = error.response?.data ?? error.message

  if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
    return new ApiError({ kind: 'timeout', message: 'Request timed out', detail, cause: error })
  }

  if (!error.response) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    return new ApiError({
      kind: offline ? 'offline' : 'network',
      message: offline ? 'Browser is offline' : 'Backend unreachable',
      detail,
      cause: error,
    })
  }

  const { status } = error.response

  if (status === 401 || status === 403) {
    return new ApiError({ kind: 'unauthorized', message: 'Not authorised', status, detail, cause: error })
  }

  if (status === 404) {
    return new ApiError({ kind: 'notFound', message: 'Endpoint not found', status, detail, cause: error })
  }

  if (status >= 500) {
    return new ApiError({ kind: 'server', message: 'Backend error', status, detail, cause: error })
  }

  return new ApiError({ kind: 'unknown', message: 'Unexpected response', status, detail, cause: error })
}

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = axios.isAxiosError(error)
      ? normaliseAxiosError(error)
      : new ApiError({ kind: 'unknown', message: 'Unexpected failure', detail: error, cause: error })

    if (apiError.kind === 'unauthorized') {
      unauthorizedHandler()
    }

    logger.warn(`Request failed (${apiError.kind})`, apiError.detail)
    return Promise.reject(apiError)
  },
)

function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return typeof body === 'object' && body !== null && 'success' in body
}

/**
 * Unwraps the backend's `ApiResponse` envelope.
 *
 * The backend returns HTTP 200 for declined requests, so this is where a
 * `success: false` body becomes a rejected promise.
 */
function unwrapEnvelope<T>(response: AxiosResponse<unknown>): ApiResult<T> {
  const body = response.data

  if (!isEnvelope(body)) {
    throw new ApiError({
      kind: 'unknown',
      message: 'Malformed response body',
      status: response.status,
      detail: body,
    })
  }

  if (!body.success) {
    throw new ApiError({
      kind: 'business',
      // Backend-authored copy from `ApiResponse.error(...)` — safe to display.
      message: body.message ?? '',
      status: response.status,
      detail: body,
    })
  }

  return { message: body.message, data: body.data as T }
}

/** Issues a request and returns the unwrapped envelope payload. */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
  const response = await httpClient.request<unknown>(config)
  return unwrapEnvelope<T>(response)
}

export const api = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return apiRequest<T>({ ...config, url, method: 'GET' })
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return apiRequest<T>({ ...config, url, method: 'POST', data })
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return apiRequest<T>({ ...config, url, method: 'PUT', data })
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return apiRequest<T>({ ...config, url, method: 'DELETE' })
  },
}
