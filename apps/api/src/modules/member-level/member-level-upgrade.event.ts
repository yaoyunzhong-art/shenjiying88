/**
 * member-level 等级升级事件定义
 *
 * 当成长值/累计消费/到访次数跨过等级阈值时触发。
 * 消费方（交易/优惠券/推送）通过注入事件总线监听此事件，
 * 以执行升级欢迎、权益发放等后续动作。
 *
 * BS-0114/BS-0115 门禁级功能
 */

import type { MemberLevelTier, MemberLevelSub, MemberLevelKey } from './member-level.entity'

/**
 * 等级升级事件载荷
 */
export interface MemberLevelUpgradeEvent {
  /** 事件类型 */
  eventType: 'member-level.upgraded'
  /** 触发时间（ISO 8601） */
  timestamp: string
  /** 升级的会员 ID */
  memberId: string
  /** 所属租户 */
  tenantId: string
  /** 升级前等级 KEY */
  fromLevelKey: MemberLevelKey
  /** 升级后等级 KEY */
  toLevelKey: MemberLevelKey
  /** 升级前 tier */
  fromTier: MemberLevelTier
  /** 升级后 tier */
  toTier: MemberLevelTier
  /** 当前成长值 */
  growthValue: number
  /** 当前累计消费 */
  totalSpend: number
  /** 当前到访次数 */
  totalVisits: number
  /** 新增权益列表 */
  newBenefits: string[]
  /** 升级原因 */
  reason: string
}

/**
 * 等级降级事件载荷
 */
export interface MemberLevelDowngradeEvent {
  /** 事件类型 */
  eventType: 'member-level.downgraded'
  /** 触发时间（ISO 8601） */
  timestamp: string
  /** 降级的会员 ID */
  memberId: string
  /** 所属租户 */
  tenantId: string
  /** 降级前等级 KEY */
  fromLevelKey: MemberLevelKey
  /** 降级后等级 KEY */
  toLevelKey: MemberLevelKey
  /** 降级前 tier */
  fromTier: MemberLevelTier
  /** 降级后 tier */
  toTier: MemberLevelTier
  /** 当前成长值 */
  growthValue: number
  /** 降级原因 */
  reason: string
}

/**
 * 等级变更事件（升级或降级）
 */
export type MemberLevelChangeEvent = MemberLevelUpgradeEvent | MemberLevelDowngradeEvent

/**
 * 常量：事件类型字符串
 */
export const MEMBER_LEVEL_EVENTS = {
  UPGRADED: 'member-level.upgraded',
  DOWNGRADED: 'member-level.downgraded'
} as const
