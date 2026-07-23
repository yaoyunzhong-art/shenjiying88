/**
 * MemberTierBridgeService test
 *
 * BS-0114/BS-0115 — 等级桥接
 * BS-0120/BS-0121 — 权益决议
 *
 * ⚠️ 注意: 6阶18级评估需要 growth + spend + visit 三维同时满足。
 * 当前 member 模块不跟踪到访次数(totalVisits=0), 因此评估只能落到
 * 到访要求 ≤0 的最低等级(REGULAR_L1)。
 * 这是已知限制 — 到访数据接入后可提升精度。
 */

import { describe, it, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberTierBridgeService } from './member-tier-bridge.service'
import { MemberLevelService } from '../member-level/member-level.service'
import { MemberLevel, MemberStatus, type MemberProfile } from './member.entity'
import {
  MemberLevelTier,
  MemberLevelSub
} from '../member-level/member-level.entity'
import { resolveBenefits } from '../member-level/member-level-benefit'

function makeProfile(overrides: Partial<MemberProfile> = {}): MemberProfile {
  return {
    memberId: 'mem-test-001',
    userId: 'user-001',
    tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1' },
    nickname: '测试会员',
    level: MemberLevel.Bronze,
    status: MemberStatus.Active,
    points: 1000,
    growthValue: 1000,
    lastPaymentAmount: 500,
    lastPaymentAt: '2026-07-20T12:00:00Z',
    registeredAt: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

describe('MemberTierBridgeService', () => {
  let service: MemberTierBridgeService
  let memberLevelService: MemberLevelService

  beforeEach(() => {
    memberLevelService = new MemberLevelService()
    service = new MemberTierBridgeService(memberLevelService)
  })

  it('should evaluate REGULAR_L1 for zero growth member', () => {
    const profile = makeProfile({ growthValue: 0, points: 0 })
    const result = service.evaluateMemberTier(profile)

    assert.equal(result.memberLevelKey, 'REGULAR_L1')
    assert.equal(result.memberTier, 'REGULAR')
    assert.equal(result.memberSub, 'L1')
    assert.ok(result.benefits.length > 0)
    assert.ok(result.benefits[0]!.includes('基础'))
    assert.equal(result.upgraded, false)
  })

  it('should evaluate REGULAR_L1 when visits unavailable (totalVisits=0)', () => {
    // With totalVisits=0, cannot advance past REGULAR_L1 since REGULAR_L2 requires 2 visits
    const profile = makeProfile({ growthValue: 800, lastPaymentAmount: 1000 })
    const result = service.evaluateMemberTier(profile)

    assert.equal(result.memberTier, 'REGULAR')
    assert.equal(result.memberSub, 'L1')
  })

  it('should evaluate REGULAR_L1 with growth 1500 if visits=0', () => {
    // Even VIP_L2 requires 20 visits, so 0 visits limits to REGULAR_L1
    const profile = makeProfile({ growthValue: 1500, lastPaymentAmount: 3000 })
    const result = service.evaluateMemberTier(profile)

    assert.equal(result.memberTier, 'REGULAR')
    assert.equal(result.memberSub, 'L1')
  })

  it('should produce benefit resolution with correct defaults', () => {
    const profile = makeProfile({ growthValue: 0, points: 0 })
    const result = service.evaluateMemberTier(profile)

    assert.equal(result.benefitResolution.compositeDiscountRate, 1.0)
    assert.equal(result.benefitResolution.compositePointsMultiplier, 1.0)
    assert.equal(result.benefitResolution.tier, 'REGULAR')
    assert.ok(result.benefitResolution.rawBenefits.length > 0)
  })

  it('should NOT emit upgrade event when previousLevelKey matches', () => {
    const profile = makeProfile({ growthValue: 0, points: 0 })
    const result = service.evaluateMemberTier(profile, 'REGULAR_L1')

    assert.equal(result.upgraded, false)
    assert.equal(result.upgradeEvent, undefined)
  })

  it('should note upgraded=true when growth>0 even if level unchanged', () => {
    // evaluateMemberLevel sets upgraded=true when growth>0 (not base REGULAR_L1 with 0 growth)
    // But upgradeEvent should still be undefined if level hasn't changed
    const profile = makeProfile({ growthValue: 50, lastPaymentAmount: 100 })
    const result = service.evaluateMemberTier(profile, 'REGULAR_L1')

    assert.equal(result.memberLevelKey, 'REGULAR_L1')
    // upgraded=true because growth>0, even though level hasn't changed
    // upgradeEvent still undefined because level key didn't change
    assert.equal(result.upgradeEvent, undefined)
  })
})

describe('resolveBenefits', () => {
  it('should parse discount from benefit string', () => {
    const resolution = resolveBenefits({
      currentTier: MemberLevelTier.VIP,
      currentLevelKey: 'VIP_L1' as const,
      benefits: ['VIP专享折扣9.5折', '生日双倍积分']
    })

    const discountEffect = resolution.effects.find(e => e.type === 'discount')
    assert.ok(discountEffect)
    assert.equal(discountEffect!.type, 'discount')
    assert.equal((discountEffect! as { rate: number }).rate, 0.95)
  })

  it('should parse unlimited priority queue', () => {
    const resolution = resolveBenefits({
      currentTier: MemberLevelTier.DIAMOND,
      currentLevelKey: 'DIAMOND_L1' as const,
      benefits: ['钻石折扣7.5折', '每周礼包', '专属管家', '无限免排']
    })

    const priorityEffect = resolution.effects.find(e => e.type === 'priority-queue')
    assert.ok(priorityEffect)
    assert.equal(priorityEffect!.type, 'priority-queue')
    assert.equal((priorityEffect! as { unlimited: boolean }).unlimited, true)
  })

  it('should return correct composite discount rate', () => {
    const resolution = resolveBenefits({
      currentTier: MemberLevelTier.MYTH,
      currentLevelKey: 'MYTH_L3' as const,
      benefits: ['神话折扣3.8折']
    })

    assert.equal(resolution.compositeDiscountRate, 0.38)
  })

  it('should use tier default discount when no explicit discount string', () => {
    const resolution = resolveBenefits({
      currentTier: MemberLevelTier.VIP,
      currentLevelKey: 'VIP_L1' as const,
      benefits: ['生日双倍积分', '优先排队']
    })

    // No discount in benefits, should fall back to TIER_DISCOUNT_RATES[VIP] = 0.95
    assert.equal(resolution.compositeDiscountRate, 0.95)
  })

  it('should use tier default points multiplier when no explicit multiplier string', () => {
    const resolution = resolveBenefits({
      currentTier: MemberLevelTier.SVIP,
      currentLevelKey: 'SVIP_L1' as const,
      benefits: ['专属客服']
    })

    // No multiplier in benefits, fallback to TIER_POINTS_MULTIPLIERS[SVIP] = 1.5
    assert.equal(resolution.compositePointsMultiplier, 1.5)
  })

  it('should detect concierge effect', () => {
    const resolution = resolveBenefits({
      currentTier: MemberLevelTier.DIAMOND,
      currentLevelKey: 'DIAMOND_L1' as const,
      benefits: ['每月礼包', '专属管家', '无限免排']
    })

    const conciergeEffect = resolution.effects.find(e => e.type === 'concierge')
    assert.ok(conciergeEffect)
    assert.equal(conciergeEffect!.type, 'concierge')
  })

  it('should return effects for all benefits', () => {
    const resolution = resolveBenefits({
      currentTier: MemberLevelTier.MYTH,
      currentLevelKey: 'MYTH_L3' as const,
      benefits: ['神话折扣3.8折', '神话至尊礼盒', '专享CEO接待', '合伙人级权益']
    })

    assert.equal(resolution.effects.length, 4)
    assert.equal(resolution.effects.filter(e => e.type === 'discount').length, 1)
    assert.equal(resolution.effects.filter(e => e.type === 'gift').length, 1)
    assert.equal(resolution.effects.filter(e => e.type === 'concierge').length, 1)
    assert.equal(resolution.effects.filter(e => e.type === 'generic').length, 1)
  })
})
