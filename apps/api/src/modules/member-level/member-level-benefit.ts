/**
 * 会员权益效果类型定义
 *
 * 将 member-level 中的等级权益字符串解析为可计算的效果，
 * 供交易（checkout 折扣）、优惠券（coupon 发放）、推送（push 触发）使用。
 *
 * BS-0120/BS-0121 门禁级功能
 *
 * @see member-level.entity.ts LevelThreshold.benefits
 * @see member-level.entity.ts LevelInfo.benefits
 */

import type { MemberLevelTier, MemberLevelKey, LevelInfo } from './member-level.entity'

/**
 * 权益效果：折扣
 */
export interface MemberBenefitDiscountEffect {
  type: 'discount'
  /** 折扣倍率 0-1，如 0.95 = 95 折 */
  rate: number
  /** 折扣描述 */
  label: string
}

/**
 * 权益效果：积分倍率
 */
export interface MemberBenefitPointsMultiplierEffect {
  type: 'points-multiplier'
  /** 积分倍率，如 1.2 = 1.2 倍 */
  multiplier: number
  /** 描述 */
  label: string
}

/**
 * 权益效果：优先排队
 */
export interface MemberBenefitPriorityQueueEffect {
  type: 'priority-queue'
  /** 是否无限免排 */
  unlimited: boolean
  /** 描述 */
  label: string
}

/**
 * 权益效果：专属客服
 */
export interface MemberBenefitConciergeEffect {
  type: 'concierge'
  /** 服务等级描述 */
  level: string
  /** 描述 */
  label: string
}

/**
 * 权益效果：礼包
 */
export interface MemberBenefitGiftEffect {
  type: 'gift'
  /** 礼包类型 */
  giftType: string
  /** 描述 */
  label: string
}

/**
 * 权益效果：通用权益（无法结构化的文本标签）
 */
export interface MemberBenefitGenericEffect {
  type: 'generic'
  /** 文本标签 */
  label: string
}

/**
 * 会员权益效果联合类型
 */
export type MemberBenefitEffect = 
  | MemberBenefitDiscountEffect
  | MemberBenefitPointsMultiplierEffect
  | MemberBenefitPriorityQueueEffect
  | MemberBenefitConciergeEffect
  | MemberBenefitGiftEffect
  | MemberBenefitGenericEffect

/**
 * 会员权益决议结果
 */
export interface MemberBenefitResolution {
  /** 等级 KEY */
  levelKey: MemberLevelKey
  /** 等级 tier */
  tier: MemberLevelTier
  /** 原始权益文本 */
  rawBenefits: string[]
  /** 解析后的权益效果列表 */
  effects: MemberBenefitEffect[]
  /** 综合折扣倍率（取最低折扣） */
  compositeDiscountRate: number
  /** 综合积分倍率（取最高倍率） */
  compositePointsMultiplier: number
  /** 是否有无限免排 */
  hasUnlimitedPriority: boolean
}

/**
 * 等级 → 折扣倍率映射
 * 从 LEVEL_THRESHOLDS 中提取的结构化版本
 */
export const TIER_DISCOUNT_RATES: Record<MemberLevelTier, number> = {
  REGULAR: 1.0,
  VIP: 0.95,
  SVIP: 0.85,
  DIAMOND: 0.75,
  LEGEND: 0.6,
  MYTH: 0.45
}

/**
 * 等级 → 积分倍率映射
 */
export const TIER_POINTS_MULTIPLIERS: Record<MemberLevelTier, number> = {
  REGULAR: 1.0,
  VIP: 1.2,
  SVIP: 1.5,
  DIAMOND: 2.0,
  LEGEND: 2.5,
  MYTH: 3.0
}

/**
 * 根据等级信息解析权益效果
 */
export function resolveBenefits(levelInfo: Pick<LevelInfo, 'currentTier' | 'currentLevelKey' | 'benefits'>): MemberBenefitResolution {
  const effects: MemberBenefitEffect[] = []
  const { currentTier, benefits } = levelInfo

  for (const benefit of benefits) {
    // 折扣匹配
    const discountMatch = benefit.match(/折扣(\d+(\.\d+)?)折/)
    if (discountMatch) {
      const rate = parseFloat(discountMatch[1]!) / 10
      effects.push({
        type: 'discount',
        rate,
        label: benefit
      })
      continue
    }

    // 积分倍率匹配
    if (benefit.includes('积分') && benefit.includes('倍')) {
      const multiplierMatch = benefit.match(/(\d+(\.\d+)?)倍/)
      const multiplier = multiplierMatch ? parseFloat(multiplierMatch[1]!) : TIER_POINTS_MULTIPLIERS[currentTier]
      effects.push({
        type: 'points-multiplier',
        multiplier,
        label: benefit
      })
      continue
    }

    // 无限免排
    if (benefit.includes('免排') && benefit.includes('无限')) {
      effects.push({
        type: 'priority-queue',
        unlimited: true,
        label: benefit
      })
      continue
    }

    // 优先排队
    if (benefit.includes('排队') || benefit.includes('优先')) {
      effects.push({
        type: 'priority-queue',
        unlimited: false,
        label: benefit
      })
      continue
    }

    // 专属客服/管家
    if (benefit.includes('客服') || benefit.includes('管家') || benefit.includes('接待')) {
      effects.push({
        type: 'concierge',
        level: benefit,
        label: benefit
      })
      continue
    }

    // 礼包
    if (benefit.includes('礼包') || benefit.includes('礼盒') || benefit.includes('礼')) {
      effects.push({
        type: 'gift',
        giftType: benefit,
        label: benefit
      })
      continue
    }

    // 默认为通用权益
    effects.push({
      type: 'generic',
      label: benefit
    })
  }

  // 计算综合折扣倍率
  const discountEffects = effects.filter((e): e is MemberBenefitDiscountEffect => e.type === 'discount')
  const compositeDiscountRate = discountEffects.length > 0
    ? Math.min(...discountEffects.map(e => e.rate))
    : TIER_DISCOUNT_RATES[currentTier]

  // 计算综合积分倍率
  const multiplierEffects = effects.filter((e): e is MemberBenefitPointsMultiplierEffect => e.type === 'points-multiplier')
  const compositePointsMultiplier = multiplierEffects.length > 0
    ? Math.max(...multiplierEffects.map(e => e.multiplier))
    : TIER_POINTS_MULTIPLIERS[currentTier]

  // 是否有无限免排
  const hasUnlimitedPriority = effects.some(
    (e): e is MemberBenefitPriorityQueueEffect =>
      e.type === 'priority-queue' && e.unlimited
  )

  return {
    levelKey: levelInfo.currentLevelKey,
    tier: currentTier,
    rawBenefits: benefits,
    effects,
    compositeDiscountRate,
    compositePointsMultiplier,
    hasUnlimitedPriority
  }
}

/**
 * 根据等级 tier 返回默认折扣倍率
 */
export function getTierDefaultDiscountRate(tier: MemberLevelTier): number {
  return TIER_DISCOUNT_RATES[tier]
}

/**
 * 根据等级 tier 返回默认积分倍率
 */
export function getTierDefaultPointsMultiplier(tier: MemberLevelTier): number {
  return TIER_POINTS_MULTIPLIERS[tier]
}
