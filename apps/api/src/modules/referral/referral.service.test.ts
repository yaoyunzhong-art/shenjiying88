import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// referral.service.test.ts · Phase-17 T8
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Referral Service 单元测试

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { ReferralService } from './referral.service';

describe('ReferralService', () => {
  let service: ReferralService;

  beforeEach(() => {
    service = new ReferralService();
    service.reset();
  });

  // ── generateCode ──

  describe('generateCode', () => {
    it('should generate 8-char shortCode with qrCodeUrl and landingUrl', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 'tenant-A' });
      assert.equal(code.shortCode.length, 8);
      assert.ok(code.codeId.startsWith('code-'));
      assert.ok(code.qrCodeUrl?.includes('/qr/'));
      assert.ok(code.landingUrl.includes('/r/'));
      assert.equal(code.totalClicks, 0);
      assert.equal(code.totalSignups, 0);
      assert.equal(code.parentUserId, 'user-A');
      assert.equal(code.tenantId, 'tenant-A');
    });

    it('should generate unique shortCode per call', () => {
      const c1 = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const c2 = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      assert.notEqual(c1.shortCode, c2.shortCode);
    });

    it('should respect custom baseUrl', () => {
      const code = service.generateCode({
        parentUserId: 'user-A',
        tenantId: 't',
        baseUrl: 'https://custom.com',
      });
      assert.ok(code.qrCodeUrl?.startsWith('https://custom.com'));
      assert.ok(code.landingUrl?.startsWith('https://custom.com'));
    });

    it('should set expiresAt when expiresInDays given', () => {
      const code = service.generateCode({
        parentUserId: 'user-A',
        tenantId: 't',
        expiresInDays: 30,
      });
      assert.ok(code.expiresAt);
      const expires = new Date(code.expiresAt!).getTime();
      const now = Date.now();
      const diffDays = (expires - now) / 86400000;
      assert.ok(diffDays > 29 && diffDays < 31);
    });

    it('should not set expiresAt when expiresInDays omitted', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      assert.equal(code.expiresAt, undefined);
    });
  });

  // ── getCode ──

  describe('getCode', () => {
    it('should return existing code by shortCode', () => {
      const created = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const found = service.getCode(created.shortCode);
      assert.ok(found);
      assert.deepEqual(found, created);
    });

    it('should return undefined for non-existent shortCode', () => {
      const found = service.getCode('NONEXIST');
      assert.equal(found, undefined);
    });
  });

  // ── trackClick ──

  describe('trackClick', () => {
    it('should increment totalClicks', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const result = service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      assert.ok(result);
      assert.equal(result!.totalClicks, 1);
    });

    it('should increment clicks on multiple calls', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      service.trackClick({ shortCode: code.shortCode, source: 'link' });
      service.trackClick({ shortCode: code.shortCode, source: 'qrcode' });
      assert.equal(service.getCode(code.shortCode)!.totalClicks, 3);
    });

    it('should return undefined for non-existent shortCode', () => {
      const result = service.trackClick({ shortCode: 'NONEXIST', source: 'wechat' });
      assert.equal(result, undefined);
    });

    it('click without signup should not create records (expiry edge case)', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      assert.equal(service.listRecords('t').length, 0);
    });
  });

  // ── trackSignup ──

  describe('trackSignup', () => {
    it('should create a ReferralRecord with level 1 and ancestorChain', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const record = service.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      assert.ok(record.recordId.startsWith('rec-'));
      assert.equal(record.parentUserId, 'user-A');
      assert.equal(record.childUserId, 'user-B');
      assert.equal(record.level, 1);
      assert.deepEqual(record.ancestorChain, ['user-A']);
      assert.equal(record.tracked, true);
    });

    it('should build ancestor chain for deep referrals', () => {
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
      const rec = service.trackSignup({ shortCode: codeC.shortCode, childUserId: 'user-D' });
      assert.deepEqual(rec.ancestorChain, ['user-C', 'user-B', 'user-A']);
    });

    it('should throw error for non-existent shortCode', () => {
      assert.throws(
        () => service.trackSignup({ shortCode: 'NONEXIST', childUserId: 'user-X' }),
        (err: any) => err.message.includes('not found'),
      );
    });

    it('should support custom signupAt', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const record = service.trackSignup({
        shortCode: code.shortCode,
        childUserId: 'user-B',
        signupAt: '2026-06-26T06:00:00Z',
      });
      assert.equal(record.signedUpAt, '2026-06-26T06:00:00Z');
    });
  });

  // ── issueRewards ──

  describe('issueRewards', () => {
    it('should issue L1 reward for single level', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const record = service.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      const rewards = service.issueRewards(record.recordId);
      assert.equal(rewards.length, 1);
      assert.equal(rewards[0].recipientUserId, 'user-A');
      assert.equal(rewards[0].level, 1);
      assert.equal(rewards[0].rewardType, 'points');
      assert.equal(rewards[0].rewardValue, 100);
      assert.equal(rewards[0].status, 'issued');
    });

    it('should issue L1 + L2 + L3 rewards for 3-level chain', () => {
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
      const record = service.trackSignup({ shortCode: codeC.shortCode, childUserId: 'user-D' });

      const rewards = service.issueRewards(record.recordId);
      assert.equal(rewards.length, 3);
      assert.equal(rewards[0].recipientUserId, 'user-C');
      assert.equal(rewards[0].level, 1);
      assert.equal(rewards[0].rewardValue, 100);
      assert.ok(rewards[0].rewardId.startsWith('reward-'));
      assert.equal(rewards[1].recipientUserId, 'user-B');
      assert.equal(rewards[1].level, 2);
      assert.equal(rewards[1].rewardValue, 50);
      assert.equal(rewards[2].recipientUserId, 'user-A');
      assert.equal(rewards[2].level, 3);
      assert.equal(rewards[2].rewardValue, 10);
    });

    it('should include couponPlanId for L1 rewards', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const record = service.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      const rewards = service.issueRewards(record.recordId);
      assert.equal(rewards.length, 1);
      assert.equal(rewards[0].couponPlanId, 'coupon-l1-50');
    });

    it('should throw for non-existent record', () => {
      assert.throws(
        () => service.issueRewards('non-existent'),
        (err: any) => err.message.includes('not found'),
      );
    });
  });

  // ── getMetrics ──

  describe('getMetrics', () => {
    it('should return zeros when no data', () => {
      const metrics = service.getMetrics();
      assert.equal(metrics.totalCodes, 0);
      assert.equal(metrics.totalClicks, 0);
      assert.equal(metrics.totalSignups, 0);
      assert.equal(metrics.totalRewardsIssued, 0);
      assert.equal(metrics.totalRewardsValue, 0);
    });

    it('should return correct metrics for tenant', () => {
      service.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      service.generateCode({ parentUserId: 'user-B', tenantId: 't1' });
      service.generateCode({ parentUserId: 'user-C', tenantId: 't2' });

      const m1 = service.getMetrics('t1');
      assert.equal(m1.totalCodes, 2);

      const m2 = service.getMetrics('t2');
      assert.equal(m2.totalCodes, 1);
    });

    it('should calculate trackRate correctly', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      for (let i = 0; i < 10; i++) {
        service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      }
      for (let i = 0; i < 8; i++) {
        service.trackSignup({ shortCode: code.shortCode, childUserId: `child-${i}` });
      }

      const metrics = service.getMetrics('t');
      assert.equal(metrics.totalClicks, 10);
      assert.equal(metrics.totalSignups, 8);
      assert.equal(metrics.trackRate, 0.8);
    });
  });

  // ── listRecords ──

  describe('listRecords', () => {
    it('should return empty array when no records', () => {
      const records = service.listRecords('t');
      assert.deepEqual(records, []);
    });

    it('should return tenant-scoped records', () => {
      // t1 records
      const code1 = service.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      service.trackClick({ shortCode: code1.shortCode, source: 'wechat' });
      service.trackSignup({ shortCode: code1.shortCode, childUserId: 'user-B' });

      // t2 records
      const code2 = service.generateCode({ parentUserId: 'user-C', tenantId: 't2' });
      service.trackClick({ shortCode: code2.shortCode, source: 'wechat' });
      service.trackSignup({ shortCode: code2.shortCode, childUserId: 'user-D' });

      assert.equal(service.listRecords('t1').length, 1);
      assert.equal(service.listRecords('t2').length, 1);
    });
  });

  // ── listRewards ──

  describe('listRewards', () => {
    it('should return tenant-scoped rewards', () => {
      // t1: A → B
      const code1 = service.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      service.trackClick({ shortCode: code1.shortCode, source: 'wechat' });
      const rec1 = service.trackSignup({ shortCode: code1.shortCode, childUserId: 'user-B' });
      service.issueRewards(rec1.recordId);

      // t2: C → D
      const code2 = service.generateCode({ parentUserId: 'user-C', tenantId: 't2' });
      service.trackClick({ shortCode: code2.shortCode, source: 'wechat' });
      const rec2 = service.trackSignup({ shortCode: code2.shortCode, childUserId: 'user-D' });
      service.issueRewards(rec2.recordId);

      assert.equal(service.listRewards('t1').length, 1);
      assert.equal(service.listRewards('t2').length, 1);
    });
  });

  // ── reset ──

  describe('reset', () => {
    it('should clear all stores', () => {
      service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      assert.ok(service.getMetrics('t').totalCodes > 0);
      service.reset();
      assert.equal(service.getMetrics('t').totalCodes, 0);
    });
  });

  // ── setRewardRules ──

  describe('setRewardRules', () => {
    it('should override reward values', () => {
      service.setRewardRules({
        1: { points: 200, coupon: 100 },
        2: { points: 100, coupon: 0 },
        3: { points: 20, coupon: 0 },
      });

      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const record = service.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      const rewards = service.issueRewards(record.recordId);
      assert.equal(rewards[0].rewardValue, 200);
      assert.equal(rewards[0].couponPlanId, 'coupon-l1-100');
    });
  });

  // ── Edge Cases ──

  describe('edge cases', () => {
    it('click without signup should not create records', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      assert.equal(service.listRecords('t').length, 0);
    });

    it('signup without prior click still works', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const record = service.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      assert.ok(record);
      assert.equal(record.parentUserId, 'user-A');
      assert.equal(code.totalSignups, 1);
    });

    it('multiple click tracking increments correctly', () => {
      const code = service.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      for (let i = 0; i < 1000; i++) {
        service.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      }
      assert.equal(code.totalClicks, 1000);
    });
  });
});
