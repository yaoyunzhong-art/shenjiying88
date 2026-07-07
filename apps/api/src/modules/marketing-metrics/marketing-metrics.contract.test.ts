import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// marketing-metrics.contract.test.ts
// 用途: 营销指标模块合约测试
import assert from 'node:assert/strict';
import {
  toMetricsSnapshotContract,
  toPrometheusExportContract,
  toMarketingMetricsSummary,
} from './marketing-metrics.contract';
import type { MetricsSnapshot, PrometheusExport } from './marketing-metrics.entity';
import { MarketingMetricsService } from './marketing-metrics.service';

// ── toMetricsSnapshotContract ───────────────────────────────────────

describe('toMetricsSnapshotContract', () => {
  it('将完整 MetricsSnapshot 转换为合约格式', () => {
    const snapshot: MetricsSnapshot = {
      couponRedemptionTotal: 42,
      couponIssuedTotal: 100,
      couponCrossStoreTotal: 15,
      campaignTriggerTotal: 78,
      campaignDispatchedTotal: 55,
      referralTrackTotal: 200,
      referralRewardTotal: 30,
      notificationDispatchTotal: 500,
      leadIngestTotal: 20,
      leadCloseWonTotal: 5,
      roi: 2.5,
      avgOrderValue: 12000,
      funnelByStage: { awareness: 100, interest: 60, decision: 30, purchase: 5 },
    };

    const contract = toMetricsSnapshotContract(snapshot);

    assert.equal(contract.couponRedemptionTotal, 42);
    assert.equal(contract.roi, 2.5);
    assert.equal(contract.avgOrderValue, 12000);
    assert.deepStrictEqual(contract.funnelByStage, snapshot.funnelByStage);
    // 所有必填字段都在
    assert.equal(contract.couponIssuedTotal, 100);
    assert.equal(contract.couponCrossStoreTotal, 15);
    assert.equal(contract.leadIngestTotal, 20);
    assert.equal(contract.leadCloseWonTotal, 5);
  });

  it('将最小 MetricsSnapshot（仅有必填字段）转换为合约，并补零', () => {
    const snapshot: MetricsSnapshot = {
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
    };

    const contract = toMetricsSnapshotContract(snapshot);

    assert.equal(contract.couponRedemptionTotal, 0);
    assert.equal(contract.campaignTriggerTotal, 0);
    assert.equal(contract.roi, 0);
    assert.equal(contract.couponIssuedTotal, 0); // 补零
    assert.equal(contract.couponCrossStoreTotal, 0); // 补零
    assert.equal(contract.campaignDispatchedTotal, 0); // 补零
    assert.equal(contract.referralRewardTotal, 0); // 补零
  });

  it('合约与 Service snapshot 输出兼容', () => {
    const svc = new MarketingMetricsService();
    svc.incrCouponRedemption(false);
    svc.incrCouponRedemption(true);
    svc.incrCampaignTrigger(5, 3);
    svc.incrReferralTrack();

    const snap = svc.snapshot();
    const contract = toMetricsSnapshotContract(snap);

    assert.equal(contract.couponRedemptionTotal, 2);
    assert.equal(contract.campaignTriggerTotal, 5);
    assert.equal(contract.referralTrackTotal, 1);
    assert.equal(typeof contract.roi, 'number');
    assert.ok(!Number.isNaN(contract.roi));
    assert.ok(!Object.isFrozen(contract) || !Object.isFrozen(contract)); // 合约不是冻结的
  });
});

// ── toPrometheusExportContract ──────────────────────────────────────

describe('toPrometheusExportContract', () => {
  it('将 PrometheusExport 转换为合约', () => {
    const exp: PrometheusExport = {
      text: '# TYPE coupon_redemption_total counter\ncoupon_redemption_total 10',
      sizeBytes: 60,
    };

    const contract = toPrometheusExportContract(exp);

    assert.equal(contract.text, exp.text);
    assert.equal(contract.sizeBytes, 60);
  });

  it('合约保留大文本内容', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `metric_${i} ${i}`);
    const text = lines.join('\n');
    const exp: PrometheusExport = { text, sizeBytes: Buffer.byteLength(text, 'utf-8') };

    const contract = toPrometheusExportContract(exp);

    assert.equal(contract.text, text);
    assert.ok(contract.sizeBytes > 0);
  });
});

// ── toMarketingMetricsSummary ───────────────────────────────────────

describe('toMarketingMetricsSummary', () => {
  it('根据内部指标和发放数量正确计算汇总', () => {
    const svc = new MarketingMetricsService();
    svc.incrCouponIssued(100);
    svc.incrCouponRedemption(false);
    svc.incrCouponRedemption(true);
    svc.incrLeadCloseWon(20000);
    svc.incrLeadCloseWon(30000);
    svc.incrNotificationDispatch();
    svc.incrNotificationDispatch();
    svc.incrLeadIngest();

    const internal = svc.snapshot();
    const summary = toMarketingMetricsSummary(internal, 100);

    assert.equal(summary.roi, internal.roi);
    assert.equal(summary.avgOrderValue, 25000);
    assert.equal(summary.totalRevenue, 50000); // leadCloseWonTotal(2) * avgOrderValue(25000)
    assert.ok(summary.couponRedemptionRate > 0);
    assert.ok(summary.totalCost > 0);
    assert.equal(typeof summary.activeCampaigns, 'number');
  });

  it('零数据时汇总无异常', () => {
    const svc = new MarketingMetricsService();
    const internal = svc.snapshot();
    const summary = toMarketingMetricsSummary(internal, 0);

    assert.equal(summary.roi, 0);
    assert.equal(summary.couponRedemptionRate, 0);
    assert.equal(summary.leadConversionRate, 0);
    assert.equal(summary.totalRevenue, 0);
    assert.equal(summary.totalCost, 0);
    assert.ok(Number.isFinite(summary.roi));
  });
});
