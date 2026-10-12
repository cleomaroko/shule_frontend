import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { queryKeys } from '@/api/endpoints'
import { useAuth } from '@/auth/useAuth'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

interface VisitorAlertPayload {
  title?: string
  message?: string
  visitorName?: string
}

function parseSseBlock(block: string): { event: string; data: string } {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  return { event, data: dataLines.join('\n') }
}

/**
 * Keeps a staff notification stream open. Native EventSource cannot send the
 * bearer token, so this uses fetch. The controller keys the stream by JWT
 * username, which must match the staff work email to receive alerts.
 */
export function VisitorAlertListener(): null {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    let stopped = false

    const run = async () => {
      while (!stopped) {
        try {
          const response = await fetch(`${env.apiBaseUrl}/visitors/notifications/subscribe`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'text/event-stream',
            },
            signal: controller.signal,
          })
          if (response.status === 401 || response.status === 403) return
          if (!response.ok || !response.body) throw new Error(`Visitor stream ${response.status}`)

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          while (!stopped) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const blocks = buffer.split(/\n\n/)
            buffer = blocks.pop() ?? ''
            for (const block of blocks) {
              const parsed = parseSseBlock(block)
              if (parsed.event !== 'VISITOR_ALERT' || !parsed.data) continue
              let payload: VisitorAlertPayload = {}
              try {
                payload = JSON.parse(parsed.data) as VisitorAlertPayload
              } catch {
                payload = { message: parsed.data }
              }
              toast.info(payload.title || 'Visitor at reception', {
                description: payload.message || payload.visitorName,
              })
              void queryClient.invalidateQueries({ queryKey: queryKeys.visitors.all })
            }
          }
        } catch (error) {
          if (stopped || controller.signal.aborted) return
          logger.warn('Visitor alert stream dropped', error)
        }
        if (stopped) return
        await new Promise((resolve) => setTimeout(resolve, 4000))
      }
    }

    void run()
    return () => {
      stopped = true
      controller.abort()
    }
  }, [queryClient, token])

  return null
}
