export enum PushPlatform {
  iOS = 'iOS',
  Android = 'ANDROID',
  Web = 'WEB'
}

export enum PushStatus {
  Pending = 'PENDING',
  Sent = 'SENT',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED',
  Revoked = 'REVOKED'
}

export enum PushPriority {
  High = 'HIGH',
  Normal = 'NORMAL',
  Low = 'LOW'
}

export enum PushScheduleStatus {
  Pending = 'PENDING',
  Sent = 'SENT',
  Cancelled = 'CANCELLED'
}

export interface PushTemplate {
  id: string
  code: string
  platform: PushPlatform
  tenantId: string
  brandId?: string
  storeId?: string
  title?: string
  body: string
  sound?: string
  badge?: number
  extra?: Record<string, unknown>
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface PushRecord {
  id: string
  deviceToken: string
  platform: PushPlatform
  payload: {
    alert: string
    badge?: number
    sound?: string
    extra?: Record<string, unknown>
  }
  priority: PushPriority
  status: PushStatus
  sentAt: string
  tenantId?: string
  memberId?: string
}

export interface ScheduledPush {
  id: string
  memberId: string
  tenantId: string
  content: string
  platform: PushPlatform
  sendAt: Date
  status: PushScheduleStatus
  createdAt: string
}

export interface WSClient {
  clientId: string
  userId: string
  tenantId?: string
  connectedAt: string
  sessionId?: string
  platform?: PushPlatform
}

export interface WSMessage {
  channel: string
  data: unknown
  from?: string
  timestamp?: string
}

export interface PushStats {
  totalSent: number
  totalFailed: number
  activeConnections: number
  scheduledCount: number
  byPlatform: Record<PushPlatform, number>
}
