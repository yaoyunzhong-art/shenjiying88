/**
 * SVIP 模块跨边界通信契约
 *
 * 定义其他模块消费 SVIP 数据的稳定表面层。
 * 剥离 tenantContext 等内部字段，只暴露安全的业务字段。
 */

import type {
  SvipTier,
  SvipMember,
  SvipBenefit,
  SvipTierLevel,
  SvipMemberStatus,
  SvipBenefitType
} from './svip.entity'

/** SVIP 等级契约（跨模块安全子集） */
export interface SvipTierContract {
  id: string
  name: string
  level: SvipTierLevel
  minSpendAmount: number
  minPoints: number
  benefits: string[]
  icon?: string
  color?: string
  createdAt: string
}

/** SVIP 会员契约（跨模块安全子集） */
export interface SvipMemberContract {
  id: string
  memberId: string
  tierId: string
  tierName: string
  tierLevel: SvipTierLevel
  totalSpend: number
  currentPoints: number
  status: SvipMemberStatus
  autoRenew: boolean
  joinedAt: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

/** SVIP 权益契约（跨模块安全子集） */
export interface SvipBenefitContract {
  id: string
  tierId: string
  benefitType: SvipBenefitType
  benefitValue: string
  description: string
  isActive: boolean
}

/** 等级升级/降级结果契约 */
export interface SvipLevelChangeContract {
  memberId: string
  previousLevel: SvipTierLevel
  newLevel: SvipTierLevel
  reason: string
  changedAt: string
}

/**
 * 将内部 SvipTier 转换为跨模块契约
 */
export function toSvipTierContract(tier: SvipTier): SvipTierContract {
  return {
    id: tier.id,
    name: tier.name,
    level: tier.level,
    minSpendAmount: tier.minSpendAmount,
    minPoints: tier.minPoints,
    benefits: tier.benefits,
    icon: tier.icon,
    color: tier.color,
    createdAt: tier.createdAt
  }
}

/**
 * 将内部 SvipMember 转换为跨模块契约
 */
export function toSvipMemberContract(member: SvipMember): SvipMemberContract {
  return {
    id: member.id,
    memberId: member.memberId,
    tierId: member.tierId,
    tierName: member.tierName,
    tierLevel: member.tierLevel,
    totalSpend: member.totalSpend,
    currentPoints: member.currentPoints,
    status: member.status,
    autoRenew: member.autoRenew,
    joinedAt: member.joinedAt,
    expiresAt: member.expiresAt,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt
  }
}

/**
 * 将内部 SvipBenefit 转换为跨模块契约
 */
export function toSvipBenefitContract(benefit: SvipBenefit): SvipBenefitContract {
  return {
    id: benefit.id,
    tierId: benefit.tierId,
    benefitType: benefit.benefitType,
    benefitValue: benefit.benefitValue,
    description: benefit.description,
    isActive: benefit.isActive
  }
}

/**
 * 构建等级变更结果契约
 */
export function toSvipLevelChangeContract(params: {
  memberId: string
  previousLevel: SvipTierLevel
  newLevel: SvipTierLevel
  reason: string
}): SvipLevelChangeContract {
  return {
    memberId: params.memberId,
    previousLevel: params.previousLevel,
    newLevel: params.newLevel,
    reason: params.reason,
    changedAt: new Date().toISOString()
  }
}
