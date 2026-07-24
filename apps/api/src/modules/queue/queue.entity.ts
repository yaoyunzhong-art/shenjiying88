export enum QueueType {
  Booking = 'booking',
  Waiting = 'waiting',
  Service = 'service'
}

export enum QueueStatus {
  Waiting = 'waiting',
  Called = 'called',
  Serving = 'serving',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no_show'
}

/**
 * WP-12A: 双模排队 — 来源
 * Online: 线上排队（预取号/远程排队，通过微信/App）
 * Onsite: 现场排队（扫码取号，通过终端/Kiosk）
 */
export enum QueueSource {
  Online = 'online',
  Onsite = 'onsite'
}

/**
 * WP-12A: 排队入口渠道
 * WeChat: 微信小程序
 * App: 品牌 App
 * Terminal: 门店终端（扫码取号）
 * Kiosk: 自助取号机
 */
export enum QueueChannel {
  WeChat = 'wechat',
  App = 'app',
  Terminal = 'terminal',
  Kiosk = 'kiosk'
}

export const QUEUE_STATUS_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  [QueueStatus.Waiting]: [QueueStatus.Called, QueueStatus.Cancelled],
  [QueueStatus.Called]: [QueueStatus.Serving, QueueStatus.NoShow, QueueStatus.Cancelled],
  [QueueStatus.Serving]: [QueueStatus.Completed, QueueStatus.Cancelled],
  [QueueStatus.Completed]: [],
  [QueueStatus.Cancelled]: [],
  [QueueStatus.NoShow]: []
}

export class QueueEntity {
  id!: string
  tenantId!: string
  type!: QueueType
  queueNumber!: string
  userId!: string
  userName!: string
  phone?: string
  partySize!: number
  resourceId?: string
  resourceName?: string
  status!: QueueStatus
  priority!: number
  estimatedWaitMin!: number
  actualWaitMin?: number
  calledAt?: Date
  servedAt?: Date
  completedAt?: Date
  remark?: string

  /** WP-12A: 排队来源（线上/现场） */
  source!: QueueSource
  /** WP-12A: 排队入口渠道 */
  channel!: QueueChannel

  createdAt!: Date
  updatedAt!: Date
}
