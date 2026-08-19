export interface SystemLog {
  id: number
  username: string | null
  action: string | null
  details: string | null
  timestamp: string | null
}

export interface EmailUsage {
  sentToday: number
  dailyLimit: number
  remaining: number
}
