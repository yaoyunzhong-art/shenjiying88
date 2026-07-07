/**
 * omnichannel.dto.ts - 全渠道触达 DTO
 *
 * 对接 OmnichannelReachService / SMSDualChannelService / InternationalEmailService API
 */

import type { ChannelType, Locale, DeliveryStatus, ChannelStatus, SmsChannel } from './omnichannel.entity'

export interface ReachRequest {
  memberId: string
  channel: ChannelType
  content: string
}

export interface ReachAllRequest {
  memberIds: string[]
  channel: ChannelType
  content: string
}

export interface SendSmsRequest {
  phone: string
  content: string
  preferBackup?: boolean
}

export interface SendEmailRequest {
  to: string
  subject: string
  body: string
  locale?: Locale
}

export interface SendBulkEmailRequest {
  recipients: string[]
  subject: string
  body: string
  locale?: Locale
}

export interface RenderTemplateRequest {
  templateId: string
  locale: Locale
  data: Record<string, string>
}

export interface SetChannelStatusRequest {
  channel: ChannelType
  status: ChannelStatus
}

export interface ReachResponse {
  success: boolean
  messageId: string
  channel: ChannelType
  timestamp: string
  error?: string
}

export interface ChannelStatusResponse {
  channel: ChannelType
  status: ChannelStatus
  lastChecked: string
}

export interface DeliveryHistoryQuery {
  memberId: string
  channel?: ChannelType
  limit?: number
  offset?: number
}

export interface DeliveryHistoryItem {
  id: string
  memberId: string
  channel: ChannelType
  content: string
  status: DeliveryStatus
  messageId: string
  timestamp: string
}

export interface SmsDeliveryStatusResponse {
  messageId: string
  status: DeliveryStatus
  channel: SmsChannel
  timestamp: string
}

export interface EmailDeliveryStatusResponse {
  messageId: string
  status: DeliveryStatus
  locale: Locale
  timestamp: string
}
