import { logger } from '@/lib/logger'
import type { Session } from '@/auth/auth.types'

/**
 * Session persistence.
 *
 * The backend issues a bearer JWT with no refresh token and sets no cookie, so
 * the token must be held by the client to survive a page reload. `localStorage`
 * is therefore the only option that satisfies "remember me"; it is readable by
 * any script on the origin, which is an accepted (and documented) limitation of
 * the current backend design — a httpOnly cookie would require backend changes.
 *
 * When the user does not opt in, the session is kept in `sessionStorage` so it
 * dies with the browser tab.
 */
const STORAGE_KEY = 'dira.session.v1'

/** Records which store holds the session so it can be cleared reliably. */
const PERSISTENCE_KEY = 'dira.session.persistent.v1'

function safeStorage(kind: 'local' | 'session'): Storage | null {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage
    // Touch the store: Safari private mode and blocked-cookie contexts throw here.
    const probe = '__dira_probe__'
    store.setItem(probe, probe)
    store.removeItem(probe)
    return store
  } catch (error) {
    logger.warn(`${kind}Storage unavailable`, error)
    return null
  }
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  const user = candidate.user

  return (
    typeof candidate.token === 'string' &&
    candidate.token.length > 0 &&
    (candidate.expiresAt === null || typeof candidate.expiresAt === 'number') &&
    typeof user === 'object' &&
    user !== null &&
    typeof (user as Record<string, unknown>).username === 'string' &&
    typeof (user as Record<string, unknown>).role === 'string'
  )
}

export const sessionStorageAdapter = {
  read(): Session | null {
    for (const kind of ['local', 'session'] as const) {
      const raw = safeStorage(kind)?.getItem(STORAGE_KEY)
      if (!raw) continue

      try {
        const parsed: unknown = JSON.parse(raw)
        if (isSession(parsed)) return parsed
        logger.warn('Discarding malformed stored session')
      } catch (error) {
        logger.warn('Discarding unparseable stored session', error)
      }

      safeStorage(kind)?.removeItem(STORAGE_KEY)
    }

    return null
  },

  write(session: Session, persistent: boolean): void {
    // Clear both stores first so a session can never exist in two places.
    this.clear()

    const store = safeStorage(persistent ? 'local' : 'session')
    if (!store) return

    try {
      store.setItem(STORAGE_KEY, JSON.stringify(session))
      store.setItem(PERSISTENCE_KEY, String(persistent))
    } catch (error) {
      logger.warn('Failed to persist session', error)
    }
  },

  clear(): void {
    for (const kind of ['local', 'session'] as const) {
      const store = safeStorage(kind)
      store?.removeItem(STORAGE_KEY)
      store?.removeItem(PERSISTENCE_KEY)
    }
  },

  /** Whether the stored session was created with "remember me" enabled. */
  isPersistent(): boolean {
    return safeStorage('local')?.getItem(PERSISTENCE_KEY) === 'true'
  },
}
