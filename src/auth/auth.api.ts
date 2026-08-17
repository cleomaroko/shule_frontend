import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { ApiResult } from '@/api/types'
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponseData,
  ResetPasswordRequest,
} from '@/auth/auth.types'

/**
 * Thin, one-to-one bindings to the backend auth endpoints. No orchestration or
 * state handling lives here — see `auth.service.ts`.
 */
export const authApi = {
  login(body: LoginRequest): Promise<ApiResult<LoginResponseData>> {
    return api.post<LoginResponseData>(endpoints.auth.login, body)
  },

  /** Triggers the 6-digit reset code email. Responds with a message, no data. */
  forgotPassword(body: ForgotPasswordRequest): Promise<ApiResult<null>> {
    return api.post<null>(endpoints.auth.forgotPassword, body)
  },

  resetPassword(body: ResetPasswordRequest): Promise<ApiResult<null>> {
    return api.post<null>(endpoints.auth.resetPassword, body)
  },
}
