import { randomUUID } from 'node:crypto'
import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * SVIP 等级枚举
 */
export enum SvipTierLevel {
  Level1 = 1,
  Level2 = 2,
  Level3 = 3,
  Level4 = 4,
  Level5 = 5
}

/**
 * SVIP 会员状态
 */
export enum SvipMemberStatus {
  Active = 'active',
  Expired = 'expired',
  Frozen = 'frozen'
}

/**
 * SVIP 权益类型
 */
export enum SvipBenefitType {
  Discount = 'discount',
  FreeUpgrade = 'freeUpgrade',
  PriorityQueue = 'priorityQueue',
  VipRoom = 'vipRoom',
  ExclusiveEvent = 'exclusiveEvent'
}

/**
 * SVIP 等级阈值配置
 */
export const SVIP_TIER_THRESHOLDS: Record<SvipTierLevel, { minSpendAmount: number; minPoints: number }> = {
  [SvipTierLevel.Level1]: { minSpendAmount: 5000, minPoints: 500 },
  [SvipTierLevel.Level2]: { minSpendAmount: 10000, minPoints: 2000 },
  [SvipTierLevel.Level3]: { minSpendAmount: 30000, minPoints: 6000 },
  [SvipTierLevel.Level4]: { minSpendAmount: 80000, minPoints: 15000 },
  [SvipTierLevel.Level5]: { minSpendAmount: 200000, minPoints: 40000 }
}

/**
 * SVIP 等级实体
 */
export interface SvipTier {
  /** 等级唯一标识 */
  id: string
  /** 租户上下文 */
  tenantContext: RequestTenantContext
  /** 等级名称 */
  name: string
  /** 等级数值 (1-5) */
  level: SvipTierLevel
  /** 最低消费金额阈值 */
  minSpendAmount: number
  /** 最低积分阈值 */
  minPoints: number
  /** 权益列表 (JSON 序列化) */
  benefits: string[]
  /** 等级图标 URL */
  icon?: string
  /** 等级颜色 */
  color?: string
  /** 创建时间 */
  createdAt: string
}

/**
 * SVIP 会员实体
 */
export interface SvipMember {
  /** 会员唯一标识 */
  id: string
  /** 租户上下文 */
  tenantContext: RequestTenantContext
  /** 品牌 ID */
  brandId?: string
  /** 门店 ID */
  storeId?: string
  /** 关联的普通会员 ID */
  memberId: string
  /** 当前等级 ID */
  tierId: string
  /** 当前等级名称 */
  tierName: string
  /** 当前等级数值 (1-5) */
  tierLevel: SvipTierLevel
  /** 累计消费金额 */
  totalSpend: number
  /** 当前积分 */
  currentPoints: number
  /** 加入 SVIP 时间 */
  joinedAt: string
  /** 到期时间 */
  expiresAt: string
  /** 状态 */
  status: SvipMemberStatus
  /** 是否自动续费 */
  autoRenew: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * SVIP 权益实体
 */
export interface SvipBenefit {
  /** 权益唯一标识 */
  id: string
  /** 关联的等级 ID */
  tierId: string
  /** 权益类型 */
  benefitType: SvipBenefitType
  /** 权益数值 (如折扣百分比、升级天数等) */
  benefitValue: string
  /** 权益描述 */
  description: string
  /** 是否激活 */
  isActive: boolean
}

/**
 * 根据总消费金额和积分自动计算 SVIP 等级
 */
export function computeSvipTierLevel(totalSpend: number, points: number): SvipTierLevel {
  const levels = Object.values(SvipTierLevel).filter((v) => typeof v === 'number') as number[]
  let matchedLevel = SvipTierLevel.Level1

  for (const lvl of levels) {
    const threshold = SVIP_TIER_THRESHOLDS[lvl as SvipTierLevel]
    if (totalSpend >= threshold.minSpendAmount && points >= threshold.minPoints) {
      matchedLevel = lvl as SvipTierLevel
    } else {
      break
    }
  }

  return matchedLevel
}

/**
 * 判断是否可以从当前等级升级
 */
export function canUpgradeSvipTier(
  currentLevel: SvipTierLevel,
  totalSpend: number,
  points: number
): boolean {
  const computed = computeSvipTierLevel(totalSpend, points)
  return computed > currentLevel
}

/**
 * 构建默认 SVIP 等级列表
 */
export function buildDefaultSvipTiers(
  tenantContext: RequestTenantContext
): SvipTier[] {
  const now = new Date().toISOString()
  return [
    {
      id: `svip-tier-${randomUUID()}`,
      tenantContext,
      name: '银卡会员',
      level: SvipTierLevel.Level1,
      minSpendAmount: SVIP_TIER_THRESHOLDS[SvipTierLevel.Level1].minSpendAmount,
      minPoints: SVIP_TIER_THRESHOLDS[SvipTierLevel.Level1].minPoints,
      benefits: ['discount_95', 'priority_queue'],
      icon: 'silver',
      color: '#C0C0C0',
      createdAt: now
    },
    {
      id: `svip-tier-${randomUUID()}`,
      tenantContext,
      name: '金卡会员',
      level: SvipTierLevel.Level2,
      minSpendAmount: SVIP_TIER_THRESHOLDS[SvipTierLevel.Level2].minSpendAmount,
      minPoints: SVIP_TIER_THRESHOLDS[SvipTierLevel.Level2].minPoints,
      benefits: ['discount_90', 'priority_queue', 'free_upgrade'],
      icon: 'gold',
      color: '#FFD700',
      createdAt: now
    },
    {
      id: `svip-tier-${randomUUID()}`,
      tenantContext,
      name: '铂金会员',
      level: SvipTierLevel.Level3,
      minSpendAmount: SVIP_TIER_THRESHOLDS[SvipTierLevel.Level3].minSpendAmount,
      minPoints: SVIP_TIER_THRESHOLDS[SvipTierLevel.Level3].minPoints,
      benefits: ['discount_88', 'priority_queue', 'free_upgrade', 'vip_room'],
      icon: 'platinum',
      color: '#E5E4E2',
      createdAt: now
    },
    {
      id: `svip-tier-${randomUUID()}`,
      tenantContext,
      name: '钻石会员',
      level: SvipTierLevel.Level4,
      minSpendAmount: SVIP_TIER_THRESHOLDS[SvipTierLevel.Level4].minSpendAmount,
      minPoints: SVIP_TIER_THRESHOLDS[SvipTierLevel.Level4].minPoints,
      benefits: ['discount_85', 'priority_queue', 'free_upgrade', 'vip_room', 'exclusive_event'],
      icon: 'diamond',
      color: '#B9F2FF',
      createdAt: now
    },
    {
      id: `svip-tier-${randomUUID()}`,
      tenantContext,
      name: '至尊会员',
      level: SvipTierLevel.Level5,
      minSpendAmount: SVIP_TIER_THRESHOLDS[SvipTierLevel.Level5].minSpendAmount,
      minPoints: SVIP_TIER_THRESHOLDS[SvipTierLevel.Level5].minPoints,
      benefits: [
        'discount_80',
        'priority_queue',
        'free_upgrade',
        'vip_room',
        'exclusive_event',
        'personal_concierge'
      ],
      icon: 'crown',
      color: '#FF4500',
      createdAt: now
    }
  ]
}
