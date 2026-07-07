/**
 * omnichannel.entity.ts - 全渠道触达实体定义
 *
 * 核心实体:
 * - OmnichannelDelivery: 单次触达交付记录
 * - OmnichannelTemplate: 消息模板
 * - ChannelConfig: 渠道配置（含双通道/多语言）
 */

export type ChannelType = 'SMS' | 'Email' | 'Push' | 'App'

export type ChannelStatus = 'available' | 'maintenance' | 'failed'

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed'

export type SmsChannel = 'primary' | 'backup'

export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'es-ES'

export interface OmnichannelDelivery {
  id: string
  memberId: string
  channel: ChannelType
  content: string
  status: DeliveryStatus
  messageId: string
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface SmsDeliveryRecord {
  messageId: string
  phone: string
  content: string
  status: DeliveryStatus
  channel: SmsChannel
  createdAt: Date
}

export interface EmailDeliveryRecord {
  messageId: string
  recipient: string
  subject: string
  body: string
  locale: Locale
  status: DeliveryStatus
  createdAt: Date
}

export interface ChannelConfig {
  channel: ChannelType
  status: ChannelStatus
  priority: number
  fallbackChannels: ChannelType[]
  rateLimitPerMinute: number
}

export const DEFAULT_CHANNEL_CONFIGS: ChannelConfig[] = [
  { channel: 'SMS', status: 'available', priority: 1, fallbackChannels: ['Push'], rateLimitPerMinute: 60 },
  { channel: 'Email', status: 'available', priority: 2, fallbackChannels: ['App'], rateLimitPerMinute: 300 },
  { channel: 'Push', status: 'available', priority: 3, fallbackChannels: ['SMS'], rateLimitPerMinute: 600 },
  { channel: 'App', status: 'available', priority: 4, fallbackChannels: ['Push'], rateLimitPerMinute: 1000 },
]
