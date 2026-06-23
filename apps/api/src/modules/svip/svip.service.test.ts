/**
 * 🐜 自动: [svip] [A] service.test.ts 补全
 *
 * 覆盖: initDefaultTiers / listTiers / getTier / upsertTier / getTierByLevel
 *       createMember / getMemberTier / listMembers / findMemberByMemberId
 *       upgradeTier / downgradeTier / checkAndDowngradeExpired
 *       freezeMember / unfreezeMember
 *       listBenefits / createBenefit / updateBenefit / useBenefit
 *       checkAndAutoUpgrade / getMemberAvailableBenefits
 *       resetSvipStoresForTests
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe, beforeEach, afterEach } from 'node:test'
import { SvipService } from './svip.service'
import { SvipMemberStatus, SvipTierLevel, SvipBenefitType } from './svip.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const CTX: RequestTenantContext = {
  tenantId: 'tenant-svip-svc',
  brandId: 'brand-svip',
  storeId: 'store-svip',
  marketCode: 'cn-mainland'
}

let service: SvipService

beforeEach(() => {
  service = new SvipService()
})

afterEach(() => {
  service.resetSvipStoresForTests()
})

function initThreeTiers() {
  service.upsertTier(CTX, {
    name: '铜卡',
    level: 1,
    minSpendAmount: 3000,
    minPoints: 300,
    benefits: ['discount_95']
  })
  service.upsertTier(CTX, {
    name: '银卡',
    level: 2,
    minSpendAmount: 8000,
    minPoints: 1000,
    benefits: ['discount_90', 'priority_queue', 'free_upgrade']
  })
  service.upsertTier(CTX, {
    name: '金卡',
    level: 3,
    minSpendAmount: 15000,
    minPoints: 3000,
    benefits: ['discount_85', 'priority_queue', 'free_upgrade']
  })
}

function createActiveMember(memberId: string, tierLevel: SvipTierLevel = SvipTierLevel.Level1): ReturnType<SvipService['createMember']> {
  const tier = service.getTierByLevel(tierLevel, CTX.tenantId)!
  const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  // SVIP_TIER_THRESHOLDS[1] = { minSpendAmount: 5000, minPoints: 500 }
  const minThreshold = tierLevel === SvipTierLevel.Level1 ? { totalSpend: 6000, currentPoints: 600 }
    : tierLevel === SvipTierLevel.Level2 ? { totalSpend: 12000, currentPoints: 3000 }
    : { totalSpend: 30000, currentPoints: 6000 }
  return service.createMember(CTX, {
    memberId,
    tierId: tier.id,
    totalSpend: minThreshold.totalSpend,
    currentPoints: minThreshold.currentPoints,
    expiresAt: future
  })
}

// ================================================================
// 等级管理
// ================================================================

describe('initDefaultTiers', () => {
  test('应初始化 5 个默认等级', () => {
    const tiers = service.initDefaultTiers(CTX)
    assert.equal(tiers.length, 5)
    assert.equal(tiers[0]!.level, SvipTierLevel.Level1)
    assert.equal(tiers[4]!.level, SvipTierLevel.Level5)
  })

  test('第二次调用不重复创建', () => {
    const first = service.initDefaultTiers(CTX)
    const second = service.initDefaultTiers(CTX)
    assert.equal(first.length, 5)
    assert.equal(second.length, 5)
    assert.equal(first[0]!.id, second[0]!.id)
  })

  test('多租户隔离', () => {
    const ctx2: RequestTenantContext = { ...CTX, tenantId: 'other-tenant' }
    const tiers1 = service.initDefaultTiers(CTX)
    const tiers2 = service.initDefaultTiers(ctx2)
    assert.equal(tiers1.length, 5)
    assert.equal(tiers2.length, 5)
    // 不同租户等级 ID 应不同
    assert.notEqual(tiers1[0]!.id, tiers2[0]!.id)
  })
})

describe('listTiers', () => {
  test('空时返回空数组', () => {
    const result = service.listTiers(CTX.tenantId)
    assert.deepEqual(result, [])
  })

  test('应列出所有等级', () => {
    initThreeTiers()
    const tiers = service.listTiers(CTX.tenantId)
    assert.equal(tiers.length, 3)
  })

  test('按 level 排序', () => {
    initThreeTiers()
    const tiers = service.listTiers(CTX.tenantId)
    for (let i = 1; i < tiers.length; i++) {
      assert.ok(tiers[i]!.level > tiers[i - 1]!.level)
    }
  })

  test('租户隔离', () => {
    initThreeTiers()
    const otherTiers = service.listTiers('other-tenant')
    assert.equal(otherTiers.length, 0)
  })
})

describe('getTier', () => {
  test('应通过 id 获取等级', () => {
    initThreeTiers()
    const tiers = service.listTiers(CTX.tenantId)
    const found = service.getTier(tiers[0]!.id, CTX.tenantId)
    assert.ok(found)
    assert.equal(found!.id, tiers[0]!.id)
  })

  test('不存在返回 undefined', () => {
    const result = service.getTier('non-existent', CTX.tenantId)
    assert.equal(result, undefined)
  })

  test('跨租户隔离', () => {
    initThreeTiers()
    const tiers = service.listTiers(CTX.tenantId)
    const result = service.getTier(tiers[0]!.id, 'other-tenant')
    assert.equal(result, undefined)
  })
})

describe('getTierByLevel', () => {
  test('按等级数值查找', () => {
    initThreeTiers()
    const tier = service.getTierByLevel(2, CTX.tenantId)
    assert.ok(tier)
    assert.equal(tier!.level, SvipTierLevel.Level2)
    assert.equal(tier!.name, '银卡')
  })

  test('不存在的等级返回 undefined', () => {
    const result = service.getTierByLevel(999, CTX.tenantId)
    assert.equal(result, undefined)
  })
})

describe('upsertTier', () => {
  test('创建新等级', () => {
    const tier = service.upsertTier(CTX, {
      name: '测试等级',
      level: 1,
      minSpendAmount: 1000,
      minPoints: 100,
      benefits: ['test']
    })
    assert.ok(tier.id)
    assert.equal(tier.name, '测试等级')
    assert.equal(tier.level, SvipTierLevel.Level1)
  })

  test('更新已存在的等级', () => {
    const created = service.upsertTier(CTX, {
      name: '初始',
      level: 1,
      minSpendAmount: 1000,
      minPoints: 100,
      benefits: ['old']
    })
    const updated = service.upsertTier(CTX, {
      id: created.id,
      name: '更新后的等级',
      level: 1,
      minSpendAmount: 2000,
      minPoints: 200,
      benefits: ['new']
    })
    assert.equal(updated.id, created.id)
    assert.equal(updated.name, '更新后的等级')
    assert.equal(updated.minSpendAmount, 2000)
  })

  test('更新时保留 createdAt', () => {
    const created = service.upsertTier(CTX, {
      name: '保留创建时间',
      level: 1,
      minSpendAmount: 1000,
      minPoints: 100,
      benefits: ['test']
    })
    const updated = service.upsertTier(CTX, {
      id: created.id,
      name: '保留',
      level: 1,
      minSpendAmount: 2000,
      minPoints: 200,
      benefits: ['test']
    })
    assert.equal(updated.createdAt, created.createdAt)
  })
})

// ================================================================
// 会员管理
// ================================================================

describe('createMember', () => {
  test('应创建会员并标记 Active', () => {
    initThreeTiers()
    const m = createActiveMember('mem-new')
    assert.ok(m.id)
    assert.equal(m.memberId, 'mem-new')
    assert.equal(m.status, SvipMemberStatus.Active)
    assert.equal(m.tierLevel, SvipTierLevel.Level1)
  })

  test('同 memberId 重复创建应抛出', () => {
    initThreeTiers()
    createActiveMember('dup')
    assert.throws(() => createActiveMember('dup'), /already has an active SVIP membership/)
  })

  test('不存在的 tierId 应抛出', () => {
    assert.throws(() => {
      service.createMember(CTX, {
        memberId: 'bad-tier',
        tierId: 'non-existent',
        totalSpend: 5000,
        currentPoints: 500,
        expiresAt: '2025-01-01T00:00:00Z'
      })
    }, /SvipTier not found/)
  })
})

describe('getMemberTier', () => {
  test('应返回会员的 SVIP 信息', () => {
    initThreeTiers()
    createActiveMember('get-me')
    const result = service.getMemberTier('get-me', CTX.tenantId)
    assert.ok(result)
    assert.equal(result!.memberId, 'get-me')
  })

  test('不存在的会员返回 undefined', () => {
    const result = service.getMemberTier('ghost', CTX.tenantId)
    assert.equal(result, undefined)
  })
})

describe('listMembers', () => {
  test('无会员时返回空数组', () => {
    const result = service.listMembers(CTX.tenantId)
    assert.deepEqual(result, [])
  })

  test('列出所有会员', () => {
    initThreeTiers()
    createActiveMember('m1')
    createActiveMember('m2')
    const members = service.listMembers(CTX.tenantId)
    assert.equal(members.length, 2)
  })

  test('按 status 过滤', () => {
    initThreeTiers()
    createActiveMember('active1')
    const m = createActiveMember('to-freeze')
    service.freezeMember(m.memberId, CTX.tenantId)

    const active = service.listMembers(CTX.tenantId, { status: SvipMemberStatus.Active })
    const frozen = service.listMembers(CTX.tenantId, { status: SvipMemberStatus.Frozen })
    assert.equal(active.length, 1)
    assert.equal(frozen.length, 1)
  })

  test('按 tierLevel 过滤', () => {
    initThreeTiers()
    createActiveMember('l1', SvipTierLevel.Level1)
    createActiveMember('l2', SvipTierLevel.Level2)

    const l1 = service.listMembers(CTX.tenantId, { tierLevel: SvipTierLevel.Level1 })
    assert.equal(l1.length, 1)
    assert.equal(l1[0]!.memberId, 'l1')
  })

  test('按 brandId 过滤', () => {
    initThreeTiers()
    createActiveMember('b1')
    const result = service.listMembers(CTX.tenantId, { brandId: CTX.brandId })
    assert.equal(result.length, 1)
  })

  test('租户隔离', () => {
    initThreeTiers()
    createActiveMember('isolated')
    const other = service.listMembers('other-tenant')
    assert.equal(other.length, 0)
  })
})

// ================================================================
// 升级 / 降级
// ================================================================

describe('upgradeTier', () => {
  test('从 Level1 升级到 Level2', () => {
    initThreeTiers()
    createActiveMember('upgrade', SvipTierLevel.Level1)
    const result = service.upgradeTier(CTX, {
      memberId: 'upgrade',
      targetTierLevel: 2,
      totalSpend: 12000,
      currentPoints: 3000
    })
    assert.equal(result.tierLevel, SvipTierLevel.Level2)
    assert.equal(result.tierName, '银卡')
  })

  test('目标等级非更高时应抛出', () => {
    initThreeTiers()
    createActiveMember('no-up', SvipTierLevel.Level2)
    assert.throws(() => {
      service.upgradeTier(CTX, { memberId: 'no-up', targetTierLevel: 1 })
    }, /not higher/)
  })

  test('冻结会员不可升级', () => {
    initThreeTiers()
    const m = createActiveMember('frozen-upgrade')
    service.freezeMember(m.memberId, CTX.tenantId)
    assert.throws(() => {
      service.upgradeTier(CTX, { memberId: 'frozen-upgrade', targetTierLevel: 2 })
    }, /not active/)
  })

  test('不存在会员应抛出', () => {
    initThreeTiers()
    assert.throws(() => {
      service.upgradeTier(CTX, { memberId: 'ghost', targetTierLevel: 2 })
    }, /SvipMember not found/)
  })

  test('未指定 targetTierLevel 时自动计算', () => {
    initThreeTiers()
    createActiveMember('auto-up', SvipTierLevel.Level1)
    const result = service.upgradeTier(CTX, {
      memberId: 'auto-up',
      totalSpend: 30000,
      currentPoints: 6000
    })
    assert.ok(result.tierLevel > SvipTierLevel.Level1)
  })
})

describe('downgradeTier', () => {
  test('从 Level2 降级到 Level1', () => {
    initThreeTiers()
    createActiveMember('down', SvipTierLevel.Level2)
    const result = service.downgradeTier(CTX, {
      memberId: 'down',
      targetTierLevel: 1,
      totalSpend: 3000,
      currentPoints: 300
    })
    assert.equal(result.tierLevel, SvipTierLevel.Level1)
    assert.equal(result.tierName, '铜卡')
  })

  test('目标等级非更低时应抛出', () => {
    initThreeTiers()
    createActiveMember('no-down', SvipTierLevel.Level1)
    assert.throws(() => {
      service.downgradeTier(CTX, { memberId: 'no-down', targetTierLevel: 2 })
    }, /not lower/)
  })

  test('冻结会员不可降级', () => {
    initThreeTiers()
    const m = createActiveMember('frozen-down', SvipTierLevel.Level2)
    service.freezeMember(m.memberId, CTX.tenantId)
    assert.throws(() => {
      service.downgradeTier(CTX, { memberId: 'frozen-down', targetTierLevel: 1 })
    }, /not active/)
  })
})

describe('checkAndDowngradeExpired', () => {
  test('没有到期会员返回空', () => {
    initThreeTiers()
    createActiveMember('valid')
    const result = service.checkAndDowngradeExpired(CTX.tenantId)
    assert.equal(result.length, 0)
  })

  test('租户隔离', () => {
    initThreeTiers()
    createActiveMember('isolated')
    const result = service.checkAndDowngradeExpired('other-tenant')
    assert.equal(result.length, 0)
  })
})

// ================================================================
// 冻结 / 解冻
// ================================================================

describe('freezeMember', () => {
  test('冻结活跃会员', () => {
    initThreeTiers()
    const m = createActiveMember('freeze')
    const result = service.freezeMember(m.memberId, CTX.tenantId)
    assert.equal(result.status, SvipMemberStatus.Frozen)
  })

  test('重复冻结应抛出', () => {
    initThreeTiers()
    const m = createActiveMember('freeze2')
    service.freezeMember(m.memberId, CTX.tenantId)
    assert.throws(() => {
      service.freezeMember(m.memberId, CTX.tenantId)
    }, /already frozen/)
  })

  test('不存在的会员应抛出', () => {
    assert.throws(() => {
      service.freezeMember('ghost', CTX.tenantId)
    }, /SvipMember not found/)
  })
})

describe('unfreezeMember', () => {
  test('解冻已冻结会员', () => {
    initThreeTiers()
    const m = createActiveMember('unfreeze')
    service.freezeMember(m.memberId, CTX.tenantId)
    const result = service.unfreezeMember(m.memberId, CTX.tenantId)
    assert.equal(result.status, SvipMemberStatus.Active)
  })

  test('解冻非冻结状态应抛出', () => {
    initThreeTiers()
    const m = createActiveMember('not-frozen')
    assert.throws(() => {
      service.unfreezeMember(m.memberId, CTX.tenantId)
    }, /not frozen/)
  })
})

// ================================================================
// 权益管理
// ================================================================

describe('listBenefits', () => {
  test('无权益时返回空数组', () => {
    initThreeTiers()
    const tier = service.getTierByLevel(1, CTX.tenantId)!
    const result = service.listBenefits(tier.id)
    assert.deepEqual(result, [])
  })

  test('列出 Tier 下所有活跃权益', () => {
    initThreeTiers()
    const tier = service.getTierByLevel(1, CTX.tenantId)!
    service.createBenefit({
      tierId: tier.id,
      benefitType: SvipBenefitType.Discount,
      benefitValue: '95%',
      description: '95折'
    })
    const benefits = service.listBenefits(tier.id)
    assert.equal(benefits.length, 1)
    assert.equal(benefits[0]!.benefitType, SvipBenefitType.Discount)
  })
})

describe('createBenefit', () => {
  test('创建新权益', () => {
    initThreeTiers()
    const tier = service.getTierByLevel(1, CTX.tenantId)!
    const benefit = service.createBenefit({
      tierId: tier.id,
      benefitType: SvipBenefitType.PriorityQueue,
      benefitValue: 'always',
      description: '优先排队'
    })
    assert.ok(benefit.id)
    assert.equal(benefit.benefitType, SvipBenefitType.PriorityQueue)
    assert.ok(benefit.isActive)
  })
})

describe('updateBenefit', () => {
  test('更新权益详情', () => {
    initThreeTiers()
    const tier = service.getTierByLevel(1, CTX.tenantId)!
    const created = service.createBenefit({
      tierId: tier.id,
      benefitType: SvipBenefitType.VipRoom,
      benefitValue: '1h',
      description: '初始描述'
    })
    const updated = service.updateBenefit(created.id, {
      description: '更新描述',
      isActive: false
    })
    assert.equal(updated.description, '更新描述')
    assert.equal(updated.isActive, false)
  })

  test('不存在的权益应抛出', () => {
    assert.throws(() => {
      service.updateBenefit('non-existent', { description: 'test' })
    }, /SvipBenefit not found/)
  })
})

describe('useBenefit', () => {
  test('会员使用权益成功', () => {
    initThreeTiers()
    createActiveMember('use-it', SvipTierLevel.Level2)
    const tier = service.getTierByLevel(SvipTierLevel.Level2, CTX.tenantId)!
    service.createBenefit({
      tierId: tier.id,
      benefitType: SvipBenefitType.FreeUpgrade,
      benefitValue: '7d',
      description: '7天免费升级'
    })
    const result = service.useBenefit('use-it', SvipBenefitType.FreeUpgrade, CTX.tenantId)
    assert.equal(result.success, true)
  })

  test('非活跃会员使用权益失败', () => {
    initThreeTiers()
    createActiveMember('frozen-use', SvipTierLevel.Level2)
    service.freezeMember('frozen-use', CTX.tenantId)
    const result = service.useBenefit('frozen-use', SvipBenefitType.Discount, CTX.tenantId)
    assert.equal(result.success, false)
    assert.ok(result.message.includes('not an active'))
  })

  test('等级不支持该权益类型', () => {
    initThreeTiers()
    createActiveMember('no-ben', SvipTierLevel.Level1)
    const result = service.useBenefit('no-ben', SvipBenefitType.ExclusiveEvent, CTX.tenantId)
    assert.equal(result.success, false)
    assert.ok(result.message.includes('does not have benefit type'))
  })
})

// ================================================================
// 自动升级
// ================================================================

describe('checkAndAutoUpgrade', () => {
  test('非会员达到 Level1 阈值自动创建 SVIP', () => {
    initThreeTiers()
    const result = service.checkAndAutoUpgrade(CTX, 'auto-new', 15000, 3000)
    assert.equal(result.upgraded, true)
    assert.ok(result.newLevel! >= SvipTierLevel.Level1)
    assert.ok(result.reason!.includes('Auto-enrolled'))
  })

  test('非会员低于阈值不创建', () => {
    initThreeTiers()
    const result = service.checkAndAutoUpgrade(CTX, 'too-poor', 100, 10)
    assert.equal(result.upgraded, false)
  })

  test('已达标会员自动升级', () => {
    initThreeTiers()
    createActiveMember('auto-upg', SvipTierLevel.Level1)
    const result = service.checkAndAutoUpgrade(CTX, 'auto-upg', 30000, 6000)
    assert.equal(result.upgraded, true)
    const member = service.getMemberTier('auto-upg', CTX.tenantId)
    assert.ok(member!.tierLevel > SvipTierLevel.Level1)
  })

  test('无需变更返回 false', () => {
    initThreeTiers()
    createActiveMember('no-change', SvipTierLevel.Level1)
    const result = service.checkAndAutoUpgrade(CTX, 'no-change', 6000, 600)
    assert.equal(result.upgraded, false)
  })
})

// ================================================================
// 会员可用权益
// ================================================================

describe('getMemberAvailableBenefits', () => {
  test('获取活跃会员可用权益', () => {
    initThreeTiers()
    createActiveMember('benefit-check', SvipTierLevel.Level2)
    const tier = service.getTierByLevel(SvipTierLevel.Level2, CTX.tenantId)!
    service.createBenefit({
      tierId: tier.id,
      benefitType: SvipBenefitType.Discount,
      benefitValue: '90%',
      description: '9折'
    })
    const result = service.getMemberAvailableBenefits('benefit-check', CTX.tenantId)
    assert.ok(result)
    assert.equal(result!.tierLevel, SvipTierLevel.Level2)
    assert.ok(result!.benefits.length >= 1)
  })

  test('冻结会员返回 null', () => {
    initThreeTiers()
    const m = createActiveMember('frozen-check')
    service.freezeMember(m.memberId, CTX.tenantId)
    const result = service.getMemberAvailableBenefits('frozen-check', CTX.tenantId)
    assert.equal(result, null)
  })

  test('不存在的会员返回 null', () => {
    const result = service.getMemberAvailableBenefits('ghost', CTX.tenantId)
    assert.equal(result, null)
  })
})

// ================================================================
// 辅助方法
// ================================================================

describe('resetSvipStoresForTests', () => {
  test('清除所有数据', () => {
    initThreeTiers()
    createActiveMember('reset-me')
    service.resetSvipStoresForTests()
    assert.equal(service.listTiers(CTX.tenantId).length, 0)
    assert.equal(service.listMembers(CTX.tenantId).length, 0)
  })
})

describe('calculateTier', () => {
  test('高消费高积分返回高级别', () => {
    const level = service.calculateTier(999999, 999999)
    assert.equal(level, SvipTierLevel.Level5)
  })

  test('低消费低积分返回 Level1', () => {
    const level = service.calculateTier(100, 10)
    assert.equal(level, SvipTierLevel.Level1)
  })
})
