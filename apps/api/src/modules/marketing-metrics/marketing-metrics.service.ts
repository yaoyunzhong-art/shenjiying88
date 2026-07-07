// marketing-metrics.service.ts - Phase-17 T12
// 用途: 营销 ROI 指标采集 + Prometheus 导出
// 关联: tasks.md T12
import { Injectable } from '@nestjs/common';

export interface MarketingMetrics {
  /** 优惠券核销总数 */
  couponRedemptionTotal: number;
  /** 优惠券发放总数 */
  couponIssuedTotal: number;
  /** 跨店核销总数 */
  couponCrossStoreTotal: number;
  /** 营销活动触发总数 */
  campaignTriggerTotal: number;
  /** 营销活动下发总数 */
  campaignDispatchedTotal: number;
  /** 裂变追踪总数 */
  referralTrackTotal: number;
  /** 裂变奖励总数 */
  referralRewardTotal: number;
  /** 通知发送总数 */
  notificationDispatchTotal: number;
  /** 线索流入总数 */
  leadIngestTotal: number;
  /** 赢单总数 */
  leadCloseWonTotal: number;
  /** 转化漏斗 (按阶段) */
  funnelByStage: Record<string, number>;
  /** ROI 计算 (营收/成本) */
  roi: number;
  /** 平均客单价 */
  avgOrderValue: number;
}

export interface PrometheusExporter {
  metricsText(): string;
}

interface MetricsCounters {
  coupon_redemption_total: number;
  coupon_issued_total: number;
  coupon_cross_store_total: number;
  campaign_trigger_total: number;
  campaign_dispatched_total: number;
  referral_track_total: number;
  referral_reward_total: number;
  notification_dispatch_total: number;
  lead_ingest_total: number;
  lead_close_won_total: number;
}

interface TenantMetricsBucket {
  counters: MetricsCounters;
  histograms: Map<string, number[]>;
}

/**
 * MarketingMetricsService - 营销指标聚合
 *
 * 采集维度:
 * - 优惠券: redemptions / coupons issued / cross-store rate
 * - 触发器: matched / dispatched / skipped
 * - 裂变: codes / clicks / signups / rewards
 * - 通知: dispatches / open rate / opt-out
 */
@Injectable()
export class MarketingMetricsService {
  private static readonly DEFAULT_TENANT_ID = '__global__';

  private readonly tenantBuckets = new Map<string, TenantMetricsBucket>();

  private createEmptyCounters(): MetricsCounters {
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
    };
  }

  private createEmptyBucket(): TenantMetricsBucket {
    return {
      counters: this.createEmptyCounters(),
      histograms: new Map<string, number[]>(),
    };
  }

  private normalizeTenantId(tenantId?: string): string {
    const normalized = tenantId?.trim();
    return normalized && normalized.length > 0
      ? normalized
      : MarketingMetricsService.DEFAULT_TENANT_ID;
  }

  private getBucket(tenantId?: string): TenantMetricsBucket {
    const key = this.normalizeTenantId(tenantId);
    const existing = this.tenantBuckets.get(key);

    if (existing) {
      return existing;
    }

    const created = this.createEmptyBucket();
    this.tenantBuckets.set(key, created);
    return created;
  }

  // === Counter 累加 ===
  incrCouponRedemption(crossStore: boolean = false, tenantId?: string): void {
    const bucket = this.getBucket(tenantId);
    bucket.counters.coupon_redemption_total += 1;
    if (crossStore) {
      bucket.counters.coupon_cross_store_total += 1;
    }
  }

  incrCouponIssued(count: number = 1, tenantId?: string): void {
    this.getBucket(tenantId).counters.coupon_issued_total += count;
  }

  incrCampaignTrigger(matched: number, dispatched: number, tenantId?: string): void {
    const bucket = this.getBucket(tenantId);
    bucket.counters.campaign_trigger_total += matched;
    bucket.counters.campaign_dispatched_total += dispatched;
  }

  incrReferralTrack(tenantId?: string): void {
    this.getBucket(tenantId).counters.referral_track_total += 1;
  }

  incrReferralReward(tenantId?: string): void {
    this.getBucket(tenantId).counters.referral_reward_total += 1;
  }

  incrNotificationDispatch(tenantId?: string): void {
    this.getBucket(tenantId).counters.notification_dispatch_total += 1;
  }

  incrLeadIngest(tenantId?: string): void {
    this.getBucket(tenantId).counters.lead_ingest_total += 1;
  }

  incrLeadCloseWon(amount: number = 10000, tenantId?: string): void {
    this.getBucket(tenantId).counters.lead_close_won_total += 1;
    this.recordHistogram('lead_won_amount', amount, tenantId);
  }

  recordHistogram(name: string, value: number, tenantId?: string): void {
    const bucket = this.getBucket(tenantId);
    if (!bucket.histograms.has(name)) {
      bucket.histograms.set(name, []);
    }
    bucket.histograms.get(name)!.push(value);
  }

  // === 聚合 ===
  snapshot(tenantId?: string): MarketingMetrics {
    const bucket = this.getBucket(tenantId);
    const orderValueHist = bucket.histograms.get('order_value') ?? [];
    const wonHist = bucket.histograms.get('lead_won_amount') ?? [];
    // Prefer real settled order values when present; otherwise fall back to won leads.
    const avgOrderValueSource = orderValueHist.length > 0 ? orderValueHist : wonHist;
    const avgOrderValue = avgOrderValueSource.length > 0
      ? avgOrderValueSource.reduce((s, v) => s + v, 0) / avgOrderValueSource.length
      : 0;
    // ROI = (revenue - cost) / cost (stub)
    const revenue = bucket.counters.lead_close_won_total * avgOrderValue;
    const cost = bucket.counters.coupon_issued_total * 5 + bucket.counters.notification_dispatch_total * 0.1;
    const roi = cost > 0 ? (revenue - cost) / cost : 0;
    return {
      couponRedemptionTotal: bucket.counters.coupon_redemption_total,
      couponIssuedTotal: bucket.counters.coupon_issued_total,
      couponCrossStoreTotal: bucket.counters.coupon_cross_store_total,
      campaignTriggerTotal: bucket.counters.campaign_trigger_total,
      campaignDispatchedTotal: bucket.counters.campaign_dispatched_total,
      referralTrackTotal: bucket.counters.referral_track_total,
      referralRewardTotal: bucket.counters.referral_reward_total,
      notificationDispatchTotal: bucket.counters.notification_dispatch_total,
      leadIngestTotal: bucket.counters.lead_ingest_total,
      leadCloseWonTotal: bucket.counters.lead_close_won_total,
      funnelByStage: {},
      roi,
      avgOrderValue,
    };
  }

  // === Prometheus 导出 ===
  toPrometheus(tenantId?: string): string {
    const bucket = this.getBucket(tenantId);
    const lines: string[] = [];
    for (const [name, value] of Object.entries(bucket.counters)) {
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${value}`);
    }
    for (const [name, values] of bucket.histograms.entries()) {
      const sum = values.reduce((s, v) => s + v, 0);
      const count = values.length;
      const avg = count > 0 ? sum / count : 0;
      lines.push(`# TYPE ${name}_avg gauge`);
      lines.push(`${name}_avg ${avg}`);
      lines.push(`# TYPE ${name}_count counter`);
      lines.push(`${name}_count ${count}`);
    }
    return lines.join('\n');
  }

  reset(tenantId?: string): void {
    const key = this.normalizeTenantId(tenantId);
    this.tenantBuckets.set(key, this.createEmptyBucket());
  }
}
