/**
 * 🐜 自动: [omnichannel] [A] contract 补全
 *
 * 全渠道触达：跨模块合约类型
 * 定义 omnichannel 模块对外暴露的稳定合约接口，
 * 供其他模块（notification, campaign, marketing, ai-push 等）消费。
 */
import type {
  ChannelType,
  ChannelStatus,
  DeliveryStatus,
  Locale,
  SmsChannel,
  OmnichannelDelivery,
  ChannelConfig,
} from './omnichannel.entity'

/**
 * 触达结果合约（跨模块安全子集）
 */
export interface ReachResultContract {
  success: boolean
  messageId: string
  channel: ChannelType
  timestamp: string
  error?: string
}

/**
 * 批量触达结果合约
 */
export interface BatchReachResultContract {
  results: ReachResultContract[]
  total: number
}

/**
 * 短信投递状态合约
 */
export interface SmsDeliveryStatusContract {
  messageId: string
  status: DeliveryStatus
  channel: SmsChannel
  timestamp: string
}

/**
 * 邮件投递状态合约
 */
export interface EmailDeliveryStatusContract {
  messageId: string
  status: DeliveryStatus
  locale: Locale
  timestamp: string
}

/**
 * 渠道配置合约
 */
export interface ChannelConfigContract {
  channel: ChannelType
  status: ChannelStatus
  priority: number
  fallbackChannels: ChannelType[]
}

/**
 * 渠道状态查询结果
 */
export interface ChannelStatusContract {
  channel: ChannelType
  status: ChannelStatus
  lastChecked: string
}

/**
 * 触达历史合约项
 */
export interface DeliveryHistoryContract {
  id: string
  memberId: string
  channel: ChannelType
  content: string
  status: DeliveryStatus
  messageId: string
  timestamp: string
}

/**
 * 渲染模板合约
 */
export interface RenderedTemplateContract {
  templateId: string
  locale: Locale
  rendered: string
}

/**
 * 全渠道触达 API 合约
 * 其他模块可通过此接口调用 omnichannel 功能
 */
export const OmnichannelContractVersion = '1.0.0'

/**
 * 检查合约版本兼容性
 */
export function checkContractCompatibility(consumerVersion: string): boolean {
  const [major] = consumerVersion.split('.').map(Number)
  const [contractMajor] = OmnichannelContractVersion.split('.').map(Number)
  return major === contractMajor
}
