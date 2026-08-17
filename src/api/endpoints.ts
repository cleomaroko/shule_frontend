/**
 * Every backend route the frontend is allowed to call, resolved relative to
 * `env.apiBaseUrl` (which already includes the `/api` prefix).
 *
 * Only routes verified to exist in the Java source are listed. Authentication is
 * the sole implemented module, so `auth` is intentionally the only entry —
 * future ERP modules should be added here rather than inlined at call sites.
 *
 * Source: `com.lyrt.shule.auth.AuthController` (@RequestMapping("/api/auth"))
 */
export const endpoints = {
  auth: {
    /** POST — `{ username, password }` */
    login: '/auth/login',
    /** POST — `{ email }`; emails a 6-digit code valid for 10 minutes */
    forgotPassword: '/auth/forgot-password',
    /** POST — `{ email, code, newPassword, confirmPassword }` */
    resetPassword: '/auth/reset-password',
  },
} as const
