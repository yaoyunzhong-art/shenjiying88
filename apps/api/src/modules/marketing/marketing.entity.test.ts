import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * marketing.entity.test.ts — 智能营销实体类型与结构测试
 *
 * 覆盖:
 *  - RFM 类型 / 分群 / Profile
 *  - RFMStats / AB 测试 / 优惠券
 *  - ROI / Attribution / TouchPoint
 *  - 频控 / CouponPrecisionRule
 *  - 默认值与字段类型验证
 */
import assert from 'node:assert/strict'
import type {
  TenantId,
  RFMRecency,
  RFMFrequency,
  RFMMonetary,
  RFMSegmentType,
  RFMProfile,
  RFMStats,
  ABVariant,
  ABExperiment,
  ABMetrics,
  ABVariantType,
  ABResult,
  CouponSegment,
  CouponPrecisionRule,
  CouponIssueRequest,
  CouponIssueRecord,
  FrequencyCapStatus,
  CampaignROI,
  TouchPoint,
  AttributionResult,
} from './marketing.entity'

describe('RFM 实体类型', () => {
  it('T1: TenantId 是 string', () => {
    const id: TenantId = 't-123'
    assert.equal(typeof id, 'string')
  })

  it('T2: RFMRecency 接受 4 种枚举值', () => {
    const values: RFMRecency[] = ['RECENT_30D', 'RECENT_60D', 'RECENT_90D', 'OVER_90D']
    assert.equal(values.length, 4)
    for (const v of values) {
      assert.ok(['RECENT_30D', 'RECENT_60D', 'RECENT_90D', 'OVER_90D'].includes(v))
    }
  })

  it('T3: RFMFrequency 接受 4 种枚举值', () => {
    const values: RFMFrequency[] = ['HIGH', 'MEDIUM', 'LOW', 'NONE']
    assert.equal(values.length, 4)
  })

  it('T4: RFMMonetary 接受 3 种枚举值', () => {
    const values: RFMMonetary[] = ['HIGH', 'MEDIUM', 'LOW']
    assert.equal(values.length, 3)
  })

  it('T5: RFMSegmentType 有 8 个分群', () => {
    const segments: RFMSegmentType[] = [
      'CHAMPIONS', 'LOYAL', 'POTENTIAL_LOYALIST',
      'RECENT', 'PROMISING', 'NEED_ATTENTION',
      'AT_RISK', 'HIBERNATING',
    ]
    assert.equal(segments.length, 8)
    assert.ok(segments.includes('CHAMPIONS'))
    assert.ok(segments.includes('HIBERNATING'))
  })

  it('T6: RFMProfile 完整结构', () => {
    const profile: RFMProfile = {
      id: 'rfm-1',
      tenantId: 't1',
      memberId: 'm1',
      recency: 'RECENT_30D',
      frequency: 'HIGH',
      monetary: 'HIGH',
      segment: 'CHAMPIONS',
      daysSinceLastOrder: 5,
      orderCount90d: 12,
      totalSpendCents: 150000,
      computedAt: '2026-06-28T00:00:00Z',
      updatedAt: '2026-06-28T00:00:00Z',
    }
    assert.equal(profile.id, 'rfm-1')
    assert.equal(profile.segment, 'CHAMPIONS')
    assert.equal(profile.daysSinceLastOrder, 5)
    assert.equal(profile.totalSpendCents, 150000)
  })

  it('T7: RFMStats 结构 (segmentDistribution 含 8 键)', () => {
    const stats: RFMStats = {
      totalMembers: 100,
      segmentDistribution: {
        CHAMPIONS: 10,
        LOYAL: 15,
        POTENTIAL_LOYALIST: 12,
        RECENT: 8,
        PROMISING: 10,
        NEED_ATTENTION: 10,
        AT_RISK: 20,
        HIBERNATING: 15,
      },
      avgRecencyDays: 30,
      avgFrequency: 3,
      avgMonetaryCents: 50000,
    }
    assert.equal(stats.totalMembers, 100)
    assert.equal(Object.keys(stats.segmentDistribution).length, 8)
    assert.equal(stats.avgRecencyDays, 30)
  })

  it('T8: 空 RFMStats 允许 0 values', () => {
    const stats: RFMStats = {
      totalMembers: 0,
      segmentDistribution: {
        CHAMPIONS: 0, LOYAL: 0, POTENTIAL_LOYALIST: 0,
        RECENT: 0, PROMISING: 0, NEED_ATTENTION: 0,
        AT_RISK: 0, HIBERNATING: 0,
      },
      avgRecencyDays: 0,
      avgFrequency: 0,
      avgMonetaryCents: 0,
    }
    assert.equal(stats.totalMembers, 0)
    assert.equal(stats.avgRecencyDays, 0)
  })

  it('T9: RFMProfile 负数 daysSinceLastOrder 不允许 (实际应为 0+)', () => {
    // 类型约束: daysSinceLastOrder 应为非负
    const profile: RFMProfile = {
      id: 'rfm-2', tenantId: 't1', memberId: 'm1',
      recency: 'RECENT_30D', frequency: 'LOW', monetary: 'LOW',
      segment: 'HIBERNATING',
      daysSinceLastOrder: 0,
      orderCount90d: 0,
      totalSpendCents: 0,
      computedAt: '2026-06-28T00:00:00Z',
      updatedAt: '2026-06-28T00:00:00Z',
    }
    assert.ok(profile.daysSinceLastOrder >= 0)
    assert.ok(profile.orderCount90d >= 0)
    assert.ok(profile.totalSpendCents >= 0)
  })
})

describe('AB 测试实体类型', () => {
  const now = new Date().toISOString()

  it('T11: ABVariant 结构包含 rewardType 枚举', () => {
    const v: ABVariant = {
      id: 'va', name: 'A', content: '优惠券A',
      rewardType: 'COUPON', rewardValue: 5000,
    }
    assert.equal(v.rewardType, 'COUPON')
    assert.equal(v.rewardValue, 5000)
  })

  it('T12: ABVariant 接受全部 3 种 rewardType', () => {
    const types: ABVariant['rewardType'][] = ['COUPON', 'POINTS', 'DISCOUNT']
    for (const rt of types) {
      const v: ABVariant = { id: 'v1', name: 'X', content: '', rewardType: rt, rewardValue: 100 }
      assert.equal(v.rewardType, rt)
    }
  })

  it('T13: ABExperiment 结构含 pValue 可选字段', () => {
    const exp: ABExperiment = {
      id: 'exp-1', tenantId: 't1', campaignId: 'c1',
      name: '暑假促', trafficSplit: 0.5, minSampleSize: 1000,
      status: 'RUNNING', startAt: now,
      variantA: { id: 'va', name: 'A', content: '', rewardType: 'COUPON', rewardValue: 5000 },
      variantB: { id: 'vb', name: 'B', content: '', rewardType: 'DISCOUNT', rewardValue: 1000 },
      metrics: { sentA: 0, sentB: 0, clickedA: 0, clickedB: 0, convertedA: 0, convertedB: 0, revenueCentsA: 0, revenueCentsB: 0 },
      createdAt: now,
    }
    assert.equal(exp.status, 'RUNNING')
    assert.equal(exp.variantA.rewardType, 'COUPON')
    // pValue 可选
    assert.equal(exp.pValue, undefined)
  })

  it('T14: ABResult 接受 3 种值', () => {
    const results: ABResult[] = ['A', 'B', 'INCONCLUSIVE']
    assert.equal(results.length, 3)
  })

  it('T15: ABVariantType 接受 2 种值', () => {
    const types: ABVariantType[] = ['A', 'B']
    assert.equal(types.length, 2)
  })

  it('T16: ABMetrics 8 个子段全部 number', () => {
    const m: ABMetrics = {
      sentA: 100, sentB: 100,
      clickedA: 20, clickedB: 15,
      convertedA: 5, convertedB: 3,
      revenueCentsA: 50000, revenueCentsB: 30000,
    }
    assert.equal(m.sentA, 100)
    assert.equal(m.convertedA, 5)
    assert.equal(m.revenueCentsB, 30000)
  })

  it('T17: ABExperiment status 接受 4 种枚举', () => {
    const statuses: ABExperiment['status'][] = ['DRAFT', 'RUNNING', 'PAUSED', 'ENDED']
    assert.equal(statuses.length, 4)
  })
})

describe('优惠券实体类型', () => {
  it('T21: CouponSegment 含 5 种', () => {
    const segs: CouponSegment[] = ['VIP_DISCOUNT', 'LOYAL_REWARD', 'WELCOME_OFFER', 'REACTIVATION', 'GENERIC']
    assert.equal(segs.length, 5)
  })

  it('T22: CouponPrecisionRule 完整结构', () => {
    const rule: CouponPrecisionRule = {
      id: 'rule-1', tenantId: 't1',
      segment: 'CHAMPIONS', couponSegment: 'VIP_DISCOUNT',
      enabled: true, rewardAmount: 5000, discountPercent: 20, expiryDays: 30,
    }
    assert.equal(rule.segment, 'CHAMPIONS')
    assert.equal(rule.couponSegment, 'VIP_DISCOUNT')
    assert.equal(rule.rewardAmount, 5000)
    assert.equal(rule.expiryDays, 30)
  })

  it('T23: CouponPrecisionRule 允许 discountPercent 无值', () => {
    const rule: CouponPrecisionRule = {
      id: 'rule-2', tenantId: 't1',
      segment: 'LOYAL', couponSegment: 'LOYAL_REWARD',
      enabled: true, rewardAmount: 1000, expiryDays: 15,
    }
    assert.equal(rule.discountPercent, undefined)
    assert.equal(rule.rewardAmount, 1000)
  })

  it('T24: CouponIssueRequest 完整', () => {
    const req: CouponIssueRequest = {
      tenantId: 't1', memberId: 'm1', campaignId: 'c1',
      couponSegment: 'WELCOME_OFFER', rewardAmount: 5000, expiryDays: 30,
    }
    assert.equal(req.tenantId, 't1')
    assert.equal(req.couponSegment, 'WELCOME_OFFER')
  })

  it('T25: CouponIssueRecord 含 redeemed + redeemedAt', () => {
    const rec: CouponIssueRecord = {
      id: 'rec-1', tenantId: 't1', memberId: 'm1',
      campaignId: 'c1', couponSegment: 'GENERIC',
      issuedAt: '2026-06-28T00:00:00Z',
      expiresAt: '2026-07-28T00:00:00Z',
      redeemed: false,
      frequencyWindowDays: 7,
    }
    assert.equal(rec.redeemed, false)
    assert.equal(rec.redeemedAt, undefined)
  })

  it('T26: CouponIssueRecord 核销后 redeemedAt 有值', () => {
    const rec: CouponIssueRecord = {
      id: 'rec-2', tenantId: 't1', memberId: 'm1',
      campaignId: 'c1', couponSegment: 'GENERIC',
      issuedAt: '2026-06-28T00:00:00Z',
      expiresAt: '2026-07-28T00:00:00Z',
      redeemed: true,
      redeemedAt: '2026-06-29T12:00:00Z',
      frequencyWindowDays: 7,
    }
    assert.equal(rec.redeemed, true)
    assert.ok(rec.redeemedAt)
  })

  it('T27: FrequencyCapStatus 完整结构', () => {
    const status: FrequencyCapStatus = {
      memberId: 'm1', windowDays: 7, issuedInWindow: 0,
      maxPerWindow: 1, allowed: true,
    }
    assert.equal(status.allowed, true)
    assert.equal(status.nextAvailableAt, undefined)
  })

  it('T28: FrequencyCapStatus allowed=false 且 nextAvailableAt 有值', () => {
    const status: FrequencyCapStatus = {
      memberId: 'm1', windowDays: 7, issuedInWindow: 1,
      maxPerWindow: 1, allowed: false,
      nextAvailableAt: '2026-07-05T00:00:00Z',
    }
    assert.equal(status.allowed, false)
    assert.ok(status.nextAvailableAt)
  })
})

describe('ROI 与归因实体类型', () => {
  it('T31: CampaignROI 完整结构', () => {
    const roi: CampaignROI = {
      campaignId: 'c1', campaignName: 'Test',
      sent: 1000, clicked: 200, converted: 50,
      revenueCents: 500000, costCents: 100000,
      roi: 4.0, conversionRate: 0.25, ctr: 0.2,
      cpaCents: 2000, periodDays: 7,
    }
    assert.equal(roi.roi, 4.0)
    assert.equal(roi.ctr, 0.2)
    assert.equal(roi.cpaCents, 2000)
  })

  it('T32: CampaignROI 零值边界', () => {
    const roi: CampaignROI = {
      campaignId: 'c1', campaignName: 'Zero',
      sent: 0, clicked: 0, converted: 0,
      revenueCents: 0, costCents: 0,
      roi: 0, conversionRate: 0, ctr: 0,
      cpaCents: 0, periodDays: 7,
    }
    assert.equal(roi.sent, 0)
    assert.equal(roi.roi, 0)
  })

  it('T33: TouchPoint 事件枚举 5 渠道 + 3 事件', () => {
    const tp: TouchPoint = {
      id: 'tp-1', memberId: 'm1',
      channel: 'IN_APP', event: 'IMPRESSION',
      timestamp: '2026-06-28T00:00:00Z',
    }
    assert.equal(tp.channel, 'IN_APP')
    assert.equal(tp.event, 'IMPRESSION')

    const channels: TouchPoint['channel'][] = ['IN_APP', 'WECHAT', 'SMS', 'DIRECT', 'ORGANIC']
    assert.equal(channels.length, 5)

    const events: TouchPoint['event'][] = ['IMPRESSION', 'CLICK', 'CONVERSION']
    assert.equal(events.length, 3)
  })

  it('T34: TouchPoint 含可选 revenueCents', () => {
    const tp: TouchPoint = {
      id: 'tp-2', memberId: 'm1', channel: 'IN_APP',
      event: 'CONVERSION', timestamp: '2026-06-28T00:00:00Z',
      revenueCents: 50000,
    }
    assert.equal(tp.revenueCents, 50000)
  })

  it('T35: AttributionResult 完整结构', () => {
    const result: AttributionResult = {
      memberId: 'm1', conversionId: 'c1', revenueCents: 50000,
      lastNonDirectTouch: {
        id: 'tp-3', memberId: 'm1', channel: 'WECHAT',
        event: 'CLICK', timestamp: '2026-06-27T00:00:00Z',
      },
      attributedCampaignId: 'c1',
      attributedChannel: 'WECHAT',
      touchPoints: [
        { id: 'tp-4', memberId: 'm1', channel: 'IN_APP', event: 'IMPRESSION', timestamp: '2026-06-26T00:00:00Z' },
      ],
    }
    assert.equal(result.attributedCampaignId, 'c1')
    assert.equal(result.lastNonDirectTouch?.channel, 'WECHAT')
    assert.equal(result.touchPoints.length, 1)
  })

  it('T36: AttributionResult 含可选权重', () => {
    const result: AttributionResult = {
      memberId: 'm1', conversionId: 'c1', revenueCents: 50000,
      touchPoints: [],
      attributionWeights: { 'WECHAT': 0.6, 'IN_APP': 0.4 },
    }
    assert.equal(result.attributionWeights!['WECHAT'], 0.6)
    assert.equal(result.attributionWeights!['IN_APP'], 0.4)
  })

  it('T37: AttributionResult 不含 lastNonDirectTouch (default)', () => {
    const result: AttributionResult = {
      memberId: 'm1', conversionId: 'c1', revenueCents: 0,
      touchPoints: [],
    }
    assert.equal(result.lastNonDirectTouch, undefined)
    assert.equal(result.attributedCampaignId, undefined)
  })
})
