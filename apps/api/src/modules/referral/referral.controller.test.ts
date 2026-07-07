import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// referral.controller.test.ts · Phase-17 T8
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Referral Controller 单元测试

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';

describe('ReferralController', () => {
  let controller: ReferralController;
  let service: ReferralService;

  beforeEach(() => {
    service = new ReferralService();
    service.reset();
    controller = new ReferralController(service);
  });

  // ── POST /referral/code ──

  describe('POST /referral/code', () => {
    it('should generate a referral code and return 200', () => {
      const result = controller.generateCode({
        parentUserId: 'user-A',
        tenantId: 'tenant-A',
      });
      assert.ok(result.shortCode);
      assert.equal(result.shortCode.length, 8);
      assert.equal(result.parentUserId, 'user-A');
      assert.equal(result.tenantId, 'tenant-A');
      assert.ok(result.codeId.startsWith('code-'));
      assert.ok(result.landingUrl.includes('/r/'));
    });

    it('should use custom baseUrl', () => {
      const result = controller.generateCode({
        parentUserId: 'user-A',
        tenantId: 'tenant-A',
        baseUrl: 'https://custom.com',
      });
      assert.ok(result.landingUrl.startsWith('https://custom.com'));
    });

    it('should generate unique codes on repeated calls', () => {
      const r1 = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const r2 = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      assert.notEqual(r1.shortCode, r2.shortCode);
    });
  });

  // ── GET /referral/code/:shortCode ──

  describe('GET /referral/code/:shortCode', () => {
    it('should return code for existing shortCode', () => {
      const created = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const result = controller.getCode(created.shortCode);
      assert.equal(result.found, true);
      if (!('code' in result)) throw new Error('Expected result.code');
      assert.equal(result.code.shortCode, created.shortCode);
    });

    it('should return not-found for non-existent shortCode', () => {
      const result = controller.getCode('NONEXIST');
      assert.equal(result.found, false);
      if (!('message' in result)) throw new Error('Expected result.message');
      assert.ok(result.message.includes('not found'));
    });
  });

  // ── POST /referral/click ──

  describe('POST /referral/click', () => {
    it('should track click and return success', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const result = controller.trackClick({
        shortCode: code.shortCode,
        source: 'wechat',
      });
      assert.equal(result.success, true);
      assert.equal(result.totalClicks, 1);
    });

    it('should return failure for non-existent code', () => {
      const result = controller.trackClick({
        shortCode: 'NONEXIST',
        source: 'wechat',
      });
      assert.equal(result.success, false);
    });

    it('should track childUserId when provided', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const result = controller.trackClick({
        shortCode: code.shortCode,
        childUserId: 'user-B',
        source: 'link',
      });
      assert.equal(result.success, true);
    });
  });

  // ── POST /referral/signup ──

  describe('POST /referral/signup', () => {
    it('should create referral record', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const result = controller.trackSignup({
        shortCode: code.shortCode,
        childUserId: 'user-B',
      });
      assert.ok(result.recordId.startsWith('rec-'));
      assert.equal(result.parentUserId, 'user-A');
      assert.equal(result.childUserId, 'user-B');
      assert.equal(result.level, 1);
      assert.equal(result.tracked, true);
    });

    it('should throw on non-existent shortCode', () => {
      assert.throws(
        () => controller.trackSignup({ shortCode: 'NONEXIST', childUserId: 'user-X' }),
        (err: any) => err.message.includes('not found'),
      );
    });
  });

  // ── POST /referral/rewards/:recordId ──

  describe('POST /referral/rewards/:recordId', () => {
    it('should issue L1 reward for single-level chain', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const signup = controller.trackSignup({
        shortCode: code.shortCode,
        childUserId: 'user-B',
      });
      const result = controller.issueRewards(signup.recordId);
      assert.equal(result.rewards.length, 1);
      assert.equal(result.rewards[0].recipientUserId, 'user-A');
      assert.equal(result.rewards[0].level, 1);
    });

    it('should throw on non-existent record', () => {
      assert.throws(
        () => controller.issueRewards('non-existent'),
        (err: any) => err.message.includes('not found'),
      );
    });
  });

  // ── GET /referral/metrics ──

  describe('GET /referral/metrics', () => {
    it('should return zeros when no data', () => {
      const metrics = controller.getMetrics();
      assert.equal(metrics.totalCodes, 0);
      assert.equal(metrics.totalClicks, 0);
    });

    it('should return metrics after activity', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });

      const metrics = controller.getMetrics('t');
      assert.equal(metrics.totalCodes, 1);
      assert.equal(metrics.totalClicks, 1);
      assert.equal(metrics.totalSignups, 1);
    });

    it('should filter metrics by tenant', () => {
      controller.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      controller.generateCode({ parentUserId: 'user-B', tenantId: 't2' });

      assert.equal(controller.getMetrics('t1').totalCodes, 1);
      assert.equal(controller.getMetrics('t2').totalCodes, 1);
    });
  });

  // ── GET /referral/records ──

  describe('GET /referral/records', () => {
    it('should return empty list when no records', () => {
      const result = controller.listRecords('t');
      assert.deepEqual(result.records, []);
    });

    it('should return tenant-scoped records', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });

      const records = controller.listRecords('t1');
      assert.equal(records.records.length, 1);
      assert.equal(records.records[0].parentUserId, 'user-A');
    });
  });

  // ── GET /referral/rewards ──

  describe('GET /referral/rewards', () => {
    it('should return tenant-scoped rewards', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const signup = controller.trackSignup({
        shortCode: code.shortCode,
        childUserId: 'user-B',
      });
      controller.issueRewards(signup.recordId);

      const rewards = controller.listRewards('t1');
      assert.equal(rewards.rewards.length, 1);
      assert.equal(rewards.rewards[0].recipientUserId, 'user-A');
    });

    it('should return empty for tenant with no data', () => {
      const result = controller.listRewards('nonexistent');
      assert.deepEqual(result.rewards, []);
    });
  });
});
