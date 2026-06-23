/**
 * 🐜 自动: [svip] [A] entity.test.ts 补全
 *
 * 覆盖: SvipTierLevel / SvipMemberStatus / SvipBenefitType 枚举
 *       SvipTier / SvipMember / SvipBenefit 接口默认值
 *       SVIP_TIER_THRESHOLDS / computeSvipTierLevel / canUpgradeSvipTier / buildDefaultSvipTiers
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  SvipTierLevel,
  SvipMemberStatus,
  SvipBenefitType,
  SVIP_TIER_THRESHOLDS,
  type SvipTier,
  type SvipMember,
  type SvipBenefit,
  computeSvipTierLevel,
  canUpgradeSvipTier,
  buildDefaultSvipTiers
} from './svip.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const CTX: RequestTenantContext = {
  tenantId: 'tenant-test-001',
  brandId: 'brand-1',
  storeId: 'store-1',
  marketCode: 'cn-mainland'
}

describe('SvipTierLevel 枚举', () => {
  test('Level1 应为 1', () => {
    assert.equal(SvipTierLevel.Level1, 1)
  })

  test('Level2 应为 2', () => {
    assert.equal(SvipTierLevel.Level2, 2)
  })

  test('Level3 应为 3', () => {
    assert.equal(SvipTierLevel.Level3, 3)
  })

  test('Level4 应为 4', () => {
    assert.equal(SvipTierLevel.Level4, 4)
  })

  test('Level5 应为 5', () => {
    assert.equal(SvipTierLevel.Level5, 5)
  })

  test('等级值连续递增', () => {
    const values = Object.values(SvipTierLevel).filter((v) => typeof v === 'number') as number[]
    for (let i = 1; i < values.length; i++) {
      assert.ok(values[i]! > values[i - 1]!, `Level ${values[i]} should be > Level ${values[i - 1]}`)
    }
  })
})

describe('SvipMemberStatus 枚举', () => {
  test('Active 字符串值', () => {
    assert.equal(SvipMemberStatus.Active, 'active')
  })

  test('Expired 字符串值', () => {
    assert.equal(SvipMemberStatus.Expired, 'expired')
  })

  test('Frozen 字符串值', () => {
    assert.equal(SvipMemberStatus.Frozen, 'frozen')
  })

  test('所有值均为合法字符串', () => {
    const valid = ['active', 'expired', 'frozen']
    for (const v of Object.values(SvipMemberStatus)) {
      assert.ok(valid.includes(v))
    }
  })
})

describe('SvipBenefitType 枚举', () => {
  test('应包含所有权益类型', () => {
    const types = Object.values(SvipBenefitType)
    assert.ok(types.includes('discount' as any))
    assert.ok(types.includes('freeUpgrade' as any))
    assert.ok(types.includes('priorityQueue' as any))
    assert.ok(types.includes('vipRoom' as any))
    assert.ok(types.includes('exclusiveEvent' as any))
  })
})

describe('SVIP_TIER_THRESHOLDS 阈值配置', () => {
  test('应包含 5 个等级', () => {
    assert.equal(Object.keys(SVIP_TIER_THRESHOLDS).length, 5)
  })

  test('Level1 阈值', () => {
    const t = SVIP_TIER_THRESHOLDS[SvipTierLevel.Level1]
    assert.equal(t.minSpendAmount, 5000)
    assert.equal(t.minPoints, 500)
  })

  test('Level5 阈值最高', () => {
    const l1 = SVIP_TIER_THRESHOLDS[SvipTierLevel.Level1]
    const l5 = SVIP_TIER_THRESHOLDS[SvipTierLevel.Level5]
    assert.ok(l5.minSpendAmount > l1.minSpendAmount)
    assert.ok(l5.minPoints > l1.minPoints)
  })

  test('阈值严格递增', () => {
    const levels = [SvipTierLevel.Level1, SvipTierLevel.Level2, SvipTierLevel.Level3, SvipTierLevel.Level4, SvipTierLevel.Level5]
    for (let i = 1; i < levels.length; i++) {
      const prev = SVIP_TIER_THRESHOLDS[levels[i - 1]!]
      const curr = SVIP_TIER_THRESHOLDS[levels[i]!]
      assert.ok(curr.minSpendAmount > prev.minSpendAmount, `Level ${i + 1} minSpendAmount should be > Level ${i}`)
      assert.ok(curr.minPoints > prev.minPoints, `Level ${i + 1} minPoints should be > Level ${i}`)
    }
  })
})

describe('computeSvipTierLevel', () => {
  test('花费和积分均不足 Level1 时返回 Level1 作为最低', () => {
    const level = computeSvipTierLevel(0, 0)
    assert.equal(level, SvipTierLevel.Level1)
  })

  test('达到 Level1 阈值', () => {
    const level = computeSvipTierLevel(5000, 500)
    assert.ok(level >= SvipTierLevel.Level1)
  })

  test('花费达到 Level3 但积分不足应降级', () => {
    const level = computeSvipTierLevel(30000, 500) // 积分仅 500
    assert.ok(level < SvipTierLevel.Level3)
  })

  test('积分达到 Level3 但花费不足应降级', () => {
    const level = computeSvipTierLevel(2000, 6000) // 花费仅 2000
    assert.ok(level < SvipTierLevel.Level3)
  })

  test('超大花费和积分返回 Level5', () => {
    const level = computeSvipTierLevel(999999, 999999)
    assert.equal(level, SvipTierLevel.Level5)
  })

  test('刚好 Level4 阈值返回 Level4', () => {
    const level = computeSvipTierLevel(80000, 15000)
    assert.ok(level >= SvipTierLevel.Level4)
  })
})

describe('canUpgradeSvipTier', () => {
  test('Level1 达标花费可升级', () => {
    assert.equal(canUpgradeSvipTier(SvipTierLevel.Level1, 20000, 3000), true)
  })

  test('Level1 花费不足不可升级', () => {
    assert.equal(canUpgradeSvipTier(SvipTierLevel.Level1, 2000, 300), false)
  })

  test('Level3 花费积分均达标可升级', () => {
    assert.equal(canUpgradeSvipTier(SvipTierLevel.Level3, 100000, 20000), true)
  })

  test('Level5 已达最高不可升级', () => {
    assert.equal(canUpgradeSvipTier(SvipTierLevel.Level5, 999999, 999999), false)
  })
})

describe('SvipTier 接口形状', () => {
  test('应构建一个完整的 SvipTier 对象', () => {
    const tier: SvipTier = {
      id: 'tier-001',
      tenantContext: CTX,
      name: '银卡会员',
      level: SvipTierLevel.Level1,
      minSpendAmount: 5000,
      minPoints: 500,
      benefits: ['discount_95', 'priority_queue'],
      createdAt: '2024-01-01T00:00:00Z'
    }

    assert.equal(tier.id, 'tier-001')
    assert.equal(tier.name, '银卡会员')
    assert.equal(tier.level, SvipTierLevel.Level1)
    assert.equal(tier.minSpendAmount, 5000)
    assert.equal(tier.minPoints, 500)
    assert.deepEqual(tier.benefits, ['discount_95', 'priority_queue'])
    assert.equal(tier.createdAt, '2024-01-01T00:00:00Z')
  })

  test('icon 和 color 应为可选', () => {
    const tier: SvipTier = {
      id: 'tier-opt',
      tenantContext: CTX,
      name: '测试',
      level: SvipTierLevel.Level2,
      minSpendAmount: 10000,
      minPoints: 2000,
      benefits: [],
      createdAt: '2024-01-01T00:00:00Z'
    }

    assert.equal(tier.icon, undefined)
    assert.equal(tier.color, undefined)
  })

  test('benefits 可包含多个', () => {
    const tier: SvipTier = {
      id: 'tier-benefits',
      tenantContext: CTX,
      name: '高级',
      level: SvipTierLevel.Level5,
      minSpendAmount: 200000,
      minPoints: 40000,
      benefits: ['discount_80', 'priority_queue', 'free_upgrade', 'vip_room', 'exclusive_event', 'personal_concierge'],
      icon: 'crown',
      color: '#FFD700',
      createdAt: '2024-06-01T00:00:00Z'
    }

    assert.equal(tier.benefits.length, 6)
    assert.equal(tier.icon, 'crown')
    assert.equal(tier.color, '#FFD700')
  })
})

describe('SvipMember 接口形状', () => {
  test('应构建完整的 SvipMember', () => {
    const member: SvipMember = {
      id: 'svip-mem-001',
      tenantContext: CTX,
      memberId: 'member-001',
      tierId: 'tier-001',
      tierName: '银卡会员',
      tierLevel: SvipTierLevel.Level1,
      totalSpend: 6000,
      currentPoints: 600,
      joinedAt: '2024-01-01T00:00:00Z',
      expiresAt: '2025-01-01T00:00:00Z',
      status: SvipMemberStatus.Active,
      autoRenew: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    assert.equal(member.memberId, 'member-001')
    assert.equal(member.tierLevel, SvipTierLevel.Level1)
    assert.equal(member.status, SvipMemberStatus.Active)
    assert.equal(member.autoRenew, false)
    assert.equal(member.totalSpend, 6000)
    assert.equal(member.currentPoints, 600)
  })

  test('brandId 和 storeId 应为可选', () => {
    const member: SvipMember = {
      id: 'svip-mem-002',
      tenantContext: CTX,
      memberId: 'member-002',
      tierId: 'tier-002',
      tierName: '金卡',
      tierLevel: SvipTierLevel.Level2,
      totalSpend: 15000,
      currentPoints: 3000,
      joinedAt: '2024-01-01T00:00:00Z',
      expiresAt: '2025-01-01T00:00:00Z',
      status: SvipMemberStatus.Active,
      autoRenew: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    assert.equal(member.brandId, undefined)
    assert.equal(member.storeId, undefined)
  })

  test('支持 Frozen 状态', () => {
    const member: SvipMember = {
      id: 'svip-mem-frozen',
      tenantContext: CTX,
      memberId: 'frozen-user',
      tierId: 'tier-001',
      tierName: '银卡',
      tierLevel: SvipTierLevel.Level1,
      totalSpend: 5000,
      currentPoints: 500,
      joinedAt: '2024-01-01T00:00:00Z',
      expiresAt: '2025-01-01T00:00:00Z',
      status: SvipMemberStatus.Frozen,
      autoRenew: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z'
    }

    assert.equal(member.status, SvipMemberStatus.Frozen)
  })

  test('支持 Expired 状态', () => {
    const member: SvipMember = {
      id: 'svip-mem-expired',
      tenantContext: CTX,
      memberId: 'expired-user',
      tierId: 'tier-001',
      tierName: '银卡',
      tierLevel: SvipTierLevel.Level1,
      totalSpend: 5000,
      currentPoints: 500,
      joinedAt: '2024-01-01T00:00:00Z',
      expiresAt: '2024-06-01T00:00:00Z',
      status: SvipMemberStatus.Expired,
      autoRenew: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z'
    }

    assert.equal(member.status, SvipMemberStatus.Expired)
  })
})

describe('SvipBenefit 接口形状', () => {
  test('应构建完整的 SvipBenefit', () => {
    const benefit: SvipBenefit = {
      id: 'benefit-001',
      tierId: 'tier-001',
      benefitType: SvipBenefitType.Discount,
      benefitValue: '95%',
      description: '95折优惠',
      isActive: true
    }

    assert.equal(benefit.benefitType, SvipBenefitType.Discount)
    assert.equal(benefit.benefitValue, '95%')
    assert.ok(benefit.isActive)
  })

  test('支持冻结权益', () => {
    const benefit: SvipBenefit = {
      id: 'benefit-inactive',
      tierId: 'tier-001',
      benefitType: SvipBenefitType.VipRoom,
      benefitValue: '2h',
      description: '已下线',
      isActive: false
    }

    assert.equal(benefit.isActive, false)
  })
})

describe('buildDefaultSvipTiers', () => {
  test('应返回 5 个默认等级', () => {
    const tiers = buildDefaultSvipTiers(CTX)
    assert.equal(tiers.length, 5)
  })

  test('等级按 level 升序排列', () => {
    const tiers = buildDefaultSvipTiers(CTX)
    for (let i = 1; i < tiers.length; i++) {
      assert.ok(tiers[i]!.level > tiers[i - 1]!.level)
    }
  })

  test('Level1 名称为"银卡会员"', () => {
    const tiers = buildDefaultSvipTiers(CTX)
    assert.equal(tiers[0]!.name, '银卡会员')
  })

  test('Level5 名称为"至尊会员"', () => {
    const tiers = buildDefaultSvipTiers(CTX)
    assert.equal(tiers[4]!.name, '至尊会员')
  })

  test('每个等级应有 tenantContext', () => {
    const tiers = buildDefaultSvipTiers(CTX)
    for (const tier of tiers) {
      assert.equal(tier.tenantContext.tenantId, CTX.tenantId)
    }
  })

  test('阈值与 SVIP_TIER_THRESHOLDS 一致', () => {
    const tiers = buildDefaultSvipTiers(CTX)
    for (const tier of tiers) {
      const expected = SVIP_TIER_THRESHOLDS[tier.level]
      assert.equal(tier.minSpendAmount, expected.minSpendAmount)
      assert.equal(tier.minPoints, expected.minPoints)
    }
  })

  test('各等级应有 unique id', () => {
    const tiers = buildDefaultSvipTiers(CTX)
    const ids = new Set(tiers.map((t) => t.id))
    assert.equal(ids.size, 5)
  })
})
