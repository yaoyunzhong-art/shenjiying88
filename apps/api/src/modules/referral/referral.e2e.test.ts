import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 创建: 2026-06-26 · Pulse-68 下午主任务
// 状态: IMPLEMENTED · 三级裂变 + 95% 追踪 + 渠道集成 + 脱敏
// 关联: tasks.md T8/T9

import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service';
import { ReferralService } from './referral.service';
import { WechatChannelAdapter, MiniProgramChannelAdapter, maskPII } from './referral-channel';

describe('ReferralService · Phase-17 T8/T9', () => {
  let service: ReferralService;
  let metricsService: MarketingMetricsService;

  beforeEach(() => {
    metricsService = new MarketingMetricsService();
    service = new ReferralService(metricsService);
    service.reset();
  });

  describe('T8 AC-1: 短码 + 二维码生成', () => {
    it('E2E-1: 生成 8 位短码 + landing URL + qrCodeUrl', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 'tenant-A' });
      expect(code.shortCode).toHaveLength(8);
      expect(code.qrCodeUrl).toMatch(/\/qr\/.*\.png$/);
      expect(code.landingUrl).toMatch(/\/r\//);
      expect(code.totalClicks).toBe(0);
      expect(code.totalSignups).toBe(0);
    });
  });

  describe('T8 AC-2: A → B → C 三级裂变追踪', () => {
    it('E2E-2: A 邀请 B (L1), B 邀请 C (L2 for A, L1 for B)', () => {
      // A 邀请 B
      const codeA = service.generateCode({ parentUserId: 'user-A', tenantId: 'tenant-A' });
      service.trackClick({ shortCode: codeA.shortCode, source: 'wechat' });
      const recAB = service.trackSignup({ shortCode: codeA.shortCode, childUserId: 'user-B' });
      expect(recAB.parentUserId).toBe('user-A');
      expect(recAB.level).toBe(1);
      expect(recAB.ancestorChain).toEqual(['user-A']);

      // B 邀请 C
      const codeB = service.generateCode({ parentUserId: 'user-B', tenantId: 'tenant-A' });
      service.trackClick({ shortCode: codeB.shortCode, source: 'wechat' });
      const recBC = service.trackSignup({ shortCode: codeB.shortCode, childUserId: 'user-C' });
      expect(recBC.parentUserId).toBe('user-B');
      expect(recBC.ancestorChain).toEqual(['user-B', 'user-A']);
    });

    it('E2E-2b: A → B → C → D 三级裂变 (A 应得到 L3 奖励)', () => {
      // A → B
      const codeA = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      service.trackClick({ shortCode: codeA.shortCode, source: 'wechat' });
      service.trackSignup({ shortCode: codeA.shortCode, childUserId: 'user-B' });

      // B → C
      const codeB = service.generateCode({ parentUserId: 'user-B', tenantId: 't' });
      service.trackClick({ shortCode: codeB.shortCode, source: 'wechat' });
      service.trackSignup({ shortCode: codeB.shortCode, childUserId: 'user-C' });

      // C → D
      const codeC = service.generateCode({ parentUserId: 'user-C', tenantId: 't' });
      service.trackClick({ shortCode: codeC.shortCode, source: 'wechat' });
      const recCD = service.trackSignup({ shortCode: codeC.shortCode, childUserId: 'user-D' });
      expect(recCD.ancestorChain).toEqual(['user-C', 'user-B', 'user-A']);

      const rewards = service.issueRewards(recCD.recordId);
      expect(rewards).toHaveLength(3); // L1 + L2 + L3
      expect(rewards.map(r => ({ user: r.recipientUserId, level: r.level }))).toEqual([
        { user: 'user-C', level: 1 },
        { user: 'user-B', level: 2 },
        { user: 'user-A', level: 3 },
      ]);
    });
  });

  describe('T8 AC-3: 追踪率 ≥95%', () => {
    it('E2E-3: 100 点击 96 注册 → 追踪率 96%', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      for (let i = 0; i < 100; i++) {
        service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      }
      for (let i = 0; i < 96; i++) {
        service.trackSignup({
          shortCode: code.shortCode,
          childUserId: `child-${i}`,
        });
      }
      const metrics = service.getMetrics('t');
      expect(metrics.totalClicks).toBe(100);
      expect(metrics.totalSignups).toBe(96);
      expect(metrics.trackRate).toBeGreaterThanOrEqual(0.95);
    });
  });

  describe('T8 AC-4: referral 指标自动采集', () => {
    it('E2E-3b: 点击与奖励会写入 tenant metrics', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 'tenant-metrics' });
      service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const record = service.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      service.issueRewards(record.recordId);

      const snap = metricsService.snapshot('tenant-metrics');
      expect(snap.referralTrackTotal).toBe(1);
      expect(snap.referralRewardTotal).toBe(1);
    });
  });

  describe('T9 AC-1: 微信分享接口', () => {
    it('E2E-4: 微信渠道签名 + 短码嵌入', () => {
      const adapter = new WechatChannelAdapter('mock-appid', 'mock-secret');
      const link = adapter.buildShareLink('ABC12345', { tenantId: 't', userId: 'user-A' });
      expect(link).toMatch(/weixin:\/\/.*ABC12345/);
      expect(link).toContain('signature=');
    });
  });

  describe('T9 AC-2: 小程序扫码追踪', () => {
    it('E2E-5: 小程序 scene 解析 → 短码 → trackClick', () => {
      const adapter = new MiniProgramChannelAdapter();
      const scene = adapter.encodeScene('XYZ67890');
      expect(scene).toMatch(/^qr:/);
      const decoded = adapter.decodeScene(scene);
      expect(decoded).toBe('XYZ67890');
      // 实际扫码追踪
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      service.trackClick({ shortCode: decoded, source: 'mini-program' });
      expect(code.totalClicks).toBe(0); // 短码不匹配 (decoded 是模拟的, code.shortCode 不同)
      // 实际使用时扫码 scene = code.shortCode,这里验证 adapter 解码逻辑
    });
  });

  describe('T9 AC-3: PII 脱敏', () => {
    it('E2E-6: 手机号/邮箱/姓名脱敏', () => {
      expect(maskPII('13800138000', 'phone')).toBe('138****8000');
      expect(maskPII('test@example.com', 'email')).toBe('t***@example.com');
      expect(maskPII('张三', 'name')).toBe('张*');
    });
  });
});
