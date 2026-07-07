import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { MarketingController } from './marketing.controller'
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

describe('MarketingController (直接实例化)', () => {
  let controller: MarketingController

  beforeEach(() => {
    const rfmAdapter = new RFMAdapter()
    const memberAdapter = new MemberAdapter()
    const orderAdapter = new OrderAdapter()
    const experimentAdapter = new ExperimentAdapter()
    const couponAdapter = new CouponAdapter()

    const rfmCalc = new RFMCalculator(rfmAdapter, memberAdapter, orderAdapter)
    const abTest = new ABTestEngine(experimentAdapter)
    const couponIssuer = new CouponIssuer(couponAdapter, rfmAdapter)
    const attribution = new AttributionEngine()
    const segment = new SegmentService(rfmAdapter, rfmCalc)
    const freqCap = new FrequencyCapService(couponAdapter)
    const roiCalc = new ROICalculator()
    const channelRouter = new ChannelRouter()

    controller = new MarketingController(
      rfmCalc, abTest, couponIssuer, attribution,
      segment, freqCap, roiCalc, channelRouter
    )
  })

  it('should be defined', () => {
    assert.ok(controller)
  })

  it('health endpoint', () => {
    const r = controller.health()
    assert.equal(r.status, 'ok')
    assert.equal(r.module, 'marketing')
  })

  it('listSegments 返回 8 分群', () => {
    const r = controller.listSegments()
    assert.equal(r.segments.length, 8)
  })

  it('rfmStats 委托给 segmentService', () => {
    const r = controller.rfmStats('t1')
    assert.ok(r.stats)
  })

  it('channel/route 默认 IN_APP', () => {
    const r = controller.routeChannel('t1', 'm1')
    assert.equal(r.channel, 'IN_APP')
    assert.equal(r.costCents, 0)
  })

  it('createExperiment + recordEvent 完整流', () => {
    const exp = controller.createExperiment({
      tenantId: 't1',
      campaignId: 'c1',
      name: 'Test',
      variantA: { id: 'va', name: 'A', content: '', rewardType: 'COUPON', rewardValue: 0 },
      variantB: { id: 'vb', name: 'B', content: '', rewardType: 'COUPON', rewardValue: 0 },
      trafficSplit: 0.5,
      minSampleSize: 1000,
      status: 'RUNNING',
      startAt: new Date().toISOString()
    })
    assert.ok(exp.experiment.id)
    controller.recordEvent({ experimentId: exp.experiment.id, memberId: 'm1', event: 'impression' })
    controller.recordEvent({ experimentId: exp.experiment.id, memberId: 'm1', event: 'click' })
    const list = controller.listExperiments('t1')
    assert.ok(list.experiments.length > 0)
  })

  it('coupon/issue 成功 + 频控拒绝', () => {
    const r1 = controller.issueCoupon({
      tenantId: 't1', memberId: 'm1', campaignId: 'c1',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    assert.equal(r1.success, true)
    const r2 = controller.issueCoupon({
      tenantId: 't1', memberId: 'm1', campaignId: 'c1',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    assert.equal(r2.success, false)
  })

  it('coupon/redeem', () => {
    const r = controller.issueCoupon({
      tenantId: 't1', memberId: 'm1', campaignId: 'c1',
      couponSegment: 'GENERIC', expiryDays: 30
    })
    const redeemed = controller.redeemCoupon({ tenantId: 't1', recordId: r.record!.id })
    assert.equal(redeemed.success, true)
  })

  it('coupon/frequency-cap', () => {
    const r = controller.freqCapStatus('t1', 'm1')
    assert.equal(r.allowed, true)
  })

  it('attribution/attribute 默认 last', () => {
    const r = controller.attribute({
      memberId: 'm1', conversionId: 'c1', revenueCents: 10000
    })
    assert.equal(r.memberId, 'm1')
    assert.equal(r.revenueCents, 10000)
  })

  it('attribution/attribute multi mode', () => {
    const r = controller.attribute({
      memberId: 'm1', conversionId: 'c1', revenueCents: 10000, mode: 'multi'
    })
    assert.equal(r.memberId, 'm1')
  })

  it('roi/calculate', () => {
    const r = controller.calculateROI({
      campaignId: 'c1', campaignName: 'Test',
      sent: 100, clicked: 20, converted: 5,
      revenueCents: 50000, costCents: 10000, periodDays: 7
    })
    assert.equal(r.roi, 4)
  })

  it('rfm/compute 批量', () => {
    const r = controller.computeRFM({ tenantId: 't1' })
    assert.ok(r)
  })
})