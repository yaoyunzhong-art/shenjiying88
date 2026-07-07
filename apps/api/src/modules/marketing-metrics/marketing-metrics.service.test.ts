import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [marketing-metrics] [A] service test 补全
 *
 * 覆盖 MarketingMetricsService 核心 API:
 *   - 计数器累加 (coupon / campaign / referral / notification / lead)
 *   - 直方图记录
 *   - Prometheus 导出格式
 *   - ROI / avgOrderValue 计算
 *   - reset 重置
 *   - 边界情况 (空值、0值、大量数据)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MarketingMetricsService } from './marketing-metrics.service'

function makeService(): MarketingMetricsService {
  const svc = new MarketingMetricsService()
  svc.reset()
  return svc
}

function tenantKey(name: string): string {
  return `tenant-${name}`
}

// ─── 计数器累加 ─────────────────────────────────

describe('[marketing-metrics] service: coupon 计数器', () => {
  it('incrCouponRedemption 递增并区分跨店', () => {
    const svc = makeService()
    svc.incrCouponRedemption(false)
    svc.incrCouponRedemption(true)
    svc.incrCouponRedemption(true)
    const snap = svc.snapshot()
    assert.equal(snap.couponRedemptionTotal, 3)
  })

  it('incrCouponIssued 按 count 递增', () => {
    const svc = makeService()
    svc.incrCouponIssued(10)
    svc.incrCouponIssued(5)
    const text = svc.toPrometheus()
    assert.ok(text.includes('coupon_issued_total 15'))
  })

  it('incrCouponIssued 默认 count=1', () => {
    const svc = makeService()
    svc.incrCouponIssued()
    const text = svc.toPrometheus()
    assert.ok(text.includes('coupon_issued_total 1'))
  })
})

describe('[marketing-metrics] service: campaign 计数器', () => {
  it('incrCampaignTrigger 区分 matched / dispatched', () => {
    const svc = makeService()
    svc.incrCampaignTrigger(10, 7)
    const text = svc.toPrometheus()
    assert.ok(text.includes('campaign_trigger_total 10'))
    assert.ok(text.includes('campaign_dispatched_total 7'))
  })
})

describe('[marketing-metrics] service: referral 计数器', () => {
  it('incrReferralTrack + incrReferralReward', () => {
    const svc = makeService()
    svc.incrReferralTrack()
    svc.incrReferralTrack()
    svc.incrReferralReward()
    const snap = svc.snapshot()
    assert.equal(snap.referralTrackTotal, 2)
    const text = svc.toPrometheus()
    assert.ok(text.includes('referral_reward_total 1'))
  })
})

describe('[marketing-metrics] service: notification 计数器', () => {
  it('incrNotificationDispatch 多次递增', () => {
    const svc = makeService()
    svc.incrNotificationDispatch()
    svc.incrNotificationDispatch()
    svc.incrNotificationDispatch()
    const snap = svc.snapshot()
    assert.equal(snap.notificationDispatchTotal, 3)
  })
})

describe('[marketing-metrics] service: lead 计数器', () => {
  it('incrLeadIngest + incrLeadCloseWon', () => {
    const svc = makeService()
    svc.incrLeadIngest()
    svc.incrLeadIngest()
    svc.incrLeadCloseWon(50000)
    const text = svc.toPrometheus()
    assert.ok(text.includes('lead_ingest_total 2'))
    assert.ok(text.includes('lead_close_won_total 1'))
  })

  it('incrLeadCloseWon 默认 amount=10000', () => {
    const svc = makeService()
    svc.incrLeadCloseWon()
    const snap = svc.snapshot()
    assert.equal(snap.avgOrderValue, 10000)
  })
})

// ─── 直方图 ────────────────────────────────────────────

describe('[marketing-metrics] service: histogram', () => {
  it('recordHistogram 记录并导出 avg / count', () => {
    const svc = makeService()
    svc.recordHistogram('order_value', 100)
    svc.recordHistogram('order_value', 200)
    svc.recordHistogram('order_value', 300)
    const text = svc.toPrometheus()
    assert.ok(text.includes('order_value_avg 200'))
    assert.ok(text.includes('order_value_count 3'))
  })

  it('未记录的直方图不在导出中', () => {
    const svc = makeService()
    const text = svc.toPrometheus()
    assert.ok(!text.includes('nonexistent_histogram'))
  })

  it('直方图记录 0 值', () => {
    const svc = makeService()
    svc.recordHistogram('zero_test', 0)
    const text = svc.toPrometheus()
    assert.ok(text.includes('zero_test_avg 0'))
    assert.ok(text.includes('zero_test_count 1'))
  })
})

// ─── ROI / avgOrderValue 计算 ───────────────────────────

describe('[marketing-metrics] service: ROI 计算', () => {
  it('无成本时 ROI 为 0', () => {
    const svc = makeService()
    const snap = svc.snapshot()
    assert.equal(snap.roi, 0)
  })

  it('有真实订单金额时 avgOrderValue 优先使用 order_value 直方图', () => {
    const svc = makeService()
    svc.recordHistogram('order_value', 120)
    svc.recordHistogram('order_value', 180)
    svc.incrLeadCloseWon(50000)
    const snap = svc.snapshot()
    assert.equal(snap.avgOrderValue, 150)
  })

  it('有营收有成本时 ROI > 0', () => {
    const svc = makeService()
    svc.incrCouponIssued(100)   // 成本 = 500
    svc.incrLeadCloseWon(50000) // 营收 = 50000
    const snap = svc.snapshot()
    assert.ok(snap.roi > 0)
    assert.equal(snap.avgOrderValue, 50000)
  })
})

// ─── reset ──────────────────────────────────────────────

describe('[marketing-metrics] service: reset', () => {
  it('reset 后所有计数器归零', () => {
    const svc = makeService()
    svc.incrCouponRedemption(true)
    svc.incrLeadCloseWon(50000)
    svc.incrCampaignTrigger(5, 3)
    svc.reset()
    const snap = svc.snapshot()
    assert.equal(snap.couponRedemptionTotal, 0)
    assert.equal(snap.roi, 0)
    assert.equal(snap.avgOrderValue, 0)
  })

  it('reset 后 Prometheus 导出归零', () => {
    const svc = makeService()
    svc.incrCouponRedemption(true)
    svc.reset()
    const text = svc.toPrometheus()
    assert.ok(text.includes('coupon_redemption_total 0'))
  })

  it('多次 reset 后仍正常计数', () => {
    const svc = makeService()
    svc.reset()
    svc.reset()
    svc.incrCouponRedemption(false)
    const snap = svc.snapshot()
    assert.equal(snap.couponRedemptionTotal, 1)
  })

  it('未记录任何指标时 reset 不报错', () => {
    const svc = makeService()
    svc.reset()
    const snap = svc.snapshot()
    assert.equal(snap.couponRedemptionTotal, 0)
  })
})

describe('[marketing-metrics] service: tenant isolation', () => {
  it('不同 tenant 的快照彼此隔离', () => {
    const svc = makeService()
    const tenantA = tenantKey('A')
    const tenantB = tenantKey('B')

    svc.incrCouponRedemption(true, tenantA)
    svc.incrCouponIssued(10, tenantA)
    svc.incrCouponRedemption(false, tenantB)
    svc.incrLeadCloseWon(20000, tenantB)

    const tenantASnapshot = svc.snapshot(tenantA)
    const tenantBSnapshot = svc.snapshot(tenantB)

    assert.equal(tenantASnapshot.couponRedemptionTotal, 1)
    assert.equal(tenantASnapshot.couponIssuedTotal, 10)
    assert.equal(tenantASnapshot.leadCloseWonTotal, 0)
    assert.equal(tenantBSnapshot.couponRedemptionTotal, 1)
    assert.equal(tenantBSnapshot.couponIssuedTotal, 0)
    assert.equal(tenantBSnapshot.leadCloseWonTotal, 1)
  })

  it('Prometheus 导出仅包含当前 tenant 指标', () => {
    const svc = makeService()
    const tenantA = tenantKey('A')
    const tenantB = tenantKey('B')

    svc.incrCouponIssued(5, tenantA)
    svc.incrCouponIssued(99, tenantB)

    const tenantAPrometheus = svc.toPrometheus(tenantA)

    assert.ok(tenantAPrometheus.includes('coupon_issued_total 5'))
    assert.ok(!tenantAPrometheus.includes('coupon_issued_total 99'))
  })

  it('reset 仅清空当前 tenant 桶', () => {
    const svc = makeService()
    const tenantA = tenantKey('A')
    const tenantB = tenantKey('B')

    svc.incrNotificationDispatch(tenantA)
    svc.incrNotificationDispatch(tenantB)
    svc.incrNotificationDispatch(tenantB)

    svc.reset(tenantA)

    assert.equal(svc.snapshot(tenantA).notificationDispatchTotal, 0)
    assert.equal(svc.snapshot(tenantB).notificationDispatchTotal, 2)
  })
})

// ─── Prometheus 导出格式 ─────────────────────────────────

describe('[marketing-metrics] service: Prometheus 格式', () => {
  it('空指标导出所有 counter 为 0', () => {
    const svc = makeService()
    const text = svc.toPrometheus()
    assert.ok(text.includes('coupon_redemption_total 0'))
    assert.ok(text.includes('coupon_issued_total 0'))
    assert.ok(text.includes('campaign_trigger_total 0'))
    assert.ok(text.includes('notification_dispatch_total 0'))
  })

  it('跨店核销计数器独立统计', () => {
    const svc = makeService()
    svc.incrCouponRedemption(false)
    svc.incrCouponRedemption(true)
    svc.incrCouponRedemption(true)
    const text = svc.toPrometheus()
    assert.ok(text.includes('coupon_redemption_total 3'))
    assert.ok(text.includes('coupon_cross_store_total 2'))
  })
})

// ─── 高并发 / 大量数据 ───────────────────────────────────

describe('[marketing-metrics] service: 大量数据场景', () => {
  it('1000 次递增不丢失精度', () => {
    const svc = makeService()
    for (let i = 0; i < 1000; i++) {
      svc.incrCouponRedemption(i % 2 === 0)
    }
    const snap = svc.snapshot()
    assert.equal(snap.couponRedemptionTotal, 1000)
  })

  it('大量直方图数据点正确汇总', () => {
    const svc = makeService()
    for (let i = 1; i <= 1000; i++) {
      svc.recordHistogram('bulk_test', i)
    }
    const text = svc.toPrometheus()
    assert.ok(text.includes('bulk_test_avg 500.5'))
    assert.ok(text.includes('bulk_test_count 1000'))
  })
})
