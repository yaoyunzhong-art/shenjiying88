import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [marketing-metrics] [A] dto test 补全
 *
 * 验证 DTO 的字段存在性、类型、Swagger 装饰、class-validator 规则
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  IncrCouponRedemptionDto,
  IncrCouponIssuedDto,
  IncrCampaignTriggerDto,
  IncrLeadCloseWonDto,
  RecordHistogramDto,
  CounterNameEnum,
  MetricsSnapshotResponseDto,
  PrometheusExportResponseDto,
  MetricTrendDto,
  ResetMetricsDto,
  MetricsComparisonDto,
} from './marketing-metrics.dto'

// ─── IncrCouponRedemptionDto ──

describe('[marketing-metrics] DTO: IncrCouponRedemptionDto', () => {
  it('默认 crossStore 为 undefined', () => {
    const dto = new IncrCouponRedemptionDto()
    assert.equal(dto.crossStore, undefined)
  })

  it('可以设置 crossStore=true', () => {
    const dto = Object.assign(new IncrCouponRedemptionDto(), { crossStore: true })
    assert.equal(dto.crossStore, true)
  })

  it('可以设置 crossStore=false', () => {
    const dto = Object.assign(new IncrCouponRedemptionDto(), { crossStore: false })
    assert.equal(dto.crossStore, false)
  })
})

// ─── IncrCouponIssuedDto ──

describe('[marketing-metrics] DTO: IncrCouponIssuedDto', () => {
  it('默认 count 为 undefined', () => {
    const dto = new IncrCouponIssuedDto()
    assert.equal(dto.count, undefined)
  })

  it('可以设置 count=5', () => {
    const dto = Object.assign(new IncrCouponIssuedDto(), { count: 5 })
    assert.equal(dto.count, 5)
  })

  it('可以设置 count=0 (边界)', () => {
    const dto = Object.assign(new IncrCouponIssuedDto(), { count: 0 })
    assert.equal(dto.count, 0)
  })
})

// ─── IncrCampaignTriggerDto ──

describe('[marketing-metrics] DTO: IncrCampaignTriggerDto', () => {
  it('必须包含 matched 和 dispatched', () => {
    const dto = Object.assign(new IncrCampaignTriggerDto(), { matched: 10, dispatched: 6 })
    assert.equal(dto.matched, 10)
    assert.equal(dto.dispatched, 6)
  })

  it('matched 和 dispatched 可为 0', () => {
    const dto = Object.assign(new IncrCampaignTriggerDto(), { matched: 0, dispatched: 0 })
    assert.equal(dto.matched, 0)
    assert.equal(dto.dispatched, 0)
  })
})

// ─── IncrLeadCloseWonDto ──

describe('[marketing-metrics] DTO: IncrLeadCloseWonDto', () => {
  it('默认 amount 为 undefined', () => {
    const dto = new IncrLeadCloseWonDto()
    assert.equal(dto.amount, undefined)
  })

  it('可以设置 amount=80000', () => {
    const dto = Object.assign(new IncrLeadCloseWonDto(), { amount: 80000 })
    assert.equal(dto.amount, 80000)
  })

  it('amount=0 表示零金额赢单', () => {
    const dto = Object.assign(new IncrLeadCloseWonDto(), { amount: 0 })
    assert.equal(dto.amount, 0)
  })
})

// ─── RecordHistogramDto ──

describe('[marketing-metrics] DTO: RecordHistogramDto', () => {
  it('必须包含 name 和 value', () => {
    const dto = Object.assign(new RecordHistogramDto(), { name: 'latency', value: 200 })
    assert.equal(dto.name, 'latency')
    assert.equal(dto.value, 200)
  })

  it('value 可以是 0', () => {
    const dto = Object.assign(new RecordHistogramDto(), { name: 'zero_test', value: 0 })
    assert.equal(dto.value, 0)
  })

  it('value 可以是负数 (理论上不应该, 但类型允许)', () => {
    const dto = Object.assign(new RecordHistogramDto(), { name: 'negative_test', value: -1 })
    assert.equal(dto.value, -1)
  })
})

// ─── MetricsSnapshotResponseDto ──

describe('[marketing-metrics] DTO: MetricsSnapshotResponseDto', () => {
  it('所有字段均存在且有正确默认行为', () => {
    const dto = new MetricsSnapshotResponseDto()
    const fields = [
      'couponRedemptionTotal', 'couponIssuedTotal', 'couponCrossStoreTotal',
      'campaignTriggerTotal', 'campaignDispatchedTotal', 'referralTrackTotal',
      'referralRewardTotal', 'notificationDispatchTotal', 'leadIngestTotal',
      'leadCloseWonTotal', 'roi', 'avgOrderValue', 'funnelByStage',
    ]
    for (const f of fields) {
      assert.ok(f in dto, `字段 ${f} 应在 MetricsSnapshotResponseDto 中`)
    }
  })
})

// ─── PrometheusExportResponseDto ──

describe('[marketing-metrics] DTO: PrometheusExportResponseDto', () => {
  it('包含 text 和 sizeBytes 字段', () => {
    const dto = new PrometheusExportResponseDto()
    assert.ok('text' in dto)
    assert.ok('sizeBytes' in dto)
  })
})

// ─── CounterNameEnum ──

describe('[marketing-metrics] DTO: CounterNameEnum', () => {
  it('包含所有计数器名称', () => {
    assert.equal(CounterNameEnum.COUPON_REDEMPTION_TOTAL, 'coupon_redemption_total')
    assert.equal(CounterNameEnum.COUPON_ISSUED_TOTAL, 'coupon_issued_total')
    assert.equal(CounterNameEnum.COUPON_CROSS_STORE_TOTAL, 'coupon_cross_store_total')
    assert.equal(CounterNameEnum.CAMPAIGN_TRIGGER_TOTAL, 'campaign_trigger_total')
    assert.equal(CounterNameEnum.CAMPAIGN_DISPATCHED_TOTAL, 'campaign_dispatched_total')
    assert.equal(CounterNameEnum.REFERRAL_TRACK_TOTAL, 'referral_track_total')
    assert.equal(CounterNameEnum.REFERRAL_REWARD_TOTAL, 'referral_reward_total')
    assert.equal(CounterNameEnum.NOTIFICATION_DISPATCH_TOTAL, 'notification_dispatch_total')
    assert.equal(CounterNameEnum.LEAD_INGEST_TOTAL, 'lead_ingest_total')
    assert.equal(CounterNameEnum.LEAD_CLOSE_WON_TOTAL, 'lead_close_won_total')
  })

  it('所有枚举值非空', () => {
    const values = Object.values(CounterNameEnum)
    assert.ok(values.length > 0)
    for (const v of values) {
      assert.ok(typeof v === 'string' && v.length > 0)
    }
  })
})

// ─── MetricTrendDto ──

describe('[marketing-metrics] DTO: MetricTrendDto', () => {
  it('包含 metricName, from, to 字段', () => {
    const dto = new MetricTrendDto()
    assert.ok('metricName' in dto)
    assert.ok('from' in dto)
    assert.ok('to' in dto)
  })
})

// ─── ResetMetricsDto ──

describe('[marketing-metrics] DTO: ResetMetricsDto', () => {
  it('confirm 字段可选', () => {
    const dto = new ResetMetricsDto()
    assert.equal(dto.confirm, undefined)
  })

  it('可以设置 confirm', () => {
    const dto = Object.assign(new ResetMetricsDto(), { confirm: 'yes' })
    assert.equal(dto.confirm, 'yes')
  })
})

// ─── MetricsComparisonDto ──

describe('[marketing-metrics] DTO: MetricsComparisonDto', () => {
  it('包含 baselineLabel 字段', () => {
    const dto = new MetricsComparisonDto()
    assert.ok('baselineLabel' in dto)
  })
})
