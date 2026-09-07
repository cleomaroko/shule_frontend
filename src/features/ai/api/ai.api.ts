import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'

const CHAT_TIMEOUT_MS = 45_000

export const aiApi = {
  /** GET `/api/shule-ai/chat?message=` — returns plain text, not an ApiResponse. */
  chat: (message: string) =>
    api.getText(endpoints.shuleAi.chat, {
      params: { message },
      timeout: CHAT_TIMEOUT_MS,
    }),
}
