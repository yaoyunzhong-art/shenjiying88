import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [marketing-metrics] [D] controller test 补全
 *
 * 覆盖 MarketingMetricsController 路由:
 *   - GET /marketing-metrics/snapshot
 *   - GET /marketing-metrics/prometheus
 *   - POST /marketing-metrics/coupon/redemption
 *   - POST /marketing-metrics/coupon/issued
 *   - POST /marketing-metrics/campaign/trigger
 *   - POST /marketing-metrics/referral/track
 *   - POST /marketing-metrics/referral/reward
 *   - POST /marketing-metrics/notification/dispatch
 *   - POST /marketing-metrics/lead/ingest
 *   - POST /marketing-metrics/lead/close-won
 *   - POST /marketing-metrics/histogram
 *   - POST /marketing-metrics/reset
 *   - 路由元数据 + 正例反例 + 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import type { Request } from 'express'
import { MarketingMetricsController } from './marketing-metrics.controller'
import { MarketingMetricsService } from './marketing-metrics.service'

// ── 辅助工厂 ──

function createController(svc?: MarketingMetricsService): MarketingMetricsController {
  const service = svc ?? new MarketingMetricsService()
  service.reset()
  return new MarketingMetricsController(service)
}

function createTenantRequest(tenantId: string): Request {
  return {
    headers: {
      'x-tenant-id': tenantId,
    },
  } as unknown as Request
}

// ─── GET /snapshot ──────────────────────────────────────

describe('[marketing-metrics] controller: GET /snapshot', () => {
  it('初始快照所有基础指标为 0', () => {
    const ctrl = createController()
    const snap = ctrl.getSnapshot()
    assert.equal(snap.couponRedemptionTotal, 0)
    assert.equal(snap.campaignTriggerTotal, 0)
    assert.equal(snap.referralTrackTotal, 0)
    assert.equal(snap.notificationDispatchTotal, 0)
    assert.equal(snap.roi, 0)
    assert.equal(snap.avgOrderValue, 0)
  })

  it('记录后快照值正确', () => {
    const ctrl = createController()
    ctrl.recordCouponRedemption({ crossStore: true })
    ctrl.recordCampaignTrigger({ matched: 5, dispatched: 3 })
    ctrl.recordReferralTrack()
    ctrl.recordLeadCloseWon({ amount: 50000 })
    const snap = ctrl.getSnapshot()
    assert.equal(snap.couponRedemptionTotal, 1)
    assert.equal(snap.campaignTriggerTotal, 5)
    assert.equal(snap.referralTrackTotal, 1)
    assert.equal(snap.avgOrderValue, 50000)
  })

  it('快照返回完整 MetricsSnapshot 结构', () => {
    const ctrl = createController()
    const snap = ctrl.getSnapshot()
    assert.ok('couponRedemptionTotal' in snap)
    assert.ok('campaignTriggerTotal' in snap)
    assert.ok('referralTrackTotal' in snap)
    assert.ok('notificationDispatchTotal' in snap)
    assert.ok('roi' in snap)
    assert.ok('avgOrderValue' in snap)
    assert.ok('funnelByStage' in snap)
  })

  it('按请求 tenant 返回隔离快照', () => {
    const ctrl = createController()

    ctrl.recordCouponIssued({ count: 10 }, createTenantRequest('tenant-A'))
    ctrl.recordCouponIssued({ count: 3 }, createTenantRequest('tenant-B'))

    const tenantASnapshot = ctrl.getSnapshot(createTenantRequest('tenant-A'))
    const tenantBSnapshot = ctrl.getSnapshot(createTenantRequest('tenant-B'))

    assert.equal(tenantASnapshot.couponIssuedTotal, 10)
    assert.equal(tenantBSnapshot.couponIssuedTotal, 3)
  })
})

// ─── GET /prometheus ────────────────────────────────────

describe('[marketing-metrics] controller: GET /prometheus', () => {
  it('空指标导出包含所有 counter 行', () => {
    const ctrl = createController()
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('# TYPE coupon_redemption_total counter'))
    assert.ok(prom.text.includes('coupon_redemption_total 0'))
    assert.ok(prom.sizeBytes > 0)
  })

  it('记录后 Prometheus 文本反映实际值', () => {
    const ctrl = createController()
    ctrl.recordCouponRedemption({ crossStore: false })
    ctrl.recordCouponRedemption({ crossStore: true })
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('coupon_redemption_total 2'))
    assert.ok(prom.text.includes('coupon_cross_store_total 1'))
  })

  it('直方图导出包含 _avg 和 _count 行', () => {
    const ctrl = createController()
    ctrl.recordHistogram({ name: 'response_ms', value: 150 })
    ctrl.recordHistogram({ name: 'response_ms', value: 250 })
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('response_ms_avg 200'))
    assert.ok(prom.text.includes('response_ms_count 2'))
  })

  it('Prometheus 导出按 tenant 隔离', () => {
    const ctrl = createController()

    ctrl.recordCouponRedemption({ crossStore: true }, createTenantRequest('tenant-A'))
    ctrl.recordCouponRedemption({ crossStore: true }, createTenantRequest('tenant-B'))
    ctrl.recordCouponRedemption({ crossStore: false }, createTenantRequest('tenant-B'))

    const tenantAProm = ctrl.getPrometheus(createTenantRequest('tenant-A'))
    const tenantBProm = ctrl.getPrometheus(createTenantRequest('tenant-B'))

    assert.ok(tenantAProm.text.includes('coupon_redemption_total 1'))
    assert.ok(tenantAProm.text.includes('coupon_cross_store_total 1'))
    assert.ok(tenantBProm.text.includes('coupon_redemption_total 2'))
    assert.ok(tenantBProm.text.includes('coupon_cross_store_total 1'))
  })
})

// ─── POST 记录端点 ─────────────────────────────────────

describe('[marketing-metrics] controller: POST 记录端点', () => {
  it('recordCouponRedemption 返回 { success: true }', () => {
    const ctrl = createController()
    const res = ctrl.recordCouponRedemption({ crossStore: true })
    assert.deepEqual(res, { success: true })
  })

  it('recordCouponIssued 递增 via Prometheus 验证', () => {
    const ctrl = createController()
    ctrl.recordCouponIssued({ count: 5 })
    ctrl.recordCouponIssued({ count: 3 })
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('coupon_issued_total 8'))
  })

  it('recordCampaignTrigger 传递 matched / dispatched', () => {
    const ctrl = createController()
    ctrl.recordCampaignTrigger({ matched: 10, dispatched: 6 })
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('campaign_trigger_total 10'))
    assert.ok(prom.text.includes('campaign_dispatched_total 6'))
  })

  it('recordReferralTrack + recordReferralReward', () => {
    const ctrl = createController()
    ctrl.recordReferralTrack()
    ctrl.recordReferralReward()
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('referral_track_total 1'))
    assert.ok(prom.text.includes('referral_reward_total 1'))
  })

  it('recordNotificationDispatch 多次递增', () => {
    const ctrl = createController()
    ctrl.recordNotificationDispatch()
    ctrl.recordNotificationDispatch()
    const snap = ctrl.getSnapshot()
    assert.equal(snap.notificationDispatchTotal, 2)
  })

  it('recordLeadIngest 多次递增', () => {
    const ctrl = createController()
    ctrl.recordLeadIngest()
    ctrl.recordLeadIngest()
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('lead_ingest_total 2'))
  })

  it('recordLeadCloseWon 传递 amount', () => {
    const ctrl = createController()
    ctrl.recordLeadCloseWon({ amount: 80000 })
    const snap = ctrl.getSnapshot()
    assert.equal(snap.avgOrderValue, 80000)
  })

  it('recordHistogram 记录数据点', () => {
    const ctrl = createController()
    ctrl.recordHistogram({ name: 'latency', value: 42 })
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('latency_avg 42'))
    assert.ok(prom.text.includes('latency_count 1'))
  })
})

// ─── POST /reset ────────────────────────────────────────

describe('[marketing-metrics] controller: POST /reset', () => {
  it('reset 后 snapshot 所有值归零', () => {
    const ctrl = createController()
    ctrl.recordCouponRedemption({ crossStore: true })
    ctrl.recordLeadCloseWon({ amount: 50000 })
    ctrl.resetMetrics()
    const snap = ctrl.getSnapshot()
    assert.equal(snap.couponRedemptionTotal, 0)
    assert.equal(snap.roi, 0)
    assert.equal(snap.avgOrderValue, 0)
  })

  it('reset 后 Prometheus 所有 counter 归零', () => {
    const ctrl = createController()
    ctrl.recordCouponRedemption({ crossStore: true })
    ctrl.recordCampaignTrigger({ matched: 3, dispatched: 1 })
    ctrl.resetMetrics()
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('coupon_redemption_total 0'))
    assert.ok(prom.text.includes('campaign_trigger_total 0'))
  })

  it('多次 reset 不报错', () => {
    const ctrl = createController()
    ctrl.resetMetrics()
    ctrl.resetMetrics()
    ctrl.recordCouponRedemption({ crossStore: false })
    const snap = ctrl.getSnapshot()
    assert.equal(snap.couponRedemptionTotal, 1)
  })

  it('reset 仅影响当前 tenant', () => {
    const ctrl = createController()

    ctrl.recordNotificationDispatch(createTenantRequest('tenant-A'))
    ctrl.recordNotificationDispatch(createTenantRequest('tenant-B'))
    ctrl.recordNotificationDispatch(createTenantRequest('tenant-B'))

    ctrl.resetMetrics(createTenantRequest('tenant-A'))

    assert.equal(ctrl.getSnapshot(createTenantRequest('tenant-A')).notificationDispatchTotal, 0)
    assert.equal(ctrl.getSnapshot(createTenantRequest('tenant-B')).notificationDispatchTotal, 2)
  })
})

// ─── 边界情况 ───────────────────────────────────────────

describe('[marketing-metrics] controller: 边界情况', () => {
  it('incrCouponIssued 传 count=0', () => {
    const ctrl = createController()
    ctrl.recordCouponIssued({ count: 0 })
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('coupon_issued_total 0'))
  })

  it('recordLeadCloseWon 不传 amount 使用默认值 10000', () => {
    const ctrl = createController()
    ctrl.recordLeadCloseWon({})
    const snap = ctrl.getSnapshot()
    assert.equal(snap.avgOrderValue, 10000)
  })

  it('recordHistogram 传 0 值', () => {
    const ctrl = createController()
    ctrl.recordHistogram({ name: 'zero_test', value: 0 })
    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('zero_test_avg 0'))
    assert.ok(prom.text.includes('zero_test_count 1'))
  })

  it('未记录任何指标时 reset 不报错', () => {
    const ctrl = createController()
    ctrl.resetMetrics()
    const snap = ctrl.getSnapshot()
    assert.equal(snap.couponRedemptionTotal, 0)
  })
})

// ─── 组合场景 ───────────────────────────────────────────

describe('[marketing-metrics] controller: 完整营销漏斗组合场景', () => {
  it('发放 → 核销 → 裂变 → 通知 → 赢单', () => {
    const ctrl = createController()

    ctrl.recordCouponIssued({ count: 100 })
    ctrl.recordCouponRedemption({ crossStore: false })
    ctrl.recordCouponRedemption({ crossStore: false })
    ctrl.recordCouponRedemption({ crossStore: true })
    ctrl.recordReferralTrack()
    ctrl.recordReferralReward()
    ctrl.recordNotificationDispatch()
    ctrl.recordNotificationDispatch()
    ctrl.recordLeadCloseWon({ amount: 80000 })

    const snap = ctrl.getSnapshot()
    assert.equal(snap.couponRedemptionTotal, 3)
    assert.equal(snap.referralTrackTotal, 1)
    assert.equal(snap.notificationDispatchTotal, 2)

    const prom = ctrl.getPrometheus()
    assert.ok(prom.text.includes('coupon_redemption_total 3'))
    assert.ok(prom.text.includes('coupon_issued_total 100'))
    assert.ok(prom.text.includes('referral_track_total 1'))
    assert.ok(prom.text.includes('notification_dispatch_total 2'))
    assert.ok(prom.text.includes('coupon_cross_store_total 1'))
  })
})
