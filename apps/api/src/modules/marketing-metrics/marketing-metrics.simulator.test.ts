import { describe, it, expect, beforeEach } from 'vitest'
/**
 * marketing-metrics.simulator.test.ts - 营销指标模拟器测试
 *
 * 模拟真实门店营销工作流场景：
 * - 优惠券发放→核销→ROI 计算
 * - 多租户指标隔离
 * - 裂变追踪 + 赢单
 * - 边界场景：空数据、大数据量、重复操作
 * - Prometheus 导出验证
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MarketingMetricsService } from './marketing-metrics.service'
import type { MarketingMetrics } from './marketing-metrics.service'

describe('MarketingMetrics - Simulator', () => {
  let service: MarketingMetricsService

  beforeEach(() => {
    service = new MarketingMetricsService()
  })

  // ─── 模拟基础计数器累加 ───

  describe('模拟优惠券核销场景', () => {
    it('应正确累加优惠券发放和核销计数器', () => {
      // 模拟店长发券: 发放 50 张优惠券
      service.incrCouponIssued(50)
      // 模拟前台核销: 核销 30 张（含 5 张跨店核销）
      for (let i = 0; i < 30; i++) {
        service.incrCouponRedemption(i < 5) // 前 5 张跨店
      }
      const metrics = service.snapshot()
      assert.equal(metrics.couponIssuedTotal, 50)
      assert.equal(metrics.couponRedemptionTotal, 30)
      assert.equal(metrics.couponCrossStoreTotal, 5)
    })

    it('跨店核销应独立计数', () => {
      service.incrCouponIssued(10)
      service.incrCouponRedemption(true)  // 跨店
      service.incrCouponRedemption(false) // 本店
      service.incrCouponRedemption(true)  // 跨店
      const metrics = service.snapshot()
      assert.equal(metrics.couponRedemptionTotal, 3)
      assert.equal(metrics.couponCrossStoreTotal, 2)
    })

    it('空数据场景: snapshot 应返回全零', () => {
      const metrics = service.snapshot()
      assert.equal(metrics.couponRedemptionTotal, 0)
      assert.equal(metrics.couponIssuedTotal, 0)
      assert.equal(metrics.couponCrossStoreTotal, 0)
      assert.equal(metrics.campaignTriggerTotal, 0)
      assert.equal(metrics.campaignDispatchedTotal, 0)
      assert.equal(metrics.referralTrackTotal, 0)
      assert.equal(metrics.referralRewardTotal, 0)
      assert.equal(metrics.notificationDispatchTotal, 0)
      assert.equal(metrics.leadIngestTotal, 0)
      assert.equal(metrics.leadCloseWonTotal, 0)
      // ROI 在 cost=0 时为零 (0/0 → 0)
      assert.equal(metrics.roi, 0)
      // avgOrderValue 在无数据时为零
      assert.equal(metrics.avgOrderValue, 0)
    })
  })

  // ─── 模拟营销活动触达场景 ───

  describe('模拟营销活动触达与下发', () => {
    it('活动匹配 100 人，下发 80 人应正确记录', () => {
      service.incrCampaignTrigger(100, 80)
      const metrics = service.snapshot()
      assert.equal(metrics.campaignTriggerTotal, 100)
      assert.equal(metrics.campaignDispatchedTotal, 80)
    })

    it('多次活动触发应累加', () => {
      service.incrCampaignTrigger(50, 45)
      service.incrCampaignTrigger(30, 28)
      service.incrCampaignTrigger(20, 20)
      const metrics = service.snapshot()
      assert.equal(metrics.campaignTriggerTotal, 100)
      assert.equal(metrics.campaignDispatchedTotal, 93)
    })

    it('活动和优惠券组合场景: 计算 ROI', () => {
      // 优惠券发放
      service.incrCouponIssued(200)
      // 核销 150 张
      for (let i = 0; i < 150; i++) {
        service.incrCouponRedemption(i < 20) // 20 张跨店
      }
      // 活动触发
      service.incrCampaignTrigger(500, 480)
      // 通知下发
      for (let i = 0; i < 1000; i++) {
        service.incrNotificationDispatch()
      }
      // 赢单
      for (let i = 0; i < 10; i++) {
        service.incrLeadCloseWon(50000) // 每单 5 万元
      }
      const metrics = service.snapshot()
      // 验证计数
      assert.equal(metrics.couponIssuedTotal, 200)
      assert.equal(metrics.couponRedemptionTotal, 150)
      assert.equal(metrics.couponCrossStoreTotal, 20)
      assert.equal(metrics.campaignTriggerTotal, 500)
      assert.equal(metrics.campaignDispatchedTotal, 480)
      assert.equal(metrics.notificationDispatchTotal, 1000)
      assert.equal(metrics.leadCloseWonTotal, 10)
      // avgOrderValue: 基于赢单金额
      assert.equal(metrics.avgOrderValue, 50000)
      // ROI: (营收 - 成本) / 成本
      // 营收 = leadCloseWonTotal * avgOrderValue = 10 * 50000 = 500000
      // 成本 = couponIssuedTotal*5 + notificationDispatchTotal*0.1 = 200*5 + 1000*0.1 = 1000 + 100 = 1100
      // ROI = (500000 - 1100) / 1100 ≈ 453.545...
      assert.ok(metrics.roi > 450)
      assert.ok(metrics.roi < 455)
    })
  })

  // ─── 模拟裂变场景 ───

  describe('模拟裂变追踪与奖励', () => {
    it('裂变追踪和奖励应独立计数', () => {
      // 用户 A 分享 → 10 次追踪
      for (let i = 0; i < 10; i++) {
        service.incrReferralTrack()
      }
      // 其中 3 人成功注册获得奖励
      for (let i = 0; i < 3; i++) {
        service.incrReferralReward()
      }
      const metrics = service.snapshot()
      assert.equal(metrics.referralTrackTotal, 10)
      assert.equal(metrics.referralRewardTotal, 3)
    })

    it('大量裂变追踪不应报错', () => {
      for (let i = 0; i < 10000; i++) {
        service.incrReferralTrack()
      }
      const metrics = service.snapshot()
      assert.equal(metrics.referralTrackTotal, 10000)
    })
  })

  // ─── 模拟线索管理场景 ───

  describe('模拟线索流入与赢单', () => {
    it('线索流入和赢单应正确累加', () => {
      // 线索流入 50 条
      for (let i = 0; i < 50; i++) {
        service.incrLeadIngest()
      }
      // 赢单 12 条
      for (let i = 0; i < 12; i++) {
        service.incrLeadCloseWon(30000) // 每单 3 万
      }
      const metrics = service.snapshot()
      assert.equal(metrics.leadIngestTotal, 50)
      assert.equal(metrics.leadCloseWonTotal, 12)
      assert.equal(metrics.avgOrderValue, 30000)
    })

    it('赢单金额直方图应正确记录', () => {
      const amounts = [10000, 20000, 30000, 40000, 50000]
      for (const amt of amounts) {
        service.incrLeadCloseWon(amt)
      }
      const metrics = service.snapshot()
      assert.equal(metrics.leadCloseWonTotal, 5)
      // 平均赢单金额
      assert.equal(metrics.avgOrderValue, 30000)
    })
  })

  // ─── 模拟通知下发场景 ───

  describe('模拟通知下发', () => {
    it('单次通知下发', () => {
      service.incrNotificationDispatch()
      assert.equal(service.snapshot().notificationDispatchTotal, 1)
    })

    it('多次通知下发累加', () => {
      for (let i = 0; i < 5; i++) {
        service.incrNotificationDispatch()
      }
      assert.equal(service.snapshot().notificationDispatchTotal, 5)
    })
  })

  // ─── 模拟直方图记录场景 ───

  describe('模拟直方图记录', () => {
    it('应正确记录 order_value 直方图并影响 avgOrderValue', () => {
      service.recordHistogram('order_value', 100)
      service.recordHistogram('order_value', 200)
      service.recordHistogram('order_value', 300)
      const metrics = service.snapshot()
      assert.equal(metrics.avgOrderValue, 200) // (100+200+300)/3
    })

    it('campaign_response_time 直方图应可记录', () => {
      service.recordHistogram('campaign_response_time', 50)
      service.recordHistogram('campaign_response_time', 150)
      assert.doesNotThrow(() => service.snapshot())
    })

    it('无直方图数据时 avgOrderValue 应为 0', () => {
      const metrics = service.snapshot()
      assert.equal(metrics.avgOrderValue, 0)
    })
  })

  // ─── 模拟多租户隔离场景 ───

  describe('模拟多租户隔离', () => {
    it('不同租户的指标应隔离存储', () => {
      // 租户 A: 发 10 张券, 核销 5 张
      service.incrCouponIssued(10, 'tenant-a')
      for (let i = 0; i < 5; i++) {
        service.incrCouponRedemption(false, 'tenant-a')
      }

      // 租户 B: 发 20 张券, 核销 15 张
      service.incrCouponIssued(20, 'tenant-b')
      for (let i = 0; i < 15; i++) {
        service.incrCouponRedemption(true, 'tenant-b')
      }

      const metricsA = service.snapshot('tenant-a')
      const metricsB = service.snapshot('tenant-b')

      assert.equal(metricsA.couponIssuedTotal, 10)
      assert.equal(metricsA.couponRedemptionTotal, 5)
      assert.equal(metricsA.couponCrossStoreTotal, 0)

      assert.equal(metricsB.couponIssuedTotal, 20)
      assert.equal(metricsB.couponRedemptionTotal, 15)
      assert.equal(metricsB.couponCrossStoreTotal, 15)
    })

    it('默认租户应始终为全局隔离', () => {
      service.incrCouponIssued(5) // default tenant
      service.incrCouponIssued(5, '') // should also be default

      const defaultMetrics = service.snapshot()
      const explicitDefault = service.snapshot('')
      assert.equal(defaultMetrics.couponIssuedTotal, 10)
      assert.equal(explicitDefault.couponIssuedTotal, 10)
    })

    it('重置后指标应归零', () => {
      service.incrCouponIssued(100)
      service.incrLeadCloseWon(50000)
      assert.equal(service.snapshot().couponIssuedTotal, 100)
      assert.equal(service.snapshot().leadCloseWonTotal, 1)

      service.reset()
      const resetMetrics = service.snapshot()
      assert.equal(resetMetrics.couponIssuedTotal, 0)
      assert.equal(resetMetrics.leadCloseWonTotal, 0)
    })

    it('指定租户重置不应影响其他租户', () => {
      service.incrCouponIssued(10, 'tenant-x')
      service.incrCouponIssued(20, 'tenant-y')

      service.reset('tenant-x')
      assert.equal(service.snapshot('tenant-x').couponIssuedTotal, 0)
      assert.equal(service.snapshot('tenant-y').couponIssuedTotal, 20)
    })
  })

  // ─── 模拟 Prometheus 导出场景 ───

  describe('模拟 Prometheus 指标导出', () => {
    it('空数据时导出应包含 TYPE 声明但值为零', () => {
      const prom = service.toPrometheus()
      assert.ok(prom.includes('coupon_redemption_total 0'))
      assert.ok(prom.includes('# TYPE coupon_redemption_total counter'))
      assert.ok(prom.includes('coupon_issued_total 0'))
    })

    it('有数据时应正确反映计数器值', () => {
      service.incrCouponIssued(50)
      service.incrCouponRedemption(true)
      service.incrNotificationDispatch()

      const prom = service.toPrometheus()
      assert.ok(prom.includes('coupon_issued_total 50'))
      assert.ok(prom.includes('coupon_redemption_total 1'))
      assert.ok(prom.includes('coupon_cross_store_total 1'))
      assert.ok(prom.includes('notification_dispatch_total 1'))
    })

    it('直方图应导出 avg 和 count 指标', () => {
      service.recordHistogram('order_value', 100)
      service.recordHistogram('order_value', 200)
      service.recordHistogram('order_value', 300)

      const prom = service.toPrometheus()
      assert.ok(prom.includes('order_value_avg'))
      assert.ok(prom.includes('order_value_count'))
      assert.ok(prom.includes('order_value_count 3'))
    })

    it('多租户导出应隔离', () => {
      service.incrCouponIssued(5, 'tenant-a')
      service.incrCouponIssued(10, 'tenant-b')

      const promA = service.toPrometheus('tenant-a')
      const promB = service.toPrometheus('tenant-b')
      const promGlobal = service.toPrometheus()

      assert.ok(promA.includes('coupon_issued_total 5'))
      assert.ok(promB.includes('coupon_issued_total 10'))
      assert.ok(promGlobal.includes('coupon_issued_total 0'))
    })
  })

  // ─── 模拟大数据量场景 ───

  describe('模拟大数据量压力', () => {
    it('应能处理 1000 次计数器累加', () => {
      for (let i = 0; i < 1000; i++) {
        service.incrCouponIssued(1)
        if (i % 2 === 0) service.incrCouponRedemption(false)
        if (i % 5 === 0) service.incrReferralTrack()
        if (i % 10 === 0) service.incrReferralReward()
        if (i % 3 === 0) service.incrCampaignTrigger(2, 1)
        if (i % 7 === 0) service.incrLeadCloseWon(10000)
      }

      const metrics = service.snapshot()
      assert.equal(metrics.couponIssuedTotal, 1000)
      assert.equal(metrics.couponRedemptionTotal, 500) // every 2nd
      assert.equal(metrics.referralTrackTotal, 200) // every 5th
      assert.equal(metrics.referralRewardTotal, 100) // every 10th
      assert.equal(metrics.campaignTriggerTotal, 334 * 2) // every 3rd
      assert.equal(metrics.leadCloseWonTotal, 143) // every 7th
    })
  })

  // ─── 模拟全流程场景 ───

  describe('模拟完整门店营销日报', () => {
    it('应模拟门店一天的完整营销数据流', () => {
      // 早晨: 店长发放今日优惠券
      service.incrCouponIssued(200)

      // 上午: 前台核销 60 张（含 10 张跨店）
      for (let i = 0; i < 60; i++) {
        service.incrCouponRedemption(i < 10)
      }

      // 中午: 营销活动推送
      service.incrCampaignTrigger(300, 280)
      service.incrNotificationDispatch()

      // 下午: 裂变活动 50 次追踪, 15 人注册
      for (let i = 0; i < 50; i++) {
        service.incrReferralTrack()
      }
      for (let i = 0; i < 15; i++) {
        service.incrReferralReward()
      }

      // 下午: 线索流入 30 条, 赢单 5 条
      for (let i = 0; i < 30; i++) {
        service.incrLeadIngest()
      }
      for (let i = 0; i < 5; i++) {
        service.incrLeadCloseWon(35000 + i * 5000)
      }

      // 晚间: 再次核销 40 张
      for (let i = 0; i < 40; i++) {
        service.incrCouponRedemption(i < 5)
      }

      const metrics = service.snapshot()

      // 验证完整数据流
      assert.equal(metrics.couponIssuedTotal, 200)
      assert.equal(metrics.couponRedemptionTotal, 100) // 60 + 40
      assert.equal(metrics.couponCrossStoreTotal, 15) // 10 + 5
      assert.equal(metrics.campaignTriggerTotal, 300)
      assert.equal(metrics.campaignDispatchedTotal, 280)
      assert.equal(metrics.referralTrackTotal, 50)
      assert.equal(metrics.referralRewardTotal, 15)
      assert.equal(metrics.notificationDispatchTotal, 1)
      assert.equal(metrics.leadIngestTotal, 30)
      assert.equal(metrics.leadCloseWonTotal, 5)

      // 平均客单价: (35000+40000+45000+50000+55000)/5 = 45000
      assert.equal(metrics.avgOrderValue, 45000)

      // ROI 计算
      // 营收 = 5 * 45000 = 225000
      // 成本 = 200*5 + 1*0.1 = 1000.1
      // ROI = (225000 - 1000.1) / 1000.1 ≈ 223.98...
      assert.ok(metrics.roi > 220)
      assert.ok(metrics.roi < 230)
    })
  })
})
