import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'

/** Ollama on the VPS is configured for 300s; wait just above that. */
const CHAT_TIMEOUT_MS = 310_000

export const aiApi = {
  /**
   * GET `/api/shule-ai/chat?message=` — plain text, not an ApiResponse.
   *
   * The browser must stay same-origin (HTTPS on dira365.com). Vite / nginx
   * forward this path to `http://162.35.96.90/api/shule-ai/chat?message=`.
   */
  chat: (message: string) =>
    api.getText(endpoints.shuleAi.chat, {
      params: { message },
      timeout: CHAT_TIMEOUT_MS,
    }),
}
