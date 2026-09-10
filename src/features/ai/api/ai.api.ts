import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { env } from '@/lib/env'

/** Ollama on the VPS is configured for 300s; wait just above that. */
const CHAT_TIMEOUT_MS = 310_000

export const aiApi = {
  /** GET `http://162.35.96.90/api/shule-ai/chat?message=` — plain text, not an ApiResponse. */
  chat: (message: string) =>
    api.getText(endpoints.shuleAi.chat, {
      baseURL: env.aiApiBaseUrl,
      params: { message },
      timeout: CHAT_TIMEOUT_MS,
    }),
}
