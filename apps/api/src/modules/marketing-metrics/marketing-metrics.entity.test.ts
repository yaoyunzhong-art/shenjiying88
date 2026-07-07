import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [marketing-metrics] [A] entity test 补全
 *
 * 验证营销指标实体接口 / 类型 / 结构完备性
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  MetricsSnapshot,
  PrometheusExport,
  MetricsTrendPoint,
  MetricsTrend,
  MetricsComparison,
  CounterName,
  HistogramName,
} from './marketing-metrics.entity'

// ─── MetricsSnapshot ──

describe('[marketing-metrics] entity: MetricsSnapshot', () => {
  it('所有必填字段存在', () => {
    const snap: MetricsSnapshot = {
      couponRedemptionTotal: 0,
      couponIssuedTotal: 0,
      couponCrossStoreTotal: 0,
      campaignTriggerTotal: 0,
      campaignDispatchedTotal: 0,
      referralTrackTotal: 0,
      referralRewardTotal: 0,
      notificationDispatchTotal: 0,
      leadIngestTotal: 0,
      leadCloseWonTotal: 0,
      roi: 0,
      avgOrderValue: 0,
      funnelByStage: {},
    }
    assert.equal(snap.couponRedemptionTotal, 0)
    assert.equal(snap.roi, 0)
    assert.deepEqual(snap.funnelByStage, {})
  })

  it('字段类型正确', () => {
    const snap: MetricsSnapshot = {
      couponRedemptionTotal: 100,
      couponIssuedTotal: 200,
      couponCrossStoreTotal: 30,
      campaignTriggerTotal: 50,
      campaignDispatchedTotal: 40,
      referralTrackTotal: 10,
      referralRewardTotal: 5,
      notificationDispatchTotal: 80,
      leadIngestTotal: 20,
      leadCloseWonTotal: 3,
      roi: 1.5,
      avgOrderValue: 25000,
      funnelByStage: { visit: 1000, signup: 200, purchase: 50 },
    }
    assert.equal(typeof snap.couponRedemptionTotal, 'number')
    assert.equal(typeof snap.roi, 'number')
    assert.equal(typeof snap.avgOrderValue, 'number')
    assert.ok(typeof snap.funnelByStage === 'object')
    assert.equal(snap.leadCloseWonTotal, 3)
  })
})

// ─── PrometheusExport ──

describe('[marketing-metrics] entity: PrometheusExport', () => {
  it('包含 text 和 sizeBytes', () => {
    const exp: PrometheusExport = { text: '# TYPE test counter\ntest 1', sizeBytes: 26 }
    assert.equal(exp.text, '# TYPE test counter\ntest 1')
    assert.equal(exp.sizeBytes, 26)
  })
})

// ─── MetricsTrendPoint ──

describe('[marketing-metrics] entity: MetricsTrendPoint', () => {
  it('必填 timestamp + value, 可选 label', () => {
    const p: MetricsTrendPoint = { timestamp: '2026-06-26T00:00:00Z', value: 100 }
    assert.equal(p.timestamp, '2026-06-26T00:00:00Z')
    assert.equal(p.value, 100)
    assert.equal(p.label, undefined)

    const p2: MetricsTrendPoint = { timestamp: '2026-06-26T01:00:00Z', value: 200, label: 'campaign-A' }
    assert.equal(p2.label, 'campaign-A')
  })
})

// ─── MetricsTrend ──

describe('[marketing-metrics] entity: MetricsTrend', () => {
  it('包含 metricName / points / direction / changeRate', () => {
    const trend: MetricsTrend = {
      metricName: 'coupon_redemption_total',
      points: [
        { timestamp: '2026-06-25T00:00:00Z', value: 10 },
        { timestamp: '2026-06-26T00:00:00Z', value: 20 },
      ],
      direction: 'up',
      changeRate: 100,
    }
    assert.equal(trend.metricName, 'coupon_redemption_total')
    assert.equal(trend.direction, 'up')
    assert.equal(trend.changeRate, 100)
    assert.equal(trend.points.length, 2)
  })

  it('direction 枚举值: up / down / flat', () => {
    const upTrend: MetricsTrend = { metricName: 'a', points: [], direction: 'up', changeRate: 10 }
    const downTrend: MetricsTrend = { metricName: 'b', points: [], direction: 'down', changeRate: -10 }
    const flatTrend: MetricsTrend = { metricName: 'c', points: [], direction: 'flat', changeRate: 0 }
    assert.equal(upTrend.direction, 'up')
    assert.equal(downTrend.direction, 'down')
    assert.equal(flatTrend.direction, 'flat')
  })
})

// ─── MetricsComparison ──

describe('[marketing-metrics] entity: MetricsComparison', () => {
  it('包含 current / baseline / diff / changeRate', () => {
    const makeSnap = (v: number): MetricsSnapshot => ({
      couponRedemptionTotal: v, couponIssuedTotal: v, couponCrossStoreTotal: v,
      campaignTriggerTotal: v, campaignDispatchedTotal: v, referralTrackTotal: v,
      referralRewardTotal: v, notificationDispatchTotal: v, leadIngestTotal: v,
      leadCloseWonTotal: v, roi: 0, avgOrderValue: 0, funnelByStage: {},
    })
    const comp: MetricsComparison = {
      current: makeSnap(100),
      baseline: makeSnap(50),
      diff: { couponRedemptionTotal: 50 },
      changeRate: { couponRedemptionTotal: 100 },
    }
    assert.equal(comp.current.couponRedemptionTotal, 100)
    assert.equal(comp.baseline.couponRedemptionTotal, 50)
    assert.equal(comp.diff.couponRedemptionTotal, 50)
    assert.equal(comp.changeRate.couponRedemptionTotal, 100)
  })
})

// ─── CounterName ──

describe('[marketing-metrics] entity: CounterName', () => {
  it('类型别名可用且包含所有计数器名', () => {
    const names: CounterName[] = [
      'coupon_redemption_total',
      'coupon_issued_total',
      'coupon_cross_store_total',
      'campaign_trigger_total',
      'campaign_dispatched_total',
      'referral_track_total',
      'referral_reward_total',
      'notification_dispatch_total',
      'lead_ingest_total',
      'lead_close_won_total',
    ]
    assert.equal(names.length, 10)
    for (const n of names) {
      assert.ok(typeof n === 'string' && n.length > 0)
    }
  })
})

// ─── HistogramName ──

describe('[marketing-metrics] entity: HistogramName', () => {
  it('类型别名包含预定义的直方图名称', () => {
    const names: HistogramName[] = [
      'lead_won_amount',
      'order_value',
      'campaign_response_time',
    ]
    assert.equal(names.length, 3)
    for (const n of names) {
      assert.ok(typeof n === 'string' && n.length > 0)
    }
  })
})
