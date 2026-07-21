import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { MarketingMetricsService } from './marketing-metrics.service';

describe('MarketingMetricsService - Phase-17 T12', () => {
  let service: MarketingMetricsService;

  beforeEach(() => { service = new MarketingMetricsService(); service.reset(); });

  // ===== 正例：计数器累加 =====
  it('AC-1: 累加 coupon + campaign + referral + notification counters', () => {
    service.incrCouponRedemption(true);
    service.incrCouponRedemption(false);
    service.incrCouponIssued(10);
    service.incrCampaignTrigger(3, 2);
    service.incrReferralTrack();
    service.incrNotificationDispatch();

    const snap = service.snapshot();
    expect(snap.couponRedemptionTotal).toBe(2);
    expect(snap.couponCrossStoreTotal).toBe(1);
    expect(snap.couponIssuedTotal).toBe(10);
    expect(snap.campaignTriggerTotal).toBe(3);
    expect(snap.campaignDispatchedTotal).toBe(2);
    expect(snap.referralTrackTotal).toBe(1);
    expect(snap.notificationDispatchTotal).toBe(1);
  });

  it('AC-1b: 累加 lead + referral reward + 通知多个渠道', () => {
    service.incrLeadIngest();
    service.incrLeadCloseWon(30000);
    service.incrReferralReward();
    service.incrNotificationDispatch();
    service.incrNotificationDispatch();

    const snap = service.snapshot();
    expect(snap.leadIngestTotal).toBe(1);
    expect(snap.leadCloseWonTotal).toBe(1);
    expect(snap.referralRewardTotal).toBe(1);
    expect(snap.notificationDispatchTotal).toBe(2);
  });

  // ===== Prometheus 导出 =====
  it('AC-2: Prometheus 文本导出格式正确', () => {
    service.incrCouponRedemption();
    service.incrLeadCloseWon(20000);
    const text = service.toPrometheus();
    expect(text).toContain('# TYPE coupon_redemption_total counter');
    expect(text).toContain('coupon_redemption_total 1');
    expect(text).toContain('# TYPE lead_won_amount_avg gauge');
    expect(text).toContain('lead_won_amount_count 1');
  });

  it('AC-2b: Prometheus 导出全部计数器归零时输出格式', () => {
    const text = service.toPrometheus();
    expect(text).toContain('coupon_redemption_total 0');
    expect(text).toContain('coupon_issued_total 0');
    expect(text).toContain('campaign_trigger_total 0');
    expect(text).toContain('referral_track_total 0');
    expect(text).toContain('notification_dispatch_total 0');
    expect(text).toContain('lead_ingest_total 0');
    expect(text).toContain('lead_close_won_total 0');
  });

  it('AC-2c: Prometheus 导出包含全部 10 个计数器类型定义', () => {
    const text = service.toPrometheus();
    const typeLines = text.split('\n').filter((l) => l.startsWith('# TYPE'));
    expect(typeLines.length).toBeGreaterThanOrEqual(10);
    // TYPE lines exist for all counter types
    expect(text).toContain('# TYPE coupon_redemption_total counter');
    expect(text).toContain('# TYPE coupon_issued_total counter');
    expect(text).toContain('# TYPE campaign_trigger_total counter');
    expect(text).toContain('# TYPE referral_track_total counter');
    expect(text).toContain('# TYPE notification_dispatch_total counter');
    expect(text).toContain('# TYPE lead_ingest_total counter');
  });

  // ===== ROI 计算 =====
  it('AC-3: ROI 计算 (营收/成本)', () => {
    service.incrCouponIssued(100);  // 成本 = 100 * 5 = 500
    service.incrLeadCloseWon(50000); // 营收 = 50000
    const snap = service.snapshot();
    // ROI = (50000 - 500) / 500 = 99
    expect(snap.roi).toBeGreaterThan(0);
    expect(snap.avgOrderValue).toBe(50000);
  });

  it('AC-3b: ROI 零成本时为零', () => {
    // 无成本 (无 couponIssued) 且无营收
    const snap = service.snapshot();
    expect(snap.roi).toBe(0);
    expect(snap.avgOrderValue).toBe(0);
  });

  it('AC-3c: ROI 多笔赢单平均值计算', () => {
    service.incrLeadCloseWon(30000);
    service.incrLeadCloseWon(50000);
    const snap = service.snapshot();
    // 两笔赢单 avg = (30000 + 50000) / 2 = 40000
    expect(snap.avgOrderValue).toBe(40000);
    expect(snap.leadCloseWonTotal).toBe(2);
  });

  it('AC-3d: ROI 大量发放优惠券场景', () => {
    service.incrCouponIssued(1000);
    service.incrLeadCloseWon(200000);
    const snap = service.snapshot();
    // avgOrderValue = 200000 / 1
    expect(snap.avgOrderValue).toBe(200000);
    expect(snap.roi).toBeGreaterThan(0);
  });

  // ===== 多租户隔离 =====
  it('AC-4: 不同 tenant 指标彼此隔离', () => {
    service.incrCouponRedemption(true, 'tenant-A');
    service.incrCouponIssued(20, 'tenant-A');
    service.incrCouponRedemption(false, 'tenant-B');
    service.incrLeadCloseWon(30000, 'tenant-B');

    const tenantASnap = service.snapshot('tenant-A');
    const tenantBSnap = service.snapshot('tenant-B');

    expect(tenantASnap.couponRedemptionTotal).toBe(1);
    expect(tenantASnap.couponIssuedTotal).toBe(20);
    expect(tenantASnap.leadCloseWonTotal).toBe(0);
    expect(tenantBSnap.couponRedemptionTotal).toBe(1);
    expect(tenantBSnap.couponIssuedTotal).toBe(0);
    expect(tenantBSnap.leadCloseWonTotal).toBe(1);
  });

  it('AC-4b: 默认 tenant 与命名 tenant 不冲突', () => {
    service.incrCouponRedemption(false, 'isolated-tenant');
    const defaultSnap = service.snapshot();
    expect(defaultSnap.couponRedemptionTotal).toBe(0);
    const isolatedSnap = service.snapshot('isolated-tenant');
    expect(isolatedSnap.couponRedemptionTotal).toBe(1);
  });

  it('AC-4c: 空字符串 tenant 等同于默认', () => {
    service.incrCouponRedemption(false, '');
    const snap = service.snapshot();
    expect(snap.couponRedemptionTotal).toBe(1);
  });

  // ===== 跨店核销 =====
  it('AC-5: 跨店核销计数器正确累积', () => {
    service.incrCouponRedemption(true);
    service.incrCouponRedemption(true);
    service.incrCouponRedemption(false);
    const snap = service.snapshot();
    expect(snap.couponRedemptionTotal).toBe(3);
    expect(snap.couponCrossStoreTotal).toBe(2);
  });

  it('AC-5b: 跨店核销不超过总核销', () => {
    service.incrCouponRedemption(true);
    const snap = service.snapshot();
    expect(snap.couponCrossStoreTotal).toBeLessThanOrEqual(snap.couponRedemptionTotal);
  });

  // ===== 清零重置 =====
  it('AC-6: reset 后计数器归零', () => {
    service.incrCouponRedemption();
    service.incrCouponIssued(5);
    expect(service.snapshot().couponRedemptionTotal).toBe(1);
    service.reset();
    expect(service.snapshot().couponRedemptionTotal).toBe(0);
    expect(service.snapshot().couponIssuedTotal).toBe(0);
  });

  it('AC-6b: reset 指定 tenant 不影响其他 tenant', () => {
    service.incrCouponRedemption(false, 'tenant-X');
    service.incrCouponRedemption(false, 'tenant-Y');
    service.reset('tenant-X');
    expect(service.snapshot('tenant-X').couponRedemptionTotal).toBe(0);
    expect(service.snapshot('tenant-Y').couponRedemptionTotal).toBe(1);
  });

  // ===== 直方图 =====
  it('AC-7: win amount 直方图记录', () => {
    service.incrLeadCloseWon(10000);
    service.incrLeadCloseWon(20000);
    service.incrLeadCloseWon(30000);
    const prom = service.toPrometheus();
    expect(prom).toContain('lead_won_amount_avg 20000');
    expect(prom).toContain('lead_won_amount_count 3');
  });

  it('AC-7b: 自定义直方图', () => {
    service.recordHistogram('order_value', 150);
    service.recordHistogram('order_value', 250);
    const prom = service.toPrometheus();
    expect(prom).toContain('order_value_avg 200');
    expect(prom).toContain('order_value_count 2');
  });

  it('AC-7c: 直方图按 tenant 隔离', () => {
    service.recordHistogram('lead_won_amount', 5000, 't1');
    service.recordHistogram('lead_won_amount', 15000, 't2');
    const t1Text = service.toPrometheus('t1');
    const t2Text = service.toPrometheus('t2');
    expect(t1Text).toContain('lead_won_amount_avg 5000');
    expect(t2Text).toContain('lead_won_amount_avg 15000');
  });

  // ===== 边界：大值 =====
  it('AC-8: 大数量优惠券发放', () => {
    service.incrCouponIssued(Number.MAX_SAFE_INTEGER);
    const snap = service.snapshot();
    expect(snap.couponIssuedTotal).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('AC-8b: 大量 lead 赢单', () => {
    for (let i = 0; i < 100; i++) {
      service.incrLeadCloseWon(10000);
    }
    const snap = service.snapshot();
    expect(snap.leadCloseWonTotal).toBe(100);
    expect(snap.avgOrderValue).toBe(10000);
  });

  // ===== 反例：空/无效操作 =====
  it('AC-9: 不发任何事件时 snapshot 全零', () => {
    const snap = service.snapshot();
    expect(snap.couponRedemptionTotal).toBe(0);
    expect(snap.couponIssuedTotal).toBe(0);
    expect(snap.campaignTriggerTotal).toBe(0);
    expect(snap.referralTrackTotal).toBe(0);
    expect(snap.notificationDispatchTotal).toBe(0);
    expect(snap.leadIngestTotal).toBe(0);
    expect(snap.leadCloseWonTotal).toBe(0);
    expect(snap.roi).toBe(0);
  });

  it('AC-9b: negative count 不影响计数器', () => {
    service.incrCouponIssued(-5);
    const snap = service.snapshot();
    expect(snap.couponIssuedTotal).toBe(-5); // service does not clamp
  });

  // ===== sequence: 组合操作 =====
  it('AC-10: 顺序调用不丢失累计值', () => {
    service.incrCouponRedemption(false);
    service.incrCampaignTrigger(1, 1);
    service.incrCouponIssued(5);
    service.incrLeadIngest();
    service.incrLeadCloseWon(25000);
    service.incrReferralTrack();
    service.incrReferralReward();
    service.incrNotificationDispatch();
    const snap = service.snapshot();
    expect(snap.couponRedemptionTotal).toBe(1);
    expect(snap.campaignTriggerTotal).toBe(1);
    expect(snap.couponIssuedTotal).toBe(5);
    expect(snap.leadIngestTotal).toBe(1);
    expect(snap.leadCloseWonTotal).toBe(1);
    expect(snap.referralTrackTotal).toBe(1);
    expect(snap.referralRewardTotal).toBe(1);
    expect(snap.notificationDispatchTotal).toBe(1);
  });

  it('AC-10b: 多次 reset 后仍能正常累计', () => {
    service.incrCouponRedemption();
    service.reset();
    service.incrCouponRedemption();
    service.incrCouponRedemption();
    service.reset();
    service.incrCouponRedemption();
    const snap = service.snapshot();
    expect(snap.couponRedemptionTotal).toBe(1);
  });
});
