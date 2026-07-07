import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { SegmentService } from './segment.service'
import { FrequencyCapService } from './frequency-cap.service'
import { ROICalculator } from './roi-calculator'
import { ChannelRouter } from './channel-router'
import { RFMAdapter } from './datasources/rfm.adapter'
import { RFMCalculator } from './rfm-calculator'
import { MemberAdapter } from './datasources/member.adapter'
import { OrderAdapter } from './datasources/order.adapter'
import { CouponAdapter } from './datasources/coupon.adapter'
import type { RFMProfile } from './marketing.entity'

describe('Marketing Services', () => {
  describe('SegmentService', () => {
    let svc: SegmentService
    let rfm: RFMCalculator
    let member: MemberAdapter
    let order: OrderAdapter
    let rfmAdapter: RFMAdapter

    beforeEach(() => {
      rfmAdapter = new RFMAdapter()
      member = new MemberAdapter()
      order = new OrderAdapter()
      rfm = new RFMCalculator(rfmAdapter, member, order)
      svc = new SegmentService(rfmAdapter, rfm)
    })

    it('listSegments 返回 8 个分群', () => {
      const segs = svc.listSegments()
      assert.equal(segs.length, 8)
      assert.ok(segs.some(s => s.type === 'CHAMPIONS'))
      assert.ok(segs.some(s => s.type === 'LOYAL'))
      assert.ok(segs.some(s => s.type === 'AT_RISK'))
      assert.ok(segs.some(s => s.type === 'HIBERNATING'))
    })

    it('getMembersInSegment 按分群过滤', () => {
      const p: RFMProfile = {
        id: 'rfm-1', tenantId: 't1', memberId: 'm1',
        recency: 'RECENT_30D', frequency: 'HIGH', monetary: 'HIGH',
        segment: 'CHAMPIONS', daysSinceLastOrder: 5, orderCount90d: 10,
        totalSpendCents: 100000,
        computedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      rfmAdapter.save(p)

      const champions = svc.getMembersInSegment('t1', 'CHAMPIONS')
      assert.equal(champions.length, 1)
      assert.equal(champions[0].memberId, 'm1')

      const loyal = svc.getMembersInSegment('t1', 'LOYAL')
      assert.equal(loyal.length, 0)
    })

    it('isHealthy 委托给 calculator', () => {
      const stats = {
        totalMembers: 100,
        segmentDistribution: { CHAMPIONS: 10, LOYAL: 10, POTENTIAL_LOYALIST: 10, RECENT: 10, PROMISING: 10, NEED_ATTENTION: 10, AT_RISK: 20, HIBERNATING: 20 } as any,
        avgRecencyDays: 30,
        avgFrequency: 3,
        avgMonetaryCents: 50000
      }
      assert.equal(svc.isHealthy(stats), true)
    })

    it('getStats 返回完整统计', () => {
      const stats = svc.getStats('t1')
      assert.equal(stats.totalMembers, 0)
      assert.ok(stats.segmentDistribution)
    })
  })

  describe('FrequencyCapService', () => {
    let svc: FrequencyCapService
    let coupon: CouponAdapter

    beforeEach(() => {
      coupon = new CouponAdapter()
      svc = new FrequencyCapService(coupon)
    })

    it('checkCap 默认 1/7d', () => {
      const status = svc.checkCap('t1', 'm1', 7, 1)
      assert.equal(status.allowed, true)
      assert.equal(status.maxPerWindow, 1)
      assert.equal(status.windowDays, 7)
    })

    it('checkCap 超出 → allowed false + nextAvailableAt', () => {
      coupon.save({
        id: 'r1', tenantId: 't1', memberId: 'm1', campaignId: 'c1',
        couponSegment: 'GENERIC',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        redeemed: false, frequencyWindowDays: 7
      })
      const status = svc.checkCap('t1', 'm1', 7, 1)
      assert.equal(status.allowed, false)
      assert.equal(status.issuedInWindow, 1)
      assert.ok(status.nextAvailableAt)
    })

    it('checkCap 自定义窗口 30d/2', () => {
      const status = svc.checkCap('t1', 'm1', 30, 2)
      assert.equal(status.maxPerWindow, 2)
      assert.equal(status.windowDays, 30)
    })
  })

  describe('ROICalculator', () => {
    let calc: ROICalculator

    beforeEach(() => {
      calc = new ROICalculator()
    })

    it('compute 基础 ROI', () => {
      const roi = calc.compute({
        campaignId: 'c1', campaignName: 'Test',
        sent: 1000, clicked: 200, converted: 50,
        revenueCents: 500000, costCents: 100000,
        periodDays: 7
      })
      assert.equal(roi.roi, 4)  // (500000-100000)/100000
      assert.equal(roi.conversionRate, 0.25)
      assert.equal(roi.ctr, 0.2)
      assert.equal(roi.cpaCents, 2000)
    })

    it('compute 零成本 → ROI = 0', () => {
      const roi = calc.compute({
        campaignId: 'c1', campaignName: 'Test',
        sent: 100, clicked: 10, converted: 1,
        revenueCents: 10000, costCents: 0,
        periodDays: 7
      })
      assert.equal(roi.roi, 0)
    })

    it('compute 负 ROI (亏损)', () => {
      const roi = calc.compute({
        campaignId: 'c1', campaignName: 'Test',
        sent: 1000, clicked: 50, converted: 5,
        revenueCents: 10000, costCents: 50000,
        periodDays: 7
      })
      assert.ok(roi.roi < 0)
    })

    it('fromTouchPoints 汇总', () => {
      const tps = [
        { id: '1', memberId: 'm1', channel: 'IN_APP' as const, event: 'IMPRESSION' as const, timestamp: '2025-06-01' },
        { id: '2', memberId: 'm2', channel: 'IN_APP' as const, event: 'IMPRESSION' as const, timestamp: '2025-06-01' },
        { id: '3', memberId: 'm1', channel: 'IN_APP' as const, event: 'CLICK' as const, timestamp: '2025-06-02' },
        { id: '4', memberId: 'm1', channel: 'IN_APP' as const, event: 'CONVERSION' as const, timestamp: '2025-06-03', revenueCents: 50000 }
      ]
      const roi = calc.fromTouchPoints('c1', 'Test', tps, 10000, 7)
      assert.equal(roi.sent, 2)
      assert.equal(roi.clicked, 1)
      assert.equal(roi.converted, 1)
      assert.equal(roi.revenueCents, 50000)
    })
  })

  describe('ChannelRouter', () => {
    let router: ChannelRouter

    beforeEach(() => {
      router = new ChannelRouter()
    })

    it('route 默认 in-app', () => {
      const ch = router.route('t1', 'm1')
      assert.equal(ch, 'IN_APP')
    })

    it('route 按优先级选 enabled', () => {
      router.setPreference({
        memberId: 'm2',
        enabled: ['SMS', 'WECHAT'],
        optedOut: []
      })
      const ch = router.route('t1', 'm2')
      // WECHAT 优先级 > SMS
      assert.equal(ch, 'WECHAT')
    })

    it('route 跳过 optedOut', () => {
      router.setPreference({
        memberId: 'm3',
        enabled: ['IN_APP', 'WECHAT', 'SMS'],
        optedOut: ['WECHAT']
      })
      const ch = router.route('t1', 'm3')
      assert.equal(ch, 'IN_APP')
    })

    it('route 无可用 → 兜底 IN_APP', () => {
      router.setPreference({
        memberId: 'm4',
        enabled: [],
        optedOut: []
      })
      const ch = router.route('t1', 'm4')
      assert.equal(ch, 'IN_APP')
    })

    it('costOf 各渠道成本', () => {
      assert.equal(router.costOf('IN_APP'), 0)
      assert.equal(router.costOf('SMS'), 1500)
      assert.equal(router.costOf('WECHAT'), 500)
    })

    it('fallbackChannel 兜底', () => {
      assert.equal(router.fallbackChannel(), 'IN_APP')
    })

    it('getPreference 默认开启 IN_APP + WECHAT', () => {
      const pref = router.getPreference('new-user')
      assert.deepEqual(pref.enabled, ['IN_APP', 'WECHAT'])
    })
  })
})