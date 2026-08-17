import { env } from '@/lib/env'

/**
 * Diagnostic logging that is stripped of noise in production builds.
 *
 * Users are shown normalised, human-readable messages; the underlying technical
 * cause is preserved here so developers keep the detail they need.
 */
export const logger = {
  debug(message: string, ...details: unknown[]): void {
    if (env.isDevelopment) {
      console.debug(`[dira] ${message}`, ...details)
    }
  },

  warn(message: string, ...details: unknown[]): void {
    if (env.isDevelopment) {
      console.warn(`[dira] ${message}`, ...details)
    }
  },

  error(message: string, ...details: unknown[]): void {
    console.error(`[dira] ${message}`, ...details)
  },
}
