import { api } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { EmailUsage, SystemLog } from '@/features/system/types/system.types'

export const systemApi = {
  logs: () => api.get<SystemLog[]>(endpoints.system.logs).then((r) => r.data ?? []),
  emailUsage: () =>
    api.get<EmailUsage>(endpoints.system.emailUsage).then((r) => {
      if (r.data == null) {
        return { sentToday: 0, dailyLimit: 500, remaining: 500 }
      }
      return r.data
    }),
  resetToDefaults: () => api.post<string | null>(endpoints.system.reset).then((r) => r.message),
}
