/**
 * push-channel.interface.ts — 推送通道接口定义
 *
 * WP-13A: 邮件 + 短信双通道
 * BS-0168 ~ BS-0184
 *
 * 定义统一的推送通道抽象，支持双通道主备路由。
 * 一个通道发送失败时自动切换到另一个通道。
 */

import { PushBusinessPriority } from '../push-priority.enum'

/**
 * 推送通道统一请求
 */
export interface PushChannelRequest {
  /** 接收方标识（邮箱地址 / 手机号） */
  recipient: string
  /** 标题（部分通道如邮件使用） */
  subject?: string
  /** 正文 */
  body: string
  /** 推送分级 */
  priority: PushBusinessPriority
  /** 租户 ID */
  tenantId: string
  /** 会员 ID */
  memberId?: string
  /** 额外参数（各通道特殊参数） */
  extra?: Record<string, unknown>
}

/**
 * 推送通道统一响应
 */
export interface PushChannelResponse {
  /** 是否成功 */
  success: boolean
  /** 提供商标识 */
  providerId?: string
  /** 错误消息 */
  error?: string
  /** 响应耗时 (ms) */
  elapsedMs: number
}

/**
 * 推送通道接口
 * 所有通道实现需实现此接口
 */
export interface PushChannel {
  /** 通道名称 */
  readonly name: string

  /** 通道是否可用 */
  readonly available: boolean

  /**
   * 发送推送
   * @returns 发送结果
   */
  send(request: PushChannelRequest): Promise<PushChannelResponse>

  /**
   * 健康检查
   */
  healthCheck(): Promise<boolean>
}

/**
 * 通道优先级配置
 * primary: 主通道
 * fallback: 备用通道
 */
export interface ChannelRoutingConfig {
  primary: string
  fallback: string
}

/**
 * 默认通道路由
 * 主: 邮件, 备: 短信
 */
export const DEFAULT_CHANNEL_ROUTING: ChannelRoutingConfig = {
  primary: 'email',
  fallback: 'sms',
}
