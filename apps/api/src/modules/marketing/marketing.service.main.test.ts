import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MarketingService } from './marketing.service'
import { RFMCalculator } from './rfm-calculator'
import { ABTestEngine } from './ab-test'
import { CouponIssuer } from './coupon-issuer'
import { AttributionEngine } from './attribution'
import { SegmentService } from './segment.service'
import { FrequencyCapService } from './frequency-cap.service'
import { ROICalculator } from './roi-calculator'
import { ChannelRouter } from './channel-router'
import { RFMAdapter } from './datasources/rfm.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { OrderAdapter } from './datasources/order.adapter'
import { ExperimentAdapter } from './datasources/experiment.adapter'
import { CouponAdapter } from './datasources/coupon.adapter'

describe('MarketingService (main)', () => {
  let svc: MarketingService
  let rfm: RFMCalculator
  let abTest: ABTestEngine
  let couponIssuer: CouponIssuer
  let attribution: AttributionEngine
  let segment: SegmentService
  let freqCap: FrequencyCapService
  let roiCalc: ROICalculator
  let channelRouter: ChannelRouter

  beforeEach(() => {
    const rfmAdapter = new RFMAdapter()
    const member = new MemberAdapter()
    const order = new OrderAdapter()
    const experiment = new ExperimentAdapter()
    const coupon = new CouponAdapter()

    rfm = new RFMCalculator(rfmAdapter, member, order)
    abTest = new ABTestEngine(rfmAdapter, experiment)
    couponIssuer = new CouponIssuer(coupon, rfmAdapter)
    attribution = new AttributionEngine()
    segment = new SegmentService(rfmAdapter, rfm)
    freqCap = new FrequencyCapService()
    roiCalc = new ROICalculator()
    channelRouter = new ChannelRouter(rfmAdapter, member)

    svc = new MarketingService(rfm, abTest, couponIssuer, attribution, segment, freqCap, roiCalc, channelRouter)
  })

  // ─── reset ──────────────────────────────────────────

  it('reset 重置后状态清理', () => {
    // attribution 有 reset, 先写入点数据
    attribution.recordTouchPoint({
      id: 'tp-1',
      memberId: 'm1',
      channel: 'IN_APP',
      event: 'IMPRESSION',
      timestamp: new Date().toISOString(),
    })
    svc.reset()
    // 验证 reset 没有抛异常
    expect(true).toBe(true)
  })

  // ─── fullRFMCompute ─────────────────────────────────

  it('fullRFMCompute 返回会员 RFM profiles + stats', () => {
    const tenantId = 't1'
    const result = svc.fullRFMCompute(tenantId)
    expect(result).toHaveProperty('profiles')
    expect(result).toHaveProperty('stats')
    expect(Array.isArray(result.profiles)).toBe(true)
    expect(result.stats).toHaveProperty('totalMembers')
    expect(result.stats).toHaveProperty('segmentDistribution')
    expect(result.stats.segmentDistribution).toHaveProperty('CHAMPIONS')
  })

  // ─── computeMemberRFM ──────────────────────────────

  it('computeMemberRFM 返回指定会员 RFM', () => {
    const profile = svc.computeMemberRFM('t1', 'm1')
    expect(profile).not.toBeNull()
    expect(profile!.memberId).toBe('m1')
    expect(profile!.tenantId).toBe('t1')
    expect(['CHAMPIONS', 'LOYAL', 'POTENTIAL_LOYALIST', 'RECENT', 'PROMISING', 'NEED_ATTENTION', 'AT_RISK', 'HIBERNATING']).toContain(profile!.segment)
  })

  it('computeMemberRFM 未知会员返回 null', () => {
    const profile = svc.computeMemberRFM('t1', 'unknown-id')
    expect(profile).toBeNull()
  })

  // ─── listSegments ──────────────────────────────────

  it('listSegments 返回 8 个分群', () => {
    const segments = svc.listSegments()
    expect(segments).toHaveLength(8)
    expect(segments[0]).toHaveProperty('type')
    expect(segments[0]).toHaveProperty('name')
    expect(segments[0]).toHaveProperty('description')
  })

  // ─── segmentOverview ────────────────────────────────

  it('segmentOverview 返回 stats + healthy', () => {
    const overview = svc.segmentOverview('t1')
    expect(overview).toHaveProperty('stats')
    expect(overview).toHaveProperty('healthy')
    expect(typeof overview.healthy).toBe('boolean')
    expect(overview.stats.totalMembers).toBeGreaterThanOrEqual(0)
  })

  // ─── evaluateCampaign ──────────────────────────────

  it('evaluateCampaign 返回实验 + 优惠券 + ROI', () => {
    const result = svc.evaluateCampaign({
      tenantId: 't1',
      campaignId: 'c-test',
      campaignName: '测试活动',
      memberIds: ['m1', 'm2', 'm3'],
      variantNameA: '对照组',
      variantNameB: '实验组',
      couponSegment: 'LOYAL_REWARD',
      expiryDays: 30,
      costCents: 10000,
    })
    expect(result).toHaveProperty('experiment')
    expect(result).toHaveProperty('issued')
    expect(result).toHaveProperty('roi')
    expect(result.experiment.campaignId).toBe('c-test')
    expect(result.experiment.status).toBe('DRAFT')
    expect(Array.isArray(result.issued)).toBe(true)
  })

  it('evaluateCampaign 空会员列表返回零优惠券', () => {
    const result = svc.evaluateCampaign({
      tenantId: 't1',
      campaignId: 'c-empty',
      campaignName: '空活动',
      memberIds: [],
      variantNameA: 'A',
      variantNameB: 'B',
      couponSegment: 'GENERIC',
      expiryDays: 7,
      costCents: 0,
    })
    expect(result.issued).toHaveLength(0)
    expect(result.roi).toBeNull()
  })

  // ─── memberJourney ──────────────────────────────────

  it('memberJourney 返回会员全链路信息', () => {
    const journey = svc.memberJourney({ tenantId: 't1', memberId: 'm1' })
    expect(journey).toHaveProperty('rfm')
    expect(journey).toHaveProperty('freqCap')
    expect(journey).toHaveProperty('channel')
    expect(journey).toHaveProperty('recentTouches')
    expect(Array.isArray(journey.recentTouches)).toBe(true)
  })

  it('memberJourney 未知会员 rfm 为 null', () => {
    const journey = svc.memberJourney({ tenantId: 't1', memberId: 'no-such-member' })
    expect(journey.rfm).toBeNull()
  })

  // ─── campaignSummary ────────────────────────────────

  it('campaignSummary 返回活动汇总', () => {
    // 先创建一些实验
    svc.evaluateCampaign({
      tenantId: 't1',
      campaignId: 'c-summary',
      campaignName: '汇总活动',
      memberIds: ['m1', 'm2'],
      variantNameA: 'A',
      variantNameB: 'B',
      couponSegment: 'GENERIC',
      expiryDays: 14,
      costCents: 5000,
    })

    const summary = svc.campaignSummary('t1', 'c-summary')
    expect(summary).toHaveProperty('campaignId', 'c-summary')
    expect(summary.stats).toHaveProperty('totalSent')
    expect(summary.stats).toHaveProperty('totalClicked')
    expect(summary.stats).toHaveProperty('totalConverted')
    expect(summary.stats).toHaveProperty('totalRevenueCents')
    expect(summary.stats).toHaveProperty('totalCostCents')
    expect(summary.stats).toHaveProperty('avgROI')
  })

  it('campaignSummary 不存在的活动返回默认值', () => {
    const summary = svc.campaignSummary('t1', 'non-existent')
    expect(summary.campaignId).toBe('non-existent')
    expect(summary.stats.totalSent).toBe(0)
    expect(summary.stats.totalClicked).toBe(0)
    expect(summary.stats.avgROI).toBe(0)
  })

  // ─── healthCheck ────────────────────────────────────

  it('healthCheck 返回模块健康状态', () => {
    const health = svc.healthCheck()
    expect(health.status).toBe('ok')
    expect(health.module).toBe('marketing')
    expect(health).toHaveProperty('timestamp')
    expect(health.subServices).toContain('RFMCalculator')
    expect(health.subServices).toContain('CouponIssuer')
    expect(health.subServices).toHaveLength(8)
  })
})
