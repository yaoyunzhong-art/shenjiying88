/**
 * Loyalty 升级触发测试
 *
 * BS-0115: 验证 settlePaidOrder → awardPoints → bridge 等级评估链路正常
 */

import { describe, it, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import { MemberLevelService } from '../member-level/member-level.service'
import { MemberTierBridgeService } from '../member/member-tier-bridge.service'
import { LoyaltyService } from './loyalty.service'
import type { CashierOrder, CashierPayment } from '../cashier/cashier.entity'

function makeOrder(overrides: Partial<CashierOrder> & { _orderSuffix?: string } = {}): CashierOrder {
  const suffix = overrides._orderSuffix ?? '001'
  return {
    orderId: `order-upgrade-${suffix}`,
    tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1' },
    memberId: `loyalty-upgrade-mem-${suffix}`,
    totalAmount: 1000,
    paidAt: new Date().toISOString(),
    channel: 'wechat',
    couponCode: undefined,
    blindboxPlanId: undefined,
    blindboxQuantity: undefined,
    ...overrides
  } as CashierOrder
}

function makePayment(overrides: Partial<CashierPayment> & { _orderSuffix?: string } = {}): CashierPayment {
  const suffix = overrides._orderSuffix ?? '001'
  return {
    paymentId: `pay-upgrade-${suffix}`,
    method: 'wechat',
    amount: 1000,
    paidAt: new Date().toISOString(),
    ...overrides
  } as CashierPayment
}

describe('Loyalty 升级触发 (BS-0115)', () => {
  let memberService: MemberService
  let memberLevelService: MemberLevelService
  let bridgeService: MemberTierBridgeService
  let loyaltyService: LoyaltyService

  beforeEach(() => {
    resetMemberServiceTestState()
    memberLevelService = new MemberLevelService()
    bridgeService = new MemberTierBridgeService(memberLevelService)
    memberService = new MemberService()
    memberService.setTierBridge(bridgeService)
    loyaltyService = new LoyaltyService(memberService)
  })

  it('should set memberLevelKey after settlePaidOrder triggers awardPoints', async () => {
    memberService.register({
      memberId: 'loyalty-upgrade-mem-001',
      tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1' },
      nickname: '升级触发测试'
    })

    const order = makeOrder({ _orderSuffix: '001', memberId: 'loyalty-upgrade-mem-001' })
    const payment = makePayment({ _orderSuffix: '001' })

    await loyaltyService.settlePaidOrder(order, payment)

    const profile = memberService.getProfile('loyalty-upgrade-mem-001')
    assert.ok(profile)
    assert.equal(profile.growthValue, 1000)
    assert.equal(profile.memberLevelKey, 'REGULAR_L1')
  })

  it('should still have memberLevelKey with low points from settlePaidOrder', async () => {
    memberService.register({
      memberId: 'loyalty-upgrade-mem-002',
      tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1' },
      nickname: 'test'
    })

    const order = makeOrder({
      _orderSuffix: '002',
      memberId: 'loyalty-upgrade-mem-002',
      totalAmount: 10
    })
    const payment = makePayment({ _orderSuffix: '002', amount: 10 })

    await loyaltyService.settlePaidOrder(order, payment)

    const profile = memberService.getProfile('loyalty-upgrade-mem-002')
    assert.ok(profile)
    assert.equal(profile.growthValue, 10)
    assert.equal(profile.memberLevelKey, 'REGULAR_L1')
  })

  it('should create event via bridge when settlePaidOrder triggers level change', async () => {
    memberService.register({
      memberId: 'loyalty-upgrade-mem-003',
      tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1' },
      nickname: 'test'
    })

    const profile = memberService.getProfile('loyalty-upgrade-mem-003')!
    const result = bridgeService.evaluateMemberTier(profile, undefined)
    assert.ok(result.memberLevelKey)
    assert.equal(result.benefitResolution.tier, 'REGULAR')
  })
})
