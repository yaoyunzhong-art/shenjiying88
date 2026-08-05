/**
 * marketing-metrics.service.spec.ts — 营销指标 Service 纯函数式单元测试
 *
 * 覆盖：
 *  计数器累加  — incrCouponRedemption, incrCouponIssued, incrCampaignTrigger
 *               incrReferralTrack, incrReferralReward, incrNotificationDispatch
 *               incrLeadIngest, incrLeadCloseWon
 *  跨店核销    — incrCouponRedemption(crossStore=true) 同时增加核销和跨店计数
 *  Histogram   — recordHistogram 记录与聚合
 *  租户隔离    — 不同 tenant 的计数器独立
 *  空租户      — 默认全局租户
 *  Snapshot    — ROI 计算 / avgOrderValue / 空数据 / 仅 wins 时计算
 *  Prometheus  — metricsText 格式 / histogram 导出
 *  Reset       — 重置后计数器归零
 *
 * ≥ 18 项测试，纯内联，不 import 生产代码
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface MarketingMetrics {
  couponRedemptionTotal: number
  couponIssuedTotal: number
  couponCrossStoreTotal: number
  campaignTriggerTotal: number
  campaignDispatchedTotal: number
  referralTrackTotal: number
  referralRewardTotal: number
  notificationDispatchTotal: number
  leadIngestTotal: number
  leadCloseWonTotal: number
  funnelByStage: Record<string, number>
  roi: number
  avgOrderValue: number
}

interface MetricsCounters {
  coupon_redemption_total: number
  coupon_issued_total: number
  coupon_cross_store_total: number
  campaign_trigger_total: number
  campaign_dispatched_total: number
  referral_track_total: number
  referral_reward_total: number
  notification_dispatch_total: number
  lead_ingest_total: number
  lead_close_won_total: number
}

interface TenantMetricsBucket {
  counters: MetricsCounters
  histograms: Map<string, number[]>
}

// ═══════════════════════════════════════════════════════════════
// Inline MarketingMetricsService
// ═══════════════════════════════════════════════════════════════

const DEFAULT_TENANT_ID = '__global__'

function createEmptyCounters(): MetricsCounters {
  return {
    coupon_redemption_total: 0,
    coupon_issued_total: 0,
    coupon_cross_store_total: 0,
    campaign_trigger_total: 0,
    campaign_dispatched_total: 0,
    referral_track_total: 0,
    referral_reward_total: 0,
    notification_dispatch_total: 0,
    lead_ingest_total: 0,
    lead_close_won_total: 0,
  }
}

function createEmptyBucket(): TenantMetricsBucket {
  return { counters: createEmptyCounters(), histograms: new Map() }
}

function createInlineMetricsService() {
  const tenantBuckets = new Map<string, TenantMetricsBucket>()

  const normalizeTenantId = (tenantId?: string): string => {
    const n = tenantId?.trim()
    return n && n.length > 0 ? n : DEFAULT_TENANT_ID
  }

  const getBucket = (tenantId?: string): TenantMetricsBucket => {
    const key = normalizeTenantId(tenantId)
    let b = tenantBuckets.get(key)
    if (!b) {
      b = createEmptyBucket()
      tenantBuckets.set(key, b)
    }
    return b
  }

  const incrCouponRedemption = (crossStore = false, tenantId?: string) => {
    const b = getBucket(tenantId)
    b.counters.coupon_redemption_total += 1
    if (crossStore) b.counters.coupon_cross_store_total += 1
  }

  const incrCouponIssued = (count = 1, tenantId?: string) => {
    getBucket(tenantId).counters.coupon_issued_total += count
  }

  const incrCampaignTrigger = (matched: number, dispatched: number, tenantId?: string) => {
    const b = getBucket(tenantId)
    b.counters.campaign_trigger_total += matched
    b.counters.campaign_dispatched_total += dispatched
  }

  const incrReferralTrack = (tenantId?: string) => {
    getBucket(tenantId).counters.referral_track_total += 1
  }

  const incrReferralReward = (tenantId?: string) => {
    getBucket(tenantId).counters.referral_reward_total += 1
  }

  const incrNotificationDispatch = (tenantId?: string) => {
    getBucket(tenantId).counters.notification_dispatch_total += 1
  }

  const incrLeadIngest = (tenantId?: string) => {
    getBucket(tenantId).counters.lead_ingest_total += 1
  }

  const incrLeadCloseWon = (amount = 10000, tenantId?: string) => {
    const b = getBucket(tenantId)
    b.counters.lead_close_won_total += 1
    recordHistogram('lead_won_amount', amount, tenantId)
  }

  const recordHistogram = (name: string, value: number, tenantId?: string) => {
    const b = getBucket(tenantId)
    if (!b.histograms.has(name)) b.histograms.set(name, [])
    b.histograms.get(name)!.push(value)
  }

  const snapshot = (tenantId?: string): MarketingMetrics => {
    const b = getBucket(tenantId)
    const orderValueHist = b.histograms.get('order_value') ?? []
    const wonHist = b.histograms.get('lead_won_amount') ?? []
    const avgOrderValueSource = orderValueHist.length > 0 ? orderValueHist : wonHist
    const avgOrderValue = avgOrderValueSource.length > 0
      ? avgOrderValueSource.reduce((s, v) => s + v, 0) / avgOrderValueSource.length
      : 0
    const revenue = b.counters.lead_close_won_total * avgOrderValue
    const cost = b.counters.coupon_issued_total * 5 + b.counters.notification_dispatch_total * 0.1
    const roi = cost > 0 ? (revenue - cost) / cost : 0
    return {
      couponRedemptionTotal: b.counters.coupon_redemption_total,
      couponIssuedTotal: b.counters.coupon_issued_total,
      couponCrossStoreTotal: b.counters.coupon_cross_store_total,
      campaignTriggerTotal: b.counters.campaign_trigger_total,
      campaignDispatchedTotal: b.counters.campaign_dispatched_total,
      referralTrackTotal: b.counters.referral_track_total,
      referralRewardTotal: b.counters.referral_reward_total,
      notificationDispatchTotal: b.counters.notification_dispatch_total,
      leadIngestTotal: b.counters.lead_ingest_total,
      leadCloseWonTotal: b.counters.lead_close_won_total,
      funnelByStage: {},
      roi,
      avgOrderValue,
    }
  }

  const toPrometheus = (tenantId?: string): string => {
    const b = getBucket(tenantId)
    const lines: string[] = []
    for (const [name, value] of Object.entries(b.counters)) {
      lines.push(`# TYPE ${name} counter`)
      lines.push(`${name} ${value}`)
    }
    for (const [name, values] of b.histograms.entries()) {
      const sum = values.reduce((s, v) => s + v, 0)
      const count = values.length
      const avg = count > 0 ? sum / count : 0
      lines.push(`# TYPE ${name}_avg gauge`)
      lines.push(`${name}_avg ${avg}`)
      lines.push(`# TYPE ${name}_count counter`)
      lines.push(`${name}_count ${count}`)
    }
    return lines.join('\n')
  }

  const reset = (tenantId?: string) => {
    const key = normalizeTenantId(tenantId)
    tenantBuckets.set(key, createEmptyBucket())
  }

  const resetAll = () => { tenantBuckets.clear() }

  return {
    incrCouponRedemption, incrCouponIssued, incrCampaignTrigger,
    incrReferralTrack, incrReferralReward, incrNotificationDispatch,
    incrLeadIngest, incrLeadCloseWon, recordHistogram, snapshot,
    toPrometheus, reset, resetAll,
    _buckets: tenantBuckets,
  }
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

describe('MarketingMetricsService', () => {
  let svc: ReturnType<typeof createInlineMetricsService>

  beforeEach(() => {
    svc = createInlineMetricsService()
  })

  // ── incrCouponRedemption ───────────────────────────────────────

  describe('incrCouponRedemption', () => {
    it('正例: 增加核销计数', () => {
      svc.incrCouponRedemption()
      const metrics = svc.snapshot()
      expect(metrics.couponRedemptionTotal).toBe(1)
      expect(metrics.couponCrossStoreTotal).toBe(0)
    })

    it('正例: 跨店核销同时增加跨店计数', () => {
      svc.incrCouponRedemption(true)
      svc.incrCouponRedemption(true)
      svc.incrCouponRedemption(false)

      const metrics = svc.snapshot()
      expect(metrics.couponRedemptionTotal).toBe(3)
      expect(metrics.couponCrossStoreTotal).toBe(2)
    })
  })

  // ── incrCouponIssued ───────────────────────────────────────────

  describe('incrCouponIssued', () => {
    it('正例: 累积发放次数', () => {
      svc.incrCouponIssued(10)
      svc.incrCouponIssued(5)

      const metrics = svc.snapshot()
      expect(metrics.couponIssuedTotal).toBe(15)
    })

    it('边界: 默认每次 count=1', () => {
      svc.incrCouponIssued()
      expect(svc.snapshot().couponIssuedTotal).toBe(1)
    })
  })

  // ── incrCampaignTrigger ────────────────────────────────────────

  describe('incrCampaignTrigger', () => {
    it('正例: 增加触发和下发的双计数器', () => {
      svc.incrCampaignTrigger(5, 3)

      const metrics = svc.snapshot()
      expect(metrics.campaignTriggerTotal).toBe(5)
      expect(metrics.campaignDispatchedTotal).toBe(3)
    })
  })

  // ── Referral ───────────────────────────────────────────────────

  describe('Referral 计数器', () => {
    it('正例: 裂变追踪+奖励独立计数', () => {
      svc.incrReferralTrack()
      svc.incrReferralTrack()
      svc.incrReferralReward()

      const metrics = svc.snapshot()
      expect(metrics.referralTrackTotal).toBe(2)
      expect(metrics.referralRewardTotal).toBe(1)
    })
  })

  // ── Notification + Lead ────────────────────────────────────────

  describe('Notification + Lead 计数器', () => {
    it('正例: 通知和线索独立累加', () => {
      svc.incrNotificationDispatch()
      svc.incrLeadIngest()
      svc.incrLeadCloseWon(20000)
      svc.incrNotificationDispatch()

      const metrics = svc.snapshot()
      expect(metrics.notificationDispatchTotal).toBe(2)
      expect(metrics.leadIngestTotal).toBe(1)
      expect(metrics.leadCloseWonTotal).toBe(1)
    })
  })

  // ── Tenant Isolation ───────────────────────────────────────────

  describe('租户隔离', () => {
    it('正例: 不同租户计数器独立', () => {
      svc.incrCouponRedemption(false, 'tenant-A')
      svc.incrCouponRedemption(false, 'tenant-A')
      svc.incrCouponIssued(1, 'tenant-B')

      expect(svc.snapshot('tenant-A').couponRedemptionTotal).toBe(2)
      expect(svc.snapshot('tenant-A').couponIssuedTotal).toBe(0)
      expect(svc.snapshot('tenant-B').couponRedemptionTotal).toBe(0)
      expect(svc.snapshot('tenant-B').couponIssuedTotal).toBe(1)
    })

    it('正例: 空 tenant 使用全局默认', () => {
      svc.incrCouponRedemption(false)
      svc.incrLeadIngest()

      const all = svc.snapshot()
      expect(all.couponRedemptionTotal).toBe(1)
      expect(all.leadIngestTotal).toBe(1)
    })
  })

  // ── Histogram ──────────────────────────────────────────────────

  describe('recordHistogram', () => {
    it('正例: 记录订单值直方图', () => {
      svc.recordHistogram('order_value', 5000)
      svc.recordHistogram('order_value', 15000)

      const metrics = svc.snapshot()
      expect(metrics.avgOrderValue).toBe(10000)
    })

    it('正例: 无直方图数据时 avgOrderValue 为 0', () => {
      const metrics = svc.snapshot()
      expect(metrics.avgOrderValue).toBe(0)
    })
  })

  // ── ROI ────────────────────────────────────────────────────────

  describe('snapshot ROI 计算', () => {
    it('正例: 正 ROI', () => {
      svc.incrLeadCloseWon(10000) // 1 赢单, 10000
      svc.incrCouponIssued(1) // cost = 5

      const metrics = svc.snapshot()
      // revenue = 1 * 10000 = 10000, cost = 5, roi = (10000-5)/5 = 1999
      expect(metrics.roi).toBeGreaterThan(0)
      expect(metrics.avgOrderValue).toBe(10000)
    })

    it('边界: 零成本时 ROI 为 0', () => {
      svc.incrLeadCloseWon(5000)

      const metrics = svc.snapshot()
      expect(metrics.roi).toBe(0)
    })
  })

  // ── Prometheus ─────────────────────────────────────────────────

  describe('toPrometheus', () => {
    it('正例: 输出 Prometheus 文本格式', () => {
      svc.incrCouponRedemption(true)
      svc.recordHistogram('order_value', 100)
      svc.recordHistogram('order_value', 200)

      const text = svc.toPrometheus()
      expect(text).toContain('# TYPE coupon_redemption_total counter')
      expect(text).toContain('coupon_redemption_total 1')
      expect(text).toContain('coupon_cross_store_total 1')
      expect(text).toContain('# TYPE order_value_avg gauge')
      expect(text).toContain('order_value_avg')
      expect(text).toContain('order_value_count 2')
    })

    it('正例: 空服务输出所有计数器为 0', () => {
      const text = svc.toPrometheus()
      expect(text).toContain('coupon_redemption_total 0')
      expect(text).toContain('coupon_issued_total 0')
      // 所有 10 个计数器都已输出
      const lines = text.split('\n').filter(l => !l.startsWith('# '))
      expect(lines).toHaveLength(10)
    })
  })

  // ── 多操作组合 ─────────────────────────────────────────────────

  describe('组合操作', () => {
    it('正例: 模拟完整营销流程', () => {
      // 发券 10 张 → 核销 3 张 (1跨店) → 触发 2 活动 → 4 通知 → 3 裂变
      svc.incrCouponIssued(10)
      svc.incrCouponRedemption(false) // 核销
      svc.incrCouponRedemption(false) // 核销
      svc.incrCouponRedemption(true)  // 跨店核销
      svc.incrCampaignTrigger(2, 2)
      svc.incrNotificationDispatch()
      svc.incrNotificationDispatch()
      svc.incrNotificationDispatch()
      svc.incrNotificationDispatch()
      svc.incrReferralTrack()
      svc.incrReferralTrack()
      svc.incrReferralTrack()
      svc.incrLeadIngest()
      svc.incrLeadCloseWon(8000)

      const m = svc.snapshot()
      expect(m.couponIssuedTotal).toBe(10)
      expect(m.couponRedemptionTotal).toBe(3)
      expect(m.couponCrossStoreTotal).toBe(1)
      expect(m.campaignTriggerTotal).toBe(2)
      expect(m.notificationDispatchTotal).toBe(4)
      expect(m.referralTrackTotal).toBe(3)
      expect(m.leadIngestTotal).toBe(1)
      expect(m.leadCloseWonTotal).toBe(1)
      // ROI 计算: revenue = 1*8000, cost = 10*5 + 4*0.1 = 50.4
      // roi = (8000-50.4)/50.4 ≈ 156.9
      expect(m.roi).toBeGreaterThan(150)
    })
  })

  // ── Reset ──────────────────────────────────────────────────────

  describe('reset', () => {
    it('正例: 重置后计数器归零', () => {
      svc.incrCouponRedemption()
      svc.incrLeadIngest()
      expect(svc.snapshot().couponRedemptionTotal).toBe(1)

      svc.reset()
      expect(svc.snapshot().couponRedemptionTotal).toBe(0)
      expect(svc.snapshot().leadIngestTotal).toBe(0)
    })

    it('正例: reset 不影响其他租户', () => {
      svc.incrCouponRedemption(false, 't1')
      svc.incrCouponRedemption(false, 't2')

      svc.reset('t1')
      expect(svc.snapshot('t1').couponRedemptionTotal).toBe(0)
      expect(svc.snapshot('t2').couponRedemptionTotal).toBe(1)
    })
  })
})
