import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  SvipBenefitType,
  SvipMemberStatus,
  SvipTierLevel,
  SVIP_TIER_THRESHOLDS,
  type SvipBenefit,
  type SvipMember,
  type SvipTier,
  buildDefaultSvipTiers,
  computeSvipTierLevel,
  canUpgradeSvipTier
} from './svip.entity'
import type { CreateSvipMemberDto, SvipBenefitDto, SvipTierDto, SvipUpgradeDto } from './svip.dto'

/** 降级缓冲期 (天) */
const DOWNGRADE_GRACE_PERIOD_DAYS = 30

const tierStore = new Map<string, SvipTier>()
const memberStore = new Map<string, SvipMember>()
const benefitStore = new Map<string, SvipBenefit>()

@Injectable()
export class SvipService {
  // ── 等级管理 ───────────────────────────────────────────

  /**
   * 初始化租户默认等级
   */
  initDefaultTiers(tenantContext: RequestTenantContext): SvipTier[] {
    const existing = this.listTiers(tenantContext.tenantId)
    if (existing.length > 0) return existing

    const defaults = buildDefaultSvipTiers(tenantContext)
    for (const tier of defaults) {
      tierStore.set(tier.id, tier)
    }
    return defaults
  }

  /**
   * 获取等级列表
   */
  listTiers(tenantId: string): SvipTier[] {
    return Array.from(tierStore.values())
      .filter((t) => t.tenantContext.tenantId === tenantId)
      .sort((a, b) => a.level - b.level)
  }

  /**
   * 获取单个等级
   */
  getTier(tierId: string, tenantId: string): SvipTier | undefined {
    const tier = tierStore.get(tierId)
    if (!tier || tier.tenantContext.tenantId !== tenantId) return undefined
    return tier
  }

  /**
   * 按等级数值查找
   */
  getTierByLevel(level: number, tenantId: string): SvipTier | undefined {
    return this.listTiers(tenantId).find((t) => t.level === level)
  }

  /**
   * 创建 / 更新等级
   */
  upsertTier(tenantContext: RequestTenantContext, dto: SvipTierDto): SvipTier {
    const now = new Date().toISOString()
    const id = dto.id ?? `svip-tier-${randomUUID()}`
    const existing = tierStore.get(id)

    const tier: SvipTier = {
      id,
      tenantContext,
      name: dto.name,
      level: dto.level as SvipTierLevel,
      minSpendAmount: dto.minSpendAmount,
      minPoints: dto.minPoints,
      benefits: dto.benefits,
      icon: dto.icon,
      color: dto.color,
      createdAt: existing?.createdAt ?? now
    }
    tierStore.set(id, tier)
    return tier
  }

  // ── 会员管理 ───────────────────────────────────────────

  /**
   * 创建 SVIP 会员
   */
  createMember(tenantContext: RequestTenantContext, dto: CreateSvipMemberDto): SvipMember {
    const tier = this.getTier(dto.tierId, tenantContext.tenantId)
    if (!tier) {
      throw new Error(`SvipTier not found: ${dto.tierId}`)
    }

    // 检查是否已存在
    const existing = this.findMemberByMemberId(dto.memberId, tenantContext.tenantId)
    if (existing && existing.status !== SvipMemberStatus.Expired) {
      throw new Error(`Member ${dto.memberId} already has an active SVIP membership`)
    }

    const now = new Date().toISOString()
    const svipMember: SvipMember = {
      id: `svip-member-${randomUUID()}`,
      tenantContext,
      brandId: dto.brandId ?? tenantContext.brandId,
      storeId: dto.storeId,
      memberId: dto.memberId,
      tierId: tier.id,
      tierName: tier.name,
      tierLevel: tier.level,
      totalSpend: dto.totalSpend,
      currentPoints: dto.currentPoints,
      joinedAt: dto.joinedAt ?? now,
      expiresAt: dto.expiresAt,
      status: SvipMemberStatus.Active,
      autoRenew: dto.autoRenew ?? false,
      createdAt: now,
      updatedAt: now
    }
    memberStore.set(svipMember.id, svipMember)
    return svipMember
  }

  /**
   * 获取会员 SVIP 信息
   */
  getMemberTier(memberId: string, tenantId: string): SvipMember | undefined {
    return this.findMemberByMemberId(memberId, tenantId)
  }

  /**
   * 列出所有 SVIP 会员
   */
  listMembers(
    tenantId: string,
    filters?: { status?: SvipMemberStatus; tierLevel?: number; brandId?: string; storeId?: string }
  ): SvipMember[] {
    return Array.from(memberStore.values()).filter((m) => {
      if (m.tenantContext.tenantId !== tenantId) return false
      if (filters?.status && m.status !== filters.status) return false
      if (filters?.tierLevel && m.tierLevel !== filters.tierLevel) return false
      if (filters?.brandId && m.brandId !== filters.brandId) return false
      if (filters?.storeId && m.storeId !== filters.storeId) return false
      return true
    })
  }

  /**
   * 根据 memberId 查找 SVIP 会员
   */
  private findMemberByMemberId(
    memberId: string,
    tenantId: string
  ): SvipMember | undefined {
    return Array.from(memberStore.values()).find(
      (m) => m.tenantContext.tenantId === tenantId && m.memberId === memberId
    )
  }

  /**
   * 自动判定等级: 根据 totalSpend + points
   */
  calculateTier(totalSpend: number, points: number): SvipTierLevel {
    return computeSvipTierLevel(totalSpend, points)
  }

  /**
   * 升级 SVIP 等级
   */
  upgradeTier(
    tenantContext: RequestTenantContext,
    dto: SvipUpgradeDto
  ): SvipMember {
    const member = this.findMemberByMemberId(dto.memberId, tenantContext.tenantId)
    if (!member) {
      throw new Error(`SvipMember not found: ${dto.memberId}`)
    }
    if (member.status !== SvipMemberStatus.Active) {
      throw new Error(`SvipMember is not active: ${dto.memberId} (status=${member.status})`)
    }

    const targetLevel =
      dto.targetTierLevel ??
      computeSvipTierLevel(
        dto.totalSpend ?? member.totalSpend,
        dto.currentPoints ?? member.currentPoints
      )

    if (targetLevel <= member.tierLevel) {
      throw new Error(
        `Cannot upgrade: target level ${targetLevel} is not higher than current level ${member.tierLevel}`
      )
    }

    const tier = this.getTierByLevel(targetLevel, tenantContext.tenantId)
    if (!tier) {
      throw new Error(`SvipTier not found for level: ${targetLevel}`)
    }

    const now = new Date().toISOString()
    member.tierId = tier.id
    member.tierName = tier.name
    member.tierLevel = tier.level
    if (dto.totalSpend !== undefined) member.totalSpend = dto.totalSpend
    if (dto.currentPoints !== undefined) member.currentPoints = dto.currentPoints
    member.updatedAt = now
    memberStore.set(member.id, member)

    return member
  }

  /**
   * 降级 SVIP 等级
   */
  downgradeTier(
    tenantContext: RequestTenantContext,
    dto: SvipUpgradeDto
  ): SvipMember {
    const member = this.findMemberByMemberId(dto.memberId, tenantContext.tenantId)
    if (!member) {
      throw new Error(`SvipMember not found: ${dto.memberId}`)
    }
    if (member.status !== SvipMemberStatus.Active) {
      throw new Error(`SvipMember is not active: ${dto.memberId} (status=${member.status})`)
    }

    const targetLevel =
      dto.targetTierLevel ??
      computeSvipTierLevel(
        dto.totalSpend ?? member.totalSpend,
        dto.currentPoints ?? member.currentPoints
      )

    if (targetLevel >= member.tierLevel) {
      throw new Error(
        `Cannot downgrade: target level ${targetLevel} is not lower than current level ${member.tierLevel}`
      )
    }

    const tier = this.getTierByLevel(targetLevel, tenantContext.tenantId)
    if (!tier) {
      throw new Error(`SvipTier not found for level: ${targetLevel}`)
    }

    const now = new Date().toISOString()
    member.tierId = tier.id
    member.tierName = tier.name
    member.tierLevel = tier.level
    if (dto.totalSpend !== undefined) member.totalSpend = dto.totalSpend
    if (dto.currentPoints !== undefined) member.currentPoints = dto.currentPoints
    member.updatedAt = now
    memberStore.set(member.id, member)

    return member
  }

  /**
   * 到期降级: expiresAt 到期 → 降级并保留 30 天缓冲期
   */
  checkAndDowngradeExpired(tenantId: string): SvipMember[] {
    const now = new Date()
    const results: SvipMember[] = []

    const activeMembers = this.listMembers(tenantId, { status: SvipMemberStatus.Active })
    for (const member of activeMembers) {
      const expiresDate = new Date(member.expiresAt)
      if (now >= expiresDate) {
        // 计算缓冲期截止时间
        const graceEndDate = new Date(expiresDate.getTime() + DOWNGRADE_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)

        if (now >= graceEndDate) {
          // 超过缓冲期, 彻底过期
          member.status = SvipMemberStatus.Expired
        } else {
          // 缓冲期内: 降一级
          const newLevel = Math.max(1, member.tierLevel - 1) as SvipTierLevel
          if (newLevel < member.tierLevel) {
            const lowerTier = this.getTierByLevel(newLevel, tenantId)
            if (lowerTier) {
              member.tierId = lowerTier.id
              member.tierName = lowerTier.name
              member.tierLevel = lowerTier.level
            }
          }
          // 延长 expiresAt 30 天
          const newExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          member.expiresAt = newExpires.toISOString()
        }

        member.updatedAt = now.toISOString()
        memberStore.set(member.id, member)
        results.push(member)
      }
    }

    return results
  }

  /**
   * 冻结 SVIP 会员
   */
  freezeMember(memberId: string, tenantId: string): SvipMember {
    const member = this.findMemberByMemberId(memberId, tenantId)
    if (!member) {
      throw new Error(`SvipMember not found: ${memberId}`)
    }
    if (member.status === SvipMemberStatus.Frozen) {
      throw new Error(`SvipMember is already frozen: ${memberId}`)
    }
    member.status = SvipMemberStatus.Frozen
    member.updatedAt = new Date().toISOString()
    memberStore.set(member.id, member)
    return member
  }

  /**
   * 解冻 SVIP 会员
   */
  unfreezeMember(memberId: string, tenantId: string): SvipMember {
    const member = this.findMemberByMemberId(memberId, tenantId)
    if (!member) {
      throw new Error(`SvipMember not found: ${memberId}`)
    }
    if (member.status !== SvipMemberStatus.Frozen) {
      throw new Error(`SvipMember is not frozen: ${memberId}`)
    }
    member.status = SvipMemberStatus.Active
    member.updatedAt = new Date().toISOString()
    memberStore.set(member.id, member)
    return member
  }

  // ── 权益管理 ───────────────────────────────────────────

  /**
   * 获取等级权益列表
   */
  listBenefits(tierId: string): SvipBenefit[] {
    return Array.from(benefitStore.values()).filter((b) => b.tierId === tierId && b.isActive)
  }

  /**
   * 创建权益
   */
  createBenefit(dto: SvipBenefitDto): SvipBenefit {
    const benefit: SvipBenefit = {
      id: dto.id ?? `svip-benefit-${randomUUID()}`,
      tierId: dto.tierId,
      benefitType: dto.benefitType,
      benefitValue: dto.benefitValue,
      description: dto.description,
      isActive: dto.isActive ?? true
    }
    benefitStore.set(benefit.id, benefit)
    return benefit
  }

  /**
   * 更新权益
   */
  updateBenefit(benefitId: string, dto: Partial<SvipBenefitDto>): SvipBenefit {
    const existing = benefitStore.get(benefitId)
    if (!existing) {
      throw new Error(`SvipBenefit not found: ${benefitId}`)
    }
    if (dto.benefitType !== undefined) existing.benefitType = dto.benefitType
    if (dto.benefitValue !== undefined) existing.benefitValue = dto.benefitValue
    if (dto.description !== undefined) existing.description = dto.description
    if (dto.isActive !== undefined) existing.isActive = dto.isActive
    benefitStore.set(benefitId, existing)
    return existing
  }

  /**
   * 使用权益
   */
  useBenefit(memberId: string, benefitType: SvipBenefitType, tenantId: string): {
    success: boolean
    benefit?: SvipBenefit
    member?: SvipMember
    message: string
  } {
    const member = this.findMemberByMemberId(memberId, tenantId)
    if (!member || member.status !== SvipMemberStatus.Active) {
      return {
        success: false,
        message: `Member ${memberId} is not an active SVIP member`
      }
    }

    // 获取当前等级的所有权益
    const tier = this.getTier(member.tierId, tenantId)
    if (!tier) {
      return {
        success: false,
        message: `SvipTier not found: ${member.tierId}`
      }
    }

    // 检查该等级是否有此权益类型
    const hasBenefit = tier.benefits.some((b) => {
      // 权益映射: discount_XX → discount
      if (benefitType === SvipBenefitType.Discount) return b.startsWith('discount_')
      if (benefitType === SvipBenefitType.FreeUpgrade) return b === 'free_upgrade'
      if (benefitType === SvipBenefitType.PriorityQueue) return b === 'priority_queue'
      if (benefitType === SvipBenefitType.VipRoom) return b === 'vip_room'
      if (benefitType === SvipBenefitType.ExclusiveEvent) return b === 'exclusive_event'
      return false
    })

    if (!hasBenefit) {
      return {
        success: false,
        member,
        message: `Current tier ${tier.name} does not have benefit type: ${benefitType}`
      }
    }

    // 获取具体的 benefit 记录
    const activeBenefits = this.listBenefits(member.tierId)
    const matchedBenefit = activeBenefits.find((b) => b.benefitType === benefitType)

    return {
      success: true,
      benefit: matchedBenefit,
      member,
      message: `Benefit ${benefitType} used successfully for member ${memberId}`
    }
  }

  /**
   * 与 loyalty 模块联动: 积分达阈值自动升 SVIP
   * 此方法由 loyalty 模块在积分结算后调用
   */
  checkAndAutoUpgrade(
    tenantContext: RequestTenantContext,
    memberId: string,
    totalSpend: number,
    currentPoints: number
  ): { upgraded: boolean; newLevel?: SvipTierLevel; reason?: string } {
    const existingMember = this.findMemberByMemberId(memberId, tenantContext.tenantId)

    if (!existingMember) {
      // 尚未成为 SVIP: 检查是否达到 Level1 阈值
      const computedLevel = computeSvipTierLevel(totalSpend, currentPoints)
      // 仅当实际满足 Level1 阈值时才自动创建
      const meetsLevel1 = totalSpend >= SVIP_TIER_THRESHOLDS[SvipTierLevel.Level1].minSpendAmount
        && currentPoints >= SVIP_TIER_THRESHOLDS[SvipTierLevel.Level1].minPoints
      if (meetsLevel1 && computedLevel >= SvipTierLevel.Level1) {
        // 自动创建 SVIP 会员
        const tier = this.getTierByLevel(computedLevel, tenantContext.tenantId)
        if (!tier) return { upgraded: false, reason: 'Tier not found' }

        const now = new Date().toISOString()
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        const svipMember: SvipMember = {
          id: `svip-member-${randomUUID()}`,
          tenantContext,
          memberId,
          tierId: tier.id,
          tierName: tier.name,
          tierLevel: tier.level,
          totalSpend,
          currentPoints,
          joinedAt: now,
          expiresAt,
          status: SvipMemberStatus.Active,
          autoRenew: false,
          createdAt: now,
          updatedAt: now
        }
        memberStore.set(svipMember.id, svipMember)
        return { upgraded: true, newLevel: computedLevel, reason: 'Auto-enrolled via points threshold' }
      }
      return { upgraded: false, reason: 'Below Level1 threshold' }
    }

    // 已是 SVIP: 检查是否可升级
    if (canUpgradeSvipTier(existingMember.tierLevel, totalSpend, currentPoints)) {
      const newLevel = computeSvipTierLevel(totalSpend, currentPoints)
      const tier = this.getTierByLevel(newLevel, tenantContext.tenantId)
      if (!tier) return { upgraded: false, reason: 'Target tier not found' }

      existingMember.tierId = tier.id
      existingMember.tierName = tier.name
      existingMember.tierLevel = tier.level
      existingMember.totalSpend = totalSpend
      existingMember.currentPoints = currentPoints
      existingMember.updatedAt = new Date().toISOString()
      memberStore.set(existingMember.id, existingMember)
      return {
        upgraded: true,
        newLevel,
        reason: `Auto-upgraded from level ${existingMember.tierLevel} to ${newLevel}`
      }
    }

    // 检查是否需要降级
    const computedLevel = computeSvipTierLevel(totalSpend, currentPoints)
    if (computedLevel < existingMember.tierLevel) {
      const tier = this.getTierByLevel(computedLevel, tenantContext.tenantId)
      if (tier) {
        existingMember.tierId = tier.id
        existingMember.tierName = tier.name
        existingMember.tierLevel = tier.level
        existingMember.totalSpend = totalSpend
        existingMember.currentPoints = currentPoints
        existingMember.updatedAt = new Date().toISOString()
        memberStore.set(existingMember.id, existingMember)
        return {
          upgraded: false,
          newLevel: computedLevel,
          reason: `Auto-downgraded from level ${existingMember.tierLevel} to ${computedLevel} due to decreased spend/points`
        }
      }
    }

    return { upgraded: false, reason: 'No change needed' }
  }

  // ── 辅助方法 ───────────────────────────────────────────

  /**
   * 获取会员可用的权益列表
   */
  getMemberAvailableBenefits(memberId: string, tenantId: string): {
    benefits: SvipBenefit[]
    tierLevel: SvipTierLevel
    tierName: string
  } | null {
    const member = this.findMemberByMemberId(memberId, tenantId)
    if (!member || member.status !== SvipMemberStatus.Active) return null

    return {
      benefits: this.listBenefits(member.tierId),
      tierLevel: member.tierLevel,
      tierName: member.tierName
    }
  }

  /**
   * 清除所有数据 (仅测试用)
   */
  resetSvipStoresForTests(): void {
    tierStore.clear()
    memberStore.clear()
    benefitStore.clear()
  }
}
