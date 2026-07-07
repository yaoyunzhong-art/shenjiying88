import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { MarketingMetricsService } from './marketing-metrics.service';

describe('MarketingMetricsService - Phase-17 T12', () => {
  let service: MarketingMetricsService;

  beforeEach(() => { service = new MarketingMetricsService(); service.reset(); });

  it('AC-1: 累加 coupon + campaign + referral + notification counters', () => {
    service.incrCouponRedemption(true);
    service.incrCouponRedemption(false);
    service.incrCouponIssued(10);
    service.incrCampaignTrigger(3, 2);
    service.incrReferralTrack();
    service.incrNotificationDispatch();

    const snap = service.snapshot();
    expect(snap.couponRedemptionTotal).toBe(2);
    expect(snap.campaignTriggerTotal).toBe(3);
    expect(snap.referralTrackTotal).toBe(1);
    expect(snap.notificationDispatchTotal).toBe(1);
  });

  it('AC-2: Prometheus 文本导出格式正确', () => {
    service.incrCouponRedemption();
    service.incrLeadCloseWon(20000);
    const text = service.toPrometheus();
    expect(text).toContain('# TYPE coupon_redemption_total counter');
    expect(text).toContain('coupon_redemption_total 1');
    expect(text).toContain('# TYPE lead_won_amount_avg gauge');
    expect(text).toContain('lead_won_amount_count 1');
  });

  it('AC-3: ROI 计算 (营收/成本)', () => {
    service.incrCouponIssued(100);  // 成本 = 100 * 5 = 500
    service.incrLeadCloseWon(50000); // 营收 = 50000
    const snap = service.snapshot();
    // ROI = (50000 - 500) / 500 = 99
    expect(snap.roi).toBeGreaterThan(0);
    expect(snap.avgOrderValue).toBe(50000);
  });

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
});
