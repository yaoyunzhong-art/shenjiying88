/**
 * 🐜 自动: [svip] [A] contract.test.ts 补全
 *
 * 覆盖:
 *   SvipTierContract / SvipMemberContract / SvipBenefitContract 接口形状
 *   toSvipTierContract / toSvipMemberContract / toSvipBenefitContract 转换函数
 *   toSvipLevelChangeContract 构建函数
 *   包含正常流程 + 边界条件 + tenantContext 剥离验证
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  SvipTierLevel,
  SvipMemberStatus,
  SvipBenefitType,
  type SvipTier,
  type SvipMember,
  type SvipBenefit
} from './svip.entity'
import {
  toSvipTierContract,
  toSvipMemberContract,
  toSvipBenefitContract,
  toSvipLevelChangeContract,
  type SvipTierContract,
  type SvipMemberContract,
  type SvipBenefitContract,
  type SvipLevelChangeContract
} from './svip.contract'

const CTX: RequestTenantContext = {
  tenantId: 'tenant-test-001',
  brandId: 'brand-1',
  storeId: 'store-1',
  marketCode: 'cn-mainland'
}

// ── 辅助工厂 ──

function makeSvipTier(overrides?: Partial<SvipTier>): SvipTier {
  return {
    id: 'tier-001',
    tenantContext: CTX,
    name: '银卡会员',
    level: SvipTierLevel.Level1,
    minSpendAmount: 5000,
    minPoints: 500,
    benefits: ['discount_95', 'priority_queue'],
    icon: 'silver',
    color: '#C0C0C0',
    createdAt: '2026-06-23T10:00:00.000Z',
    ...overrides
  }
}

function makeSvipMember(overrides?: Partial<SvipMember>): SvipMember {
  return {
    id: 'svip-member-001',
    tenantContext: CTX,
    memberId: 'member-001',
    tierId: 'tier-001',
    tierName: '银卡会员',
    tierLevel: SvipTierLevel.Level1,
    totalSpend: 6000,
    currentPoints: 600,
    joinedAt: '2026-06-01T00:00:00.000Z',
    expiresAt: '2027-06-01T00:00:00.000Z',
    status: SvipMemberStatus.Active,
    autoRenew: false,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-23T10:00:00.000Z',
    ...overrides
  }
}

function makeSvipBenefit(overrides?: Partial<SvipBenefit>): SvipBenefit {
  return {
    id: 'benefit-001',
    tierId: 'tier-001',
    benefitType: SvipBenefitType.Discount,
    benefitValue: '95%',
    description: '95折优惠',
    isActive: true,
    ...overrides
  }
}

// ──────────── toSvipTierContract ────────────

describe('toSvipTierContract', () => {
  test('完整等级转换：保留业务字段，剥离 tenantContext', () => {
    const tier = makeSvipTier()
    const contract = toSvipTierContract(tier)

    assert.equal(contract.id, 'tier-001')
    assert.equal(contract.name, '银卡会员')
    assert.equal(contract.level, SvipTierLevel.Level1)
    assert.equal(contract.minSpendAmount, 5000)
    assert.equal(contract.minPoints, 500)
    assert.deepEqual(contract.benefits, ['discount_95', 'priority_queue'])
    assert.equal(contract.icon, 'silver')
    assert.equal(contract.color, '#C0C0C0')
    assert.equal(contract.createdAt, '2026-06-23T10:00:00.000Z')
    // @ts-expect-error tenantContext 不属于 contract
    assert.equal(contract.tenantContext, undefined)
  })

  test('最高等级转换：至尊会员', () => {
    const tier = makeSvipTier({
      id: 'tier-005',
      name: '至尊会员',
      level: SvipTierLevel.Level5,
      minSpendAmount: 200000,
      minPoints: 40000,
      benefits: ['discount_80', 'priority_queue', 'free_upgrade', 'vip_room', 'exclusive_event', 'personal_concierge'],
      icon: 'crown',
      color: '#FF4500'
    })
    const contract = toSvipTierContract(tier)

    assert.equal(contract.level, SvipTierLevel.Level5)
    assert.equal(contract.benefits.length, 6)
    assert.equal(contract.icon, 'crown')
  })

  test('可选字段缺失时不影响转换', () => {
    const tier = makeSvipTier({ icon: undefined, color: undefined })
    const contract = toSvipTierContract(tier)

    assert.equal(contract.icon, undefined)
    assert.equal(contract.color, undefined)
  })

  test('round-trip：核心字段与原实体一致', () => {
    const tier = makeSvipTier()
    const contract = toSvipTierContract(tier)

    assert.equal(contract.id, tier.id)
    assert.equal(contract.name, tier.name)
    assert.equal(contract.level, tier.level)
    assert.equal(contract.minSpendAmount, tier.minSpendAmount)
    assert.equal(contract.createdAt, tier.createdAt)
  })
})

// ──────────── toSvipMemberContract ────────────

describe('toSvipMemberContract', () => {
  test('活跃会员转换：保留核心字段，剥离 tenantContext', () => {
    const member = makeSvipMember()
    const contract = toSvipMemberContract(member)

    assert.equal(contract.id, 'svip-member-001')
    assert.equal(contract.memberId, 'member-001')
    assert.equal(contract.tierLevel, SvipTierLevel.Level1)
    assert.equal(contract.totalSpend, 6000)
    assert.equal(contract.currentPoints, 600)
    assert.equal(contract.status, SvipMemberStatus.Active)
    assert.equal(contract.autoRenew, false)
    assert.equal(contract.expiresAt, '2027-06-01T00:00:00.000Z')
    // @ts-expect-error tenantContext 不属于 contract
    assert.equal(contract.tenantContext, undefined)
  })

  test('高级会员转换：Level5 至尊会员', () => {
    const member = makeSvipMember({
      id: 'svip-member-005',
      tierId: 'tier-005',
      tierName: '至尊会员',
      tierLevel: SvipTierLevel.Level5,
      totalSpend: 300000,
      currentPoints: 80000,
      autoRenew: true,
      brandId: 'brand-1',
      storeId: 'store-2'
    })
    const contract = toSvipMemberContract(member)

    assert.equal(contract.tierLevel, SvipTierLevel.Level5)
    assert.equal(contract.autoRenew, true)
    assert.equal(contract.totalSpend, 300000)
  })

  test('已过期会员转换', () => {
    const member = makeSvipMember({ status: SvipMemberStatus.Expired })
    const contract = toSvipMemberContract(member)

    assert.equal(contract.status, SvipMemberStatus.Expired)
  })

  test('已冻结会员转换', () => {
    const member = makeSvipMember({ status: SvipMemberStatus.Frozen })
    const contract = toSvipMemberContract(member)

    assert.equal(contract.status, SvipMemberStatus.Frozen)
  })

  test('round-trip：核心字段与原实体一致', () => {
    const member = makeSvipMember()
    const contract = toSvipMemberContract(member)

    assert.equal(contract.memberId, member.memberId)
    assert.equal(contract.tierName, member.tierName)
    assert.equal(contract.tierLevel, member.tierLevel)
    assert.equal(contract.status, member.status)
    assert.equal(contract.autoRenew, member.autoRenew)
  })
})

// ──────────── toSvipBenefitContract ────────────

describe('toSvipBenefitContract', () => {
  test('活跃权益转换', () => {
    const benefit = makeSvipBenefit()
    const contract = toSvipBenefitContract(benefit)

    assert.equal(contract.id, 'benefit-001')
    assert.equal(contract.tierId, 'tier-001')
    assert.equal(contract.benefitType, SvipBenefitType.Discount)
    assert.equal(contract.benefitValue, '95%')
    assert.equal(contract.description, '95折优惠')
    assert.equal(contract.isActive, true)
  })

  test('已禁用权益转换', () => {
    const benefit = makeSvipBenefit({ isActive: false })
    const contract = toSvipBenefitContract(benefit)

    assert.equal(contract.isActive, false)
  })

  test('VIP 房间权益类型', () => {
    const benefit = makeSvipBenefit({
      benefitType: SvipBenefitType.VipRoom,
      benefitValue: '2h',
      description: 'VIP 包间 2小时使用权'
    })
    const contract = toSvipBenefitContract(benefit)

    assert.equal(contract.benefitType, SvipBenefitType.VipRoom)
    assert.equal(contract.benefitValue, '2h')
  })

  test('所有权益类型枚举值均可转换', () => {
    const types = Object.values(SvipBenefitType)
    for (const bt of types) {
      const benefit = makeSvipBenefit({ benefitType: bt as SvipBenefitType })
      const contract = toSvipBenefitContract(benefit)
      assert.equal(contract.benefitType, bt)
    }
  })

  test('round-trip：核心字段与原实体一致', () => {
    const benefit = makeSvipBenefit()
    const contract = toSvipBenefitContract(benefit)

    assert.equal(contract.benefitType, benefit.benefitType)
    assert.equal(contract.benefitValue, benefit.benefitValue)
    assert.equal(contract.description, benefit.description)
    assert.equal(contract.isActive, benefit.isActive)
  })
})

// ──────────── toSvipLevelChangeContract ────────────

describe('toSvipLevelChangeContract', () => {
  test('升级结果构建', () => {
    const result = toSvipLevelChangeContract({
      memberId: 'member-001',
      previousLevel: SvipTierLevel.Level1,
      newLevel: SvipTierLevel.Level2,
      reason: '消费达标自动升级'
    })

    assert.equal(result.memberId, 'member-001')
    assert.equal(result.previousLevel, SvipTierLevel.Level1)
    assert.equal(result.newLevel, SvipTierLevel.Level2)
    assert.equal(result.reason, '消费达标自动升级')
    assert.ok(result.changedAt)
    assert.ok(new Date(result.changedAt).getTime() > 0)
  })

  test('降级结果构建', () => {
    const result = toSvipLevelChangeContract({
      memberId: 'member-002',
      previousLevel: SvipTierLevel.Level3,
      newLevel: SvipTierLevel.Level2,
      reason: '积分下降降级'
    })

    assert.equal(result.previousLevel, SvipTierLevel.Level3)
    assert.equal(result.newLevel, SvipTierLevel.Level2)
    assert.equal(result.reason, '积分下降降级')
  })

  test('跨多级升级', () => {
    const result = toSvipLevelChangeContract({
      memberId: 'member-003',
      previousLevel: SvipTierLevel.Level1,
      newLevel: SvipTierLevel.Level5,
      reason: '大额充值直接升至至尊'
    })

    assert.equal(result.previousLevel, SvipTierLevel.Level1)
    assert.equal(result.newLevel, SvipTierLevel.Level5)
  })

  test('同级变更（降级/不变边界）', () => {
    const result = toSvipLevelChangeContract({
      memberId: 'member-004',
      previousLevel: SvipTierLevel.Level2,
      newLevel: SvipTierLevel.Level2,
      reason: '等级不变，仅续期'
    })

    assert.equal(result.previousLevel, SvipTierLevel.Level2)
    assert.equal(result.newLevel, SvipTierLevel.Level2)
  })
})
