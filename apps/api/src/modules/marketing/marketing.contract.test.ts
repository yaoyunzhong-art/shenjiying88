import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase-42 T172: Marketing Contract 测试
 */
import assert from 'node:assert/strict'
import {
  toRFMProfileContract,
  toABExperimentContract,
  toCouponIssueContract,
  toCampaignROIContract,
  toFrequencyCapContract,
} from './marketing.contract'
import type {
  RFMProfile,
  ABExperiment,
  CouponIssueRecord,
  CampaignROI,
  FrequencyCapStatus,
} from './marketing.entity'

// ─── RFMProfileContract ──────────────────────────

describe('toRFMProfileContract', () => {
  it('converts a HIGH frequency / HIGH monetary profile correctly', () => {
    const profile: RFMProfile = {
      id: 'rfm-001',
      tenantId: 'tenant-001',
      memberId: 'member-001',
      recency: 'RECENT_30D',
      frequency: 'HIGH',
      monetary: 'HIGH',
      segment: 'CHAMPIONS',
      daysSinceLastOrder: 5,
      orderCount90d: 12,
      totalSpendCents: 150000,
      computedAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
    }
    const contract = toRFMProfileContract(profile)
    assert.equal(contract.memberId, 'member-001')
    assert.equal(contract.segment, 'CHAMPIONS')
    assert.equal(contract.recencyDays, 5)
    assert.equal(contract.frequencyHigh, true)
    assert.equal(contract.monetaryHigh, true)
  })

  it('converts a LOW frequency / LOW monetary profile correctly', () => {
    const profile: RFMProfile = {
      id: 'rfm-999',
      tenantId: 'tenant-001',
      memberId: 'member-999',
      recency: 'OVER_90D',
      frequency: 'LOW',
      monetary: 'LOW',
      segment: 'HIBERNATING',
      daysSinceLastOrder: 120,
      orderCount90d: 1,
      totalSpendCents: 500,
      computedAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
    }
    const contract = toRFMProfileContract(profile)
    assert.equal(contract.memberId, 'member-999')
    assert.equal(contract.segment, 'HIBERNATING')
    assert.equal(contract.recencyDays, 120)
    assert.equal(contract.frequencyHigh, false)
    assert.equal(contract.monetaryHigh, false)
  })
})

// ─── ABExperimentContract ────────────────────────

describe('toABExperimentContract', () => {
  it('converts an experiment with a conclusive result', () => {
    const exp: ABExperiment = {
      id: 'exp-001',
      tenantId: 'tenant-001',
      campaignId: 'camp-001',
      name: 'SVIP Discount Test',
      variantA: { id: 'va', name: 'Control', content: 'no discount', rewardType: 'COUPON', rewardValue: 0 },
      variantB: { id: 'vb', name: 'Variant', content: '10% off', rewardType: 'DISCOUNT', rewardValue: 10 },
      trafficSplit: 50,
      minSampleSize: 100,
      status: 'ENDED',
      startAt: '2026-06-01T00:00:00.000Z',
      endAt: '2026-06-15T00:00:00.000Z',
      metrics: {
        sentA: 500, sentB: 500,
        clickedA: 50, clickedB: 80,
        convertedA: 10, convertedB: 25,
        revenueCentsA: 50000, revenueCentsB: 120000,
      },
      result: 'B',
      pValue: 0.012,
      createdAt: '2026-06-01T00:00:00.000Z',
    }
    const contract = toABExperimentContract(exp)
    assert.equal(contract.id, 'exp-001')
    assert.equal(contract.name, 'SVIP Discount Test')
    assert.equal(contract.status, 'ENDED')
    assert.equal(contract.result, 'B')
    assert.equal(contract.pValue, 0.012)
  })

  it('converts a running experiment with no result yet', () => {
    const exp: ABExperiment = {
      id: 'exp-002',
      tenantId: 'tenant-001',
      campaignId: 'camp-002',
      name: 'Welcome Offer A/B',
      variantA: { id: 'va', name: 'Old Welcome', content: '10% off', rewardType: 'DISCOUNT', rewardValue: 10 },
      variantB: { id: 'vb', name: 'New Welcome', content: '50 points', rewardType: 'POINTS', rewardValue: 50 },
      trafficSplit: 50,
      minSampleSize: 1000,
      status: 'RUNNING',
      startAt: '2026-06-20T00:00:00.000Z',
      metrics: { sentA: 200, sentB: 200, clickedA: 30, clickedB: 35, convertedA: 5, convertedB: 7, revenueCentsA: 20000, revenueCentsB: 25000 },
      createdAt: '2026-06-20T00:00:00.000Z',
    }
    const contract = toABExperimentContract(exp)
    assert.equal(contract.id, 'exp-002')
    assert.equal(contract.result, undefined)
    assert.equal(contract.pValue, undefined)
  })
})

// ─── CouponIssueContract ─────────────────────────

describe('toCouponIssueContract', () => {
  it('converts a redeemed coupon record', () => {
    const record: CouponIssueRecord = {
      id: 'iss-001',
      tenantId: 'tenant-001',
      memberId: 'member-001',
      campaignId: 'camp-001',
      couponSegment: 'VIP_DISCOUNT',
      issuedAt: '2026-06-20T00:00:00.000Z',
      expiresAt: '2026-07-20T00:00:00.000Z',
      redeemed: true,
      redeemedAt: '2026-06-22T00:00:00.000Z',
      frequencyWindowDays: 7,
    }
    const contract = toCouponIssueContract(record)
    assert.equal(contract.id, 'iss-001')
    assert.equal(contract.memberId, 'member-001')
    assert.equal(contract.couponSegment, 'VIP_DISCOUNT')
    assert.equal(contract.issuedAt, '2026-06-20T00:00:00.000Z')
    assert.equal(contract.expiresAt, '2026-07-20T00:00:00.000Z')
  })

  it('converts an unredeemed coupon', () => {
    const record: CouponIssueRecord = {
      id: 'iss-002',
      tenantId: 'tenant-002',
      memberId: 'member-002',
      campaignId: 'camp-002',
      couponSegment: 'WELCOME_OFFER',
      issuedAt: '2026-06-25T00:00:00.000Z',
      expiresAt: '2026-07-25T00:00:00.000Z',
      redeemed: false,
      frequencyWindowDays: 7,
    }
    const contract = toCouponIssueContract(record)
    assert.equal(contract.memberId, 'member-002')
    assert.equal(contract.couponSegment, 'WELCOME_OFFER')
  })
})

// ─── CampaignROIContract ─────────────────────────

describe('toCampaignROIContract', () => {
  it('converts a profitable campaign', () => {
    const roi: CampaignROI = {
      campaignId: 'camp-001',
      campaignName: 'Summer Sale',
      sent: 10000,
      clicked: 1500,
      converted: 200,
      revenueCents: 5000000,
      costCents: 1000000,
      roi: 4.0,
      conversionRate: 0.133,
      ctr: 0.15,
      cpaCents: 5000,
      periodDays: 30,
    }
    const contract = toCampaignROIContract(roi)
    assert.equal(contract.campaignId, 'camp-001')
    assert.equal(contract.roi, 4.0)
    assert.equal(contract.conversionRate, 0.133)
    assert.equal(contract.cpaCents, 5000)
    assert.equal(contract.periodDays, 30)
  })

  it('converts an unprofitable campaign', () => {
    const roi: CampaignROI = {
      campaignId: 'camp-002',
      campaignName: 'Winter Promo',
      sent: 5000,
      clicked: 400,
      converted: 30,
      revenueCents: 300000,
      costCents: 500000,
      roi: -0.4,
      conversionRate: 0.075,
      ctr: 0.08,
      cpaCents: 16666,
      periodDays: 14,
    }
    const contract = toCampaignROIContract(roi)
    assert.equal(contract.roi, -0.4)
    assert.equal(contract.cpaCents, 16666)
    assert.equal(contract.periodDays, 14)
  })
})

// ─── FrequencyCapContract ────────────────────────

describe('toFrequencyCapContract', () => {
  it('converts an allowed cap', () => {
    const cap: FrequencyCapStatus = {
      memberId: 'member-001',
      windowDays: 7,
      issuedInWindow: 0,
      maxPerWindow: 1,
      allowed: true,
    }
    const contract = toFrequencyCapContract(cap)
    assert.equal(contract.memberId, 'member-001')
    assert.equal(contract.allowed, true)
    assert.equal(contract.nextAvailableAt, undefined)
  })

  it('converts a blocked cap with next available time', () => {
    const cap: FrequencyCapStatus = {
      memberId: 'member-002',
      windowDays: 7,
      issuedInWindow: 1,
      maxPerWindow: 1,
      allowed: false,
      nextAvailableAt: '2026-07-01T00:00:00.000Z',
    }
    const contract = toFrequencyCapContract(cap)
    assert.equal(contract.allowed, false)
    assert.equal(contract.nextAvailableAt, '2026-07-01T00:00:00.000Z')
  })
})
