import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { CouponIssuer } from './coupon-issuer'
import { CouponAdapter } from './datasources/coupon.adapter'
import { RFMAdapter } from './datasources/rfm.adapter'
import type { RFMProfile } from './marketing.entity'

describe('CouponIssuer', () => {
  let issuer: CouponIssuer
  let coupon: CouponAdapter
  let rfm: RFMAdapter

  beforeEach(() => {
    coupon = new CouponAdapter()
    rfm = new RFMAdapter()
    issuer = new CouponIssuer(coupon, rfm)
  })

  function seedRFM(segment: RFMProfile['segment']): RFMProfile {
    const p: RFMProfile = {
      id: 'rfm-m1',
      tenantId: 't1',
      memberId: 'm1',
      recency: 'RECENT_30D',
      frequency: 'HIGH',
      monetary: 'HIGH',
      segment,
      daysSinceLastOrder: 10,
      orderCount90d: 8,
      totalSpendCents: 80000,
      computedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    rfm.save(p)
    return p
  }

  it('CHAMPIONS → VIP_DISCOUNT', () => {
    seedRFM('CHAMPIONS')
    assert.equal(issuer.inferCouponSegment('t1', 'm1'), 'VIP_DISCOUNT')
  })

  it('LOYAL → LOYAL_REWARD', () => {
    seedRFM('LOYAL')
    assert.equal(issuer.inferCouponSegment('t1', 'm1'), 'LOYAL_REWARD')
  })

  it('RECENT → WELCOME_OFFER', () => {
    seedRFM('RECENT')
    assert.equal(issuer.inferCouponSegment('t1', 'm1'), 'WELCOME_OFFER')
  })

  it('AT_RISK → REACTIVATION', () => {
    seedRFM('AT_RISK')
    assert.equal(issuer.inferCouponSegment('t1', 'm1'), 'REACTIVATION')
  })

  it('HIBERNATING → REACTIVATION', () => {
    seedRFM('HIBERNATING')
    assert.equal(issuer.inferCouponSegment('t1', 'm1'), 'REACTIVATION')
  })

  it('无 RFM → GENERIC', () => {
    assert.equal(issuer.inferCouponSegment('t1', 'no-rfm'), 'GENERIC')
  })

  it('频控 1/7d: 第二次同窗口发放被拒', () => {
    seedRFM('CHAMPIONS')
    const r1 = issuer.issueCoupon({
      tenantId: 't1', memberId: 'm1', campaignId: 'c1',
      couponSegment: 'VIP_DISCOUNT', expiryDays: 30
    })
    assert.equal(r1.success, true)

    const r2 = issuer.issueCoupon({
      tenantId: 't1', memberId: 'm1', campaignId: 'c1',
      couponSegment: 'VIP_DISCOUNT', expiryDays: 30
    })
    assert.equal(r2.success, false)
    assert.match(r2.reason || '', /frequency_cap_exceeded/)
  })

  it('checkFrequencyCap: allowed true 首次', () => {
    seedRFM('CHAMPIONS')
    const status = issuer.checkFrequencyCap('t1', 'm1')
    assert.equal(status.allowed, true)
    assert.equal(status.issuedInWindow, 0)
  })

  it('checkFrequencyCap: allowed false 超过上限', () => {
    seedRFM('CHAMPIONS')
    issuer.issueCoupon({
      tenantId: 't1', memberId: 'm1', campaignId: 'c1',
      couponSegment: 'VIP_DISCOUNT', expiryDays: 30
    })
    const status = issuer.checkFrequencyCap('t1', 'm1')
    assert.equal(status.allowed, false)
    assert.equal(status.issuedInWindow, 1)
    assert.ok(status.nextAvailableAt)
  })

  it('redeemCoupon 标记 redeemed', () => {
    const r = issuer.issueCoupon({
      tenantId: 't1', memberId: 'm1', campaignId: 'c1',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    assert.ok(r.record)
    const redeemed = issuer.redeemCoupon('t1', r.record!.id)
    assert.equal(redeemed?.redeemed, true)
    assert.ok(redeemed?.redeemedAt)
  })

  it('redeemCoupon 二次核销幂等', () => {
    const r = issuer.issueCoupon({
      tenantId: 't1', memberId: 'm1', campaignId: 'c1',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    issuer.redeemCoupon('t1', r.record!.id)
    const second = issuer.redeemCoupon('t1', r.record!.id)
    assert.equal(second?.redeemed, true)
  })

  it('autoIssue: RFM 驱动全流程', () => {
    seedRFM('CHAMPIONS')
    const result = issuer.autoIssue('t1', 'm1', 'c1')
    assert.equal(result.success, true)
    assert.equal(result.couponSegment, 'VIP_DISCOUNT')
    assert.ok(result.record)
  })

  it('autoIssue: 频控拒绝', () => {
    seedRFM('CHAMPIONS')
    issuer.autoIssue('t1', 'm1', 'c1')
    const r2 = issuer.autoIssue('t1', 'm1', 'c1')
    assert.equal(r2.success, false)
  })

  it('checkBudget: 预算耗尽', () => {
    seedRFM('CHAMPIONS')
    // 月预算 10000 → 用尽
    for (let i = 0; i < 10000; i++) {
      coupon.save({
        id: `seed-${i}`,
        tenantId: 't1',
        memberId: `m-seed-${i}`,
        campaignId: 'c1',
        couponSegment: 'GENERIC',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        redeemed: false,
        frequencyWindowDays: 7
      })
    }
    const budget = issuer.checkBudget('t1', 'c1')
    assert.equal(budget.allowed, false)
    assert.equal(budget.remaining, 0)
  })

  it('多租户隔离: T1 频控不影响 T2', () => {
    seedRFM('CHAMPIONS')
    issuer.issueCoupon({
      tenantId: 't1', memberId: 'm1', campaignId: 'c1',
      couponSegment: 'VIP_DISCOUNT', expiryDays: 30
    })
    // T2 不应被 T1 频控影响
    const t2Status = issuer.checkFrequencyCap('t2', 'm1')
    assert.equal(t2Status.allowed, true)
  })
})