/**
 * push-preference.entity.ts — 用户推送偏好
 *
 * WP-13B: C端便捷化 (BS-0164~BS-0167)
 *
 * 功能:
 * - 每个用户可独立配置推送偏好
 * - 免打扰时间段 (用户级，覆盖租户级 DND)
 * - 推送类型开启/关闭 (按 PushBusinessPriority)
 * - 通道偏好 (优先使用哪种渠道)
 * - 一键关闭 P3 营销推送
 */

import { PushBusinessPriority } from './push-priority.enum'

/**
 * 用户推送偏好
 *
 * 存储维度: memberId (或 userId)
 * 每个用户在系统中只有一条偏好记录
 */
export interface PushUserPreference {
  /** 成员/用户 ID */
  memberId: string
  /** 租户 ID */
  tenantId: string

  // ── 时间偏好 ──

  /** 是否启用用户级免打扰时段 */
  dndEnabled: boolean
  /** 免打扰起始时间 (HH:mm, 24h) */
  dndStartTime: string
  /** 免打扰结束时间 (HH:mm, 24h) */
  dndEndTime: string

  // ── 推送类型偏好 ──

  /**
   * 按推送分级开启/关闭
   * key: PushBusinessPriority, value: 是否接收
   * 默认: P0/P1/P2 开启, P3 关闭 (用户主动开启)
   */
  priorityEnabled: Partial<Record<PushBusinessPriority, boolean>>

  /** 是否允许营销推送 (P3 一键关闭) */
  marketingPushEnabled: boolean

  // ── 通道偏好 ──

  /**
   * 首选通道
   * 可选值: 'email' | 'sms' | 'in_app' | 'push'
   */
  preferredChannel: string

  /** 备选通道 (降级时使用) */
  fallbackChannels: string[]

  // ── 元信息 ──

  /** 最后更新时间 */
  updatedAt: string
  /** 创建时间 */
  createdAt: string
}

/**
 * 默认用户推送偏好
 */
export const DEFAULT_USER_PUSH_PREFERENCE: Omit<PushUserPreference, 'memberId' | 'tenantId' | 'createdAt'> = {
  dndEnabled: false,
  dndStartTime: '22:00',
  dndEndTime: '08:00',
  priorityEnabled: {
    [PushBusinessPriority.P0]: true,
    [PushBusinessPriority.P1]: true,
    [PushBusinessPriority.P2]: true,
    [PushBusinessPriority.P3]: false, // 默认关闭营销推送
  },
  marketingPushEnabled: false, // 默认关闭
  preferredChannel: 'push',
  fallbackChannels: ['email', 'sms'],
  updatedAt: new Date().toISOString(),
}
