import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: 营销指标 Controller 单元测试 (Vitest runner)
import { MarketingMetricsController } from './marketing-metrics.controller';
import { MarketingMetricsService } from './marketing-metrics.service';

// ── Helper: 创建 Controller ─────────────────────────────────────────
function createController(svc?: MarketingMetricsService) {
  const service = svc ?? new MarketingMetricsService();
  return new MarketingMetricsController(service);
}

describe('MarketingMetricsController', () => {
  // ── 正例：正常业务流程 ────────────────────────────────────────────

  describe('getSnapshot() — positive', () => {
    it('初始状态下所有基础指标为 0', () => {
      const ctrl = createController();
      const snap = ctrl.getSnapshot();
      expect(snap.couponRedemptionTotal).toBe(0);
      expect(snap.campaignTriggerTotal).toBe(0);
      expect(snap.referralTrackTotal).toBe(0);
      expect(snap.notificationDispatchTotal).toBe(0);
      expect(snap.roi).toBe(0);
      expect(snap.avgOrderValue).toBe(0);
    });

    it('记录优惠券核销后 snapshot 正确反映', () => {
      const ctrl = createController();
      ctrl.recordCouponRedemption({ crossStore: false });
      ctrl.recordCouponRedemption({ crossStore: true });
      const snap = ctrl.getSnapshot();
      expect(snap.couponRedemptionTotal).toBe(2);
    });

    it('多次递增不同计数器后 snapshot 正确反映', () => {
      const ctrl = createController();
      ctrl.recordCouponRedemption({ crossStore: true });
      ctrl.recordCampaignTrigger({ matched: 5, dispatched: 3 });
      ctrl.recordReferralTrack();
      ctrl.recordNotificationDispatch();
      ctrl.recordLeadCloseWon({ amount: 50000 });

      const snap = ctrl.getSnapshot();
      expect(snap.couponRedemptionTotal).toBe(1);
      expect(snap.campaignTriggerTotal).toBe(5);
      expect(snap.referralTrackTotal).toBe(1);
      expect(snap.notificationDispatchTotal).toBe(1);
      expect(snap.roi).toBeGreaterThan(0);
    });

    it('赢单后 avgOrderValue 正确', () => {
      const ctrl = createController();
      ctrl.recordLeadCloseWon({ amount: 30000 });
      const snap = ctrl.getSnapshot();
      expect(snap.avgOrderValue).toBe(30000);
    });
  });

  describe('getPrometheus() — positive', () => {
    it('导出 Prometheus 文本包含类型声明行', () => {
      const ctrl = createController();
      ctrl.recordCouponRedemption({ crossStore: true });
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('# TYPE coupon_redemption_total counter');
      expect(prom.text).toContain('coupon_redemption_total 1');
      expect(prom.sizeBytes).toBeGreaterThan(0);
    });

    it('直方图导出包含 _avg 和 _count 行', () => {
      const ctrl = createController();
      ctrl.recordHistogram({ name: 'order_value', value: 100 });
      ctrl.recordHistogram({ name: 'order_value', value: 200 });
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('# TYPE order_value_avg gauge');
      expect(prom.text).toContain('# TYPE order_value_count counter');
      expect(prom.text).toContain('order_value_count 2');
    });

    it('空指标导出文本不含未记录的直方图行', () => {
      const ctrl = createController();
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('# TYPE coupon_redemption_total counter');
      const lines = prom.text.split('\n').filter(l => l.includes('lead_won_amount'));
      expect(lines.length).toBe(0);
    });

    it('couponIssuedTotal 通过 Prometheus 暴露', () => {
      const ctrl = createController();
      ctrl.recordCouponIssued({});
      ctrl.recordCouponIssued({ count: 5 });
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('coupon_issued_total 6');
    });
  });

  describe('记录端点 — positive', () => {
    it('recordCouponRedemption 返回 success', () => {
      const ctrl = createController();
      const res = ctrl.recordCouponRedemption({ crossStore: true });
      expect(res).toEqual({ success: true });
    });

    it('recordReferralTrack 和 recordReferralReward', () => {
      const ctrl = createController();
      ctrl.recordReferralTrack();
      ctrl.recordReferralTrack();
      ctrl.recordReferralReward();
      const snap = ctrl.getSnapshot();
      expect(snap.referralTrackTotal).toBe(2);
      // verify via prometheus too
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('referral_track_total 2');
      expect(prom.text).toContain('referral_reward_total 1');
    });

    it('recordLeadIngest', () => {
      const ctrl = createController();
      ctrl.recordLeadIngest();
      ctrl.recordLeadIngest();
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('lead_ingest_total 2');
    });

    it('recordCampaignTrigger via Prometheus', () => {
      const ctrl = createController();
      ctrl.recordCampaignTrigger({ matched: 5, dispatched: 3 });
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('campaign_trigger_total 5');
      expect(prom.text).toContain('campaign_dispatched_total 3');
    });
  });

  describe('resetMetrics() — positive', () => {
    it('重置后所有计数器归零', () => {
      const ctrl = createController();
      ctrl.recordCouponRedemption({ crossStore: true });
      ctrl.recordLeadCloseWon({ amount: 50000 });

      let snap = ctrl.getSnapshot();
      expect(snap.couponRedemptionTotal).toBeGreaterThan(0);

      ctrl.resetMetrics();
      snap = ctrl.getSnapshot();
      expect(snap.couponRedemptionTotal).toBe(0);
      expect(snap.roi).toBe(0);
    });

    it('重置后 Prometheus 导出归零', () => {
      const ctrl = createController();
      ctrl.recordCouponRedemption({ crossStore: true });
      ctrl.recordCampaignTrigger({ matched: 3, dispatched: 1 });
      ctrl.resetMetrics();
      const prom = ctrl.getPrometheus();
      // counters should be 0 after reset
      expect(prom.text).toContain('coupon_redemption_total 0');
      expect(prom.text).toContain('campaign_trigger_total 0');
    });
  });

  // ── 边界/异常情况 ──────────────────────────────────────────────

  describe('边界情况', () => {
    it('多次 reset 后仍正常工作', () => {
      const ctrl = createController();
      ctrl.resetMetrics();
      ctrl.resetMetrics();
      ctrl.recordCouponRedemption({ crossStore: false });
      const snap = ctrl.getSnapshot();
      expect(snap.couponRedemptionTotal).toBe(1);
    });

    it('incrCouponIssued 传 0 不增加', () => {
      const ctrl = createController();
      ctrl.recordCouponIssued({ count: 0 });
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('coupon_issued_total 0');
    });

    it('incrLeadCloseWon 不传 amount 使用默认值', () => {
      const ctrl = createController();
      ctrl.recordLeadCloseWon({});
      const snap = ctrl.getSnapshot();
      expect(snap.avgOrderValue).toBe(10000);
    });

    it('直方图记录 0 值', () => {
      const ctrl = createController();
      ctrl.recordHistogram({ name: 'zero_test', value: 0 });
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('zero_test_avg');
    });

    it('未记录任何指标时 reset 不报错', () => {
      const ctrl = createController();
      ctrl.resetMetrics();
      const snap = ctrl.getSnapshot();
      expect(snap.couponRedemptionTotal).toBe(0);
    });
  });

  // ── 多操作组合场景 ──────────────────────────────────────────────

  describe('组合场景', () => {
    it('完整营销漏斗: 发放 -> 核销 -> 裂变 -> 赢单', () => {
      const ctrl = createController();

      // 阶段1: 发放优惠券
      ctrl.recordCouponIssued({ count: 100 });
      // 阶段2: 核销
      ctrl.recordCouponRedemption({ crossStore: false });
      ctrl.recordCouponRedemption({ crossStore: false });
      ctrl.recordCouponRedemption({ crossStore: true });
      // 阶段3: 裂变
      ctrl.recordReferralTrack();
      ctrl.recordReferralReward();
      // 阶段4: 通知下发
      ctrl.recordNotificationDispatch();
      ctrl.recordNotificationDispatch();
      // 阶段5: 赢单
      ctrl.recordLeadCloseWon({ amount: 80000 });

      const snap = ctrl.getSnapshot();
      expect(snap.couponRedemptionTotal).toBe(3);
      expect(snap.referralTrackTotal).toBe(1);
      expect(snap.notificationDispatchTotal).toBe(2);
      expect(snap.roi).toBeGreaterThan(0);

      // Prometheus 导出验证深层计数器
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('coupon_redemption_total 3');
      expect(prom.text).toContain('referral_track_total 1');
      expect(prom.text).toContain('coupon_issued_total 100');
      expect(prom.text).toContain('notification_dispatch_total 2');
    });

    it('多次赢单 avgOrderValue 取平均', () => {
      const ctrl = createController();
      ctrl.recordLeadCloseWon({ amount: 20000 });
      ctrl.recordLeadCloseWon({ amount: 40000 });
      const snap = ctrl.getSnapshot();
      expect(snap.avgOrderValue).toBe(30000);
    });

    it('跨店核销独立计数 via Prometheus', () => {
      const ctrl = createController();
      ctrl.recordCouponRedemption({ crossStore: false });
      ctrl.recordCouponRedemption({ crossStore: true });
      ctrl.recordCouponRedemption({ crossStore: true });
      const prom = ctrl.getPrometheus();
      expect(prom.text).toContain('coupon_redemption_total 3');
      expect(prom.text).toContain('coupon_cross_store_total 2');
    });
  });
});
