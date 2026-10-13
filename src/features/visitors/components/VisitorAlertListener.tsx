import { Client, type IMessage } from '@stomp/stompjs'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import SockJS from 'sockjs-client'
import { toast } from 'sonner'

import { queryKeys } from '@/api/endpoints'
import { useAuth } from '@/auth/useAuth'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

interface VisitorAlertPayload {
  title?: string
  message?: string
  visitorName?: string
  visitorPhone?: string
}

/**
 * SockJS handshake URL. Same origin when the API is the relative `/api` proxy,
 * otherwise the host that serves `/api`.
 */
function visitorSocketUrl(): string {
  if (env.apiBaseUrl.startsWith('http')) {
    return `${env.apiBaseUrl.replace(/\/api$/, '')}/ws`
  }
  return '/ws'
}

/**
 * SockJS advertises itself at `/ws/info` as JSON. On dira365.com that path is
 * served by the static site, which returns the app HTML. Connecting anyway
 * makes the browser report failed websockets, a wrong event-stream type, and
 * 405 responses.
 */
async function visitorSocketReady(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/info?t=${Date.now()}`, { headers: { Accept: 'application/json' } })
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !type.includes('json')) return false
    const body: unknown = await response.json()
    return typeof body === 'object' && body !== null && 'websocket' in body
  } catch {
    return false
  }
}

/** The broker publishes to the staff work email, which may be the username or the account email. */
function notificationTopics(username: string, email: string | undefined): string[] {
  const identities = [username, email]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
  return [...new Set(identities)].map((identity) => `/topic/notifications/${identity}`)
}

/**
 * Live visitor alerts. The backend no longer exposes an SSE stream; check-in
 * publishes a STOMP message to `/topic/notifications/{staffWorkEmail}` on `/ws`.
 */
export function VisitorAlertListener(): null {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const username = user?.username
  const email = user?.email

  useEffect(() => {
    if (!username) return
    const topics = notificationTopics(username, email)
    if (topics.length === 0) return

    const socketUrl = visitorSocketUrl()
    let client: Client | null = null
    let stopped = false

    void visitorSocketReady(socketUrl).then((ready) => {
      if (!ready || stopped) {
        if (!stopped) logger.warn('Visitor alerts are off because /ws is not the notification socket')
        return
      }

      const stomp = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        reconnectDelay: 5000,
        onConnect: () => {
          for (const topic of topics) {
            stomp.subscribe(topic, (message: IMessage) => {
              let payload: VisitorAlertPayload = {}
              try {
                payload = JSON.parse(message.body) as VisitorAlertPayload
              } catch {
                payload = { message: message.body }
              }
              const phone = payload.visitorPhone?.trim()
              const description = payload.message || [payload.visitorName, phone].filter(Boolean).join(' · ')
              const title = payload.title || 'Visitor at reception'
              if (description) toast.info(title, { description })
              else toast.info(title)
              void queryClient.invalidateQueries({ queryKey: queryKeys.visitors.all })
            })
          }
        },
        onStompError: (frame) => {
          logger.warn('Visitor alert broker error', frame.headers.message)
        },
        onWebSocketError: (event) => {
          logger.warn('Visitor alert socket error', event)
        },
      })

      client = stomp
      stomp.activate()
    })

    return () => {
      stopped = true
      void client?.deactivate()
    }
  }, [email, queryClient, username])

  return null
}
