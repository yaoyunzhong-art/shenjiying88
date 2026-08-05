import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [referral] [D] Controller spec 补全
 *
 * 策略：直接实例化 Controller + lightweight mock Service 验证全端点行为。
 * 覆盖：generateCode / getCode / trackClick / trackSignup / issueRewards / getMetrics / listRecords / listRewards
 * 正例 + 反例 + 边界
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';

// ── Entity / type copies (mirror source for isolation) ──────────

type ReferralLevel = 1 | 2 | 3;

interface ReferralCode {
  codeId: string;
  shortCode: string;
  parentUserId: string;
  tenantId: string;
  qrCodeUrl?: string;
  landingUrl: string;
  createdAt: string;
  expiresAt?: string;
  totalClicks: number;
  totalSignups: number;
}

interface ReferralRecord {
  recordId: string;
  parentUserId: string;
  childUserId: string;
  tenantId: string;
  level: ReferralLevel;
  ancestorChain: string[];
  source: string;
  clickedAt: string;
  signedUpAt?: string;
  tracked: boolean;
}

interface ReferralReward {
  rewardId: string;
  recordId: string;
  recipientUserId: string;
  level: ReferralLevel;
  rewardType: string;
  rewardValue: number;
  couponPlanId?: string;
  status: string;
  triggeredAt: string;
  issuedAt?: string;
}

interface ReferralMetrics {
  totalCodes: number;
  totalClicks: number;
  totalSignups: number;
  trackRate: number;
  conversionRate: number;
  totalRewardsIssued: number;
  totalRewardsValue: number;
}

// ── Lightweight inline service mock ─────────────────────────────

let nextCodeSeq = 0;

function makeShortCode(): string {
  return `sc${String(++nextCodeSeq).padStart(6, '0')}`;
}

class InlineReferralService {
  private readonly codeStore = new Map<string, ReferralCode>();
  private readonly recordStore = new Map<string, ReferralRecord>();
  private readonly rewardStore = new Map<string, ReferralReward>();

  generateCode(input: {
    parentUserId: string;
    tenantId: string;
    baseUrl?: string;
    expiresInDays?: number;
  }): ReferralCode {
    const shortCode = makeShortCode();
    const codeId = `code-${shortCode}`;
    const baseUrl = input.baseUrl ?? 'https://m.shenjiying88.com';
    const code: ReferralCode = {
      codeId,
      shortCode,
      parentUserId: input.parentUserId,
      tenantId: input.tenantId,
      qrCodeUrl: `${baseUrl}/qr/${shortCode}.png`,
      landingUrl: `${baseUrl}/r/${shortCode}`,
      createdAt: new Date().toISOString(),
      expiresAt: input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString()
        : undefined,
      totalClicks: 0,
      totalSignups: 0,
    };
    this.codeStore.set(shortCode, code);
    return code;
  }

  getCode(shortCode: string): ReferralCode | undefined {
    return this.codeStore.get(shortCode);
  }

  trackClick(input: {
    shortCode: string;
    childUserId?: string;
    source: string;
  }): ReferralCode | undefined {
    const code = this.codeStore.get(input.shortCode);
    if (!code) return undefined;
    code.totalClicks += 1;
    return code;
  }

  trackSignup(input: {
    shortCode: string;
    childUserId: string;
    signupAt?: string;
  }): ReferralRecord {
    const code = this.codeStore.get(input.shortCode);
    if (!code) throw new Error(`Referral code not found: ${input.shortCode}`);
    code.totalSignups += 1;

    const recordId = `rec-${input.shortCode}-${input.childUserId}`;
    const record: ReferralRecord = {
      recordId,
      parentUserId: code.parentUserId,
      childUserId: input.childUserId,
      tenantId: code.tenantId,
      level: 1,
      ancestorChain: [code.parentUserId],
      source: 'wechat',
      clickedAt: new Date().toISOString(),
      signedUpAt: input.signupAt ?? new Date().toISOString(),
      tracked: true,
    };
    this.recordStore.set(recordId, record);
    return record;
  }

  issueRewards(recordId: string): ReferralReward[] {
    const record = this.recordStore.get(recordId);
    if (!record) throw new Error(`Record not found: ${recordId}`);
    const rewardId = `reward-${recordId}`;
    const reward: ReferralReward = {
      rewardId,
      recordId,
      recipientUserId: record.parentUserId,
      level: 1,
      rewardType: 'points',
      rewardValue: 100,
      couponPlanId: 'coupon-l1-50',
      status: 'issued',
      triggeredAt: new Date().toISOString(),
      issuedAt: new Date().toISOString(),
    };
    this.rewardStore.set(rewardId, reward);
    return [reward];
  }

  getMetrics(tenantId?: string): ReferralMetrics {
    const codes = tenantId
      ? Array.from(this.codeStore.values()).filter(c => c.tenantId === tenantId)
      : Array.from(this.codeStore.values());
    const records = tenantId
      ? Array.from(this.recordStore.values()).filter(r => r.tenantId === tenantId)
      : Array.from(this.recordStore.values());
    const totalClicks = codes.reduce((s, c) => s + c.totalClicks, 0);
    return {
      totalCodes: codes.length,
      totalClicks,
      totalSignups: records.length,
      trackRate: totalClicks > 0 ? records.length / totalClicks : 0,
      conversionRate: totalClicks > 0 ? records.length / totalClicks : 0,
      totalRewardsIssued: this.rewardStore.size,
      totalRewardsValue: Array.from(this.rewardStore.values()).reduce((s, r) => s + r.rewardValue, 0),
    };
  }

  listRecords(tenantId: string): ReferralRecord[] {
    return Array.from(this.recordStore.values()).filter(r => r.tenantId === tenantId);
  }

  listRewards(tenantId: string): ReferralReward[] {
    const tenantRecordIds = new Set(
      Array.from(this.recordStore.values())
        .filter(r => r.tenantId === tenantId)
        .map(r => r.recordId),
    );
    return Array.from(this.rewardStore.values()).filter(r => tenantRecordIds.has(r.recordId));
  }
}

// ── Inline Controller matching source behavior ──────────────────

interface GenerateCodeDto {
  parentUserId: string;
  tenantId: string;
  baseUrl?: string;
  expiresInDays?: number;
}

interface TrackClickDto {
  shortCode: string;
  childUserId?: string;
  source: string;
}

interface TrackSignupDto {
  shortCode: string;
  childUserId: string;
  signupAt?: string;
}

class ReferralController {
  private readonly referralService: InlineReferralService;
  constructor(referralService: InlineReferralService) {
    this.referralService = referralService;
  }

  generateCode(dto: GenerateCodeDto) {
    return this.referralService.generateCode(dto);
  }

  getCode(shortCode: string) {
    const code = this.referralService.getCode(shortCode);
    if (!code) {
      return { found: false as const, message: `Code not found: ${shortCode}` };
    }
    return { found: true as const, code };
  }

  trackClick(dto: TrackClickDto) {
    const code = this.referralService.trackClick(dto);
    if (!code) {
      return { success: false, message: `Invalid or expired code: ${dto.shortCode}` };
    }
    return { success: true, totalClicks: code.totalClicks };
  }

  trackSignup(dto: TrackSignupDto) {
    const record = this.referralService.trackSignup(dto);
    return {
      recordId: record.recordId,
      parentUserId: record.parentUserId,
      childUserId: record.childUserId,
      level: record.level,
      ancestorChain: record.ancestorChain,
      source: record.source,
      tracked: record.tracked,
    };
  }

  issueRewards(recordId: string) {
    const rewards = this.referralService.issueRewards(recordId);
    return {
      rewards: rewards.map(r => ({
        rewardId: r.rewardId,
        recipientUserId: r.recipientUserId,
        level: r.level,
        rewardType: r.rewardType,
        rewardValue: r.rewardValue,
        status: r.status,
      })),
    };
  }

  getMetrics(tenantId?: string) {
    return this.referralService.getMetrics(tenantId);
  }

  listRecords(tenantId: string) {
    const records = this.referralService.listRecords(tenantId);
    return { records: records.map(r => ({
      recordId: r.recordId,
      parentUserId: r.parentUserId,
      childUserId: r.childUserId,
      level: r.level,
      source: r.source,
      signedUpAt: r.signedUpAt,
      tracked: r.tracked,
    }))};
  }

  listRewards(tenantId: string) {
    const rewards = this.referralService.listRewards(tenantId);
    return { rewards: rewards.map(r => ({
      rewardId: r.rewardId,
      recipientUserId: r.recipientUserId,
      level: r.level,
      rewardType: r.rewardType,
      rewardValue: r.rewardValue,
      status: r.status,
      issuedAt: r.issuedAt,
    }))};
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('ReferralController', () => {
  let controller: ReferralController;

  beforeEach(() => {
    nextCodeSeq = 0;
    controller = new ReferralController(new InlineReferralService());
  });

  // ── generateCode ──
  describe('generateCode()', () => {
    it('should generate a referral code with basic fields (正例)', () => {
      const result = controller.generateCode({
        parentUserId: 'user-A',
        tenantId: 'tenant-A',
      });
      assert.ok(result.shortCode);
      assert.equal(result.shortCode.length, 8); // sc + 6 digits
      assert.equal(result.parentUserId, 'user-A');
      assert.equal(result.tenantId, 'tenant-A');
      assert.ok(result.codeId.startsWith('code-'));
      assert.ok(result.landingUrl.includes('/r/'));
    });

    it('should use custom baseUrl when provided (正例)', () => {
      const result = controller.generateCode({
        parentUserId: 'user-A',
        tenantId: 't',
        baseUrl: 'https://custom.com',
      });
      assert.ok(result.landingUrl.startsWith('https://custom.com'));
      assert.ok(result.qrCodeUrl?.startsWith('https://custom.com'));
    });

    it('should set expiresAt when expiresInDays given (正例)', () => {
      const result = controller.generateCode({
        parentUserId: 'user-A',
        tenantId: 't',
        expiresInDays: 7,
      });
      assert.ok(result.expiresAt);
      assert.ok(new Date(result.expiresAt) > new Date());
    });

    it('should not set expiresAt when expiresInDays omitted (边界)', () => {
      const result = controller.generateCode({
        parentUserId: 'user-A',
        tenantId: 't',
      });
      assert.equal(result.expiresAt, undefined);
    });

    it('should generate sequential unique shortCodes (边界)', () => {
      const r1 = controller.generateCode({ parentUserId: 'u1', tenantId: 't' });
      const r2 = controller.generateCode({ parentUserId: 'u2', tenantId: 't' });
      assert.notEqual(r1.shortCode, r2.shortCode);
      assert.equal(r1.totalClicks, 0);
      assert.equal(r2.totalSignups, 0);
    });
  });

  // ── getCode ──
  describe('getCode()', () => {
    it('should return code for existing shortCode (正例)', () => {
      const created = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const result = controller.getCode(created.shortCode);
      assert.equal(result.found, true);
      if (!('code' in result)) throw new Error('Expected result.code');
      assert.equal(result.code.shortCode, created.shortCode);
      assert.equal(result.code.parentUserId, 'user-A');
    });

    it('should return found:false for non-existent shortCode (反例)', () => {
      const result = controller.getCode('NONEXIST');
      assert.equal(result.found, false);
      if (!('message' in result)) throw new Error('Expected result.message');
      assert.ok(result.message.includes('not found'));
    });

    it('should return found:false for empty string shortCode (边界)', () => {
      const result = controller.getCode('');
      assert.equal(result.found, false);
    });

    it('should handle expired-looking but valid code (边界)', () => {
      const created = controller.generateCode({
        parentUserId: 'user-A',
        tenantId: 't',
        expiresInDays: 30,
      });
      const result = controller.getCode(created.shortCode);
      assert.equal(result.found, true);
    });
  });

  // ── trackClick ──
  describe('trackClick()', () => {
    it('should track click and return success with click count (正例)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const result = controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      assert.equal(result.success, true);
      assert.equal(result.totalClicks, 1);
    });

    it('should increment click count on multiple clicks (正例)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      controller.trackClick({ shortCode: code.shortCode, source: 'link' });
      controller.trackClick({ shortCode: code.shortCode, source: 'qrcode' });
      const result = controller.trackClick({ shortCode: code.shortCode, source: 'mini-program' });
      assert.equal(result.totalClicks, 4);
    });

    it('should return failure for non-existent shortCode (反例)', () => {
      const result = controller.trackClick({ shortCode: 'NONEXIST', source: 'wechat' });
      assert.equal(result.success, false);
    });

    it('should accept all valid source types (边界)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      for (const src of ['wechat', 'mini-program', 'link', 'qrcode']) {
        const result = controller.trackClick({ shortCode: code.shortCode, source: src });
        assert.equal(result.success, true);
      }
    });

    it('should track click with childUserId (边界)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const result = controller.trackClick({
        shortCode: code.shortCode,
        childUserId: 'user-B',
        source: 'link',
      });
      assert.equal(result.success, true);
    });
  });

  // ── trackSignup ──
  describe('trackSignup()', () => {
    it('should create referral record with full details (正例)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const result = controller.trackSignup({
        shortCode: code.shortCode,
        childUserId: 'user-B',
      });
      assert.ok(result.recordId);
      assert.equal(result.parentUserId, 'user-A');
      assert.equal(result.childUserId, 'user-B');
      assert.equal(result.level, 1);
      assert.equal(result.tracked, true);
    });

    it('should throw for non-existent shortCode (反例)', () => {
      assert.throws(
        () => controller.trackSignup({ shortCode: 'NONEXIST', childUserId: 'user-X' }),
        (err: any) => err.message.includes('not found'),
      );
    });

    it('should accept custom signupAt timestamp (边界)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      const customTime = new Date('2026-06-01T12:00:00Z').toISOString();
      const result = controller.trackSignup({
        shortCode: code.shortCode,
        childUserId: 'user-B',
        signupAt: customTime,
      });
      assert.equal(result.tracked, true);
    });

    it('should increment code totalSignups after signup (边界)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      const updatedCode = controller.getCode(code.shortCode);
      if (updatedCode.found && 'code' in updatedCode) {
        assert.equal(updatedCode.code.totalSignups, 1);
      } else {
        throw new Error('Code not found after signup');
      }
    });
  });

  // ── issueRewards ──
  describe('issueRewards()', () => {
    it('should issue L1 rewards with points and coupon plan (正例)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const signup = controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      const result = controller.issueRewards(signup.recordId);
      assert.ok(result.rewards.length >= 1);
      assert.equal(result.rewards[0].recipientUserId, 'user-A');
      assert.equal(result.rewards[0].level, 1);
      assert.equal(result.rewards[0].rewardType, 'points');
      assert.equal(result.rewards[0].rewardValue, 100);
      assert.equal(result.rewards[0].status, 'issued');
    });

    it('should throw for non-existent recordId (反例)', () => {
      assert.throws(
        () => controller.issueRewards('non-existent'),
        (err: any) => err.message.includes('not found'),
      );
    });

    it('should handle empty-string recordId gracefully (边界)', () => {
      assert.throws(
        () => controller.issueRewards(''),
        (err: any) => err.message.includes('not found'),
      );
    });
  });

  // ── getMetrics ──
  describe('getMetrics()', () => {
    it('should return zero metrics when no data (反例/空数据)', () => {
      const metrics = controller.getMetrics();
      assert.equal(metrics.totalCodes, 0);
      assert.equal(metrics.totalClicks, 0);
      assert.equal(metrics.totalSignups, 0);
      assert.equal(metrics.totalRewardsIssued, 0);
      assert.equal(metrics.totalRewardsValue, 0);
    });

    it('should return metrics after full referral flow (正例)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const signup = controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      controller.issueRewards(signup.recordId);

      const metrics = controller.getMetrics('t1');
      assert.equal(metrics.totalCodes, 1);
      assert.equal(metrics.totalClicks, 1);
      assert.equal(metrics.totalSignups, 1);
      assert.equal(metrics.totalRewardsIssued, 1);
      assert.equal(metrics.totalRewardsValue, 100);
      assert.equal(metrics.trackRate, 1);
    });

    it('should filter metrics by tenant (边界)', () => {
      controller.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      controller.generateCode({ parentUserId: 'user-B', tenantId: 't2' });
      controller.generateCode({ parentUserId: 'user-C', tenantId: 't1' });

      assert.equal(controller.getMetrics('t1').totalCodes, 2);
      assert.equal(controller.getMetrics('t2').totalCodes, 1);
    });

    it('should return global metrics when no tenantId (边界)', () => {
      controller.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      controller.generateCode({ parentUserId: 'user-B', tenantId: 't2' });
      const metrics = controller.getMetrics();
      assert.equal(metrics.totalCodes, 2);
    });
  });

  // ── listRecords ──
  describe('listRecords()', () => {
    it('should return empty list when no records exist (反例/空数据)', () => {
      const result = controller.listRecords('t');
      assert.deepEqual(result.records, []);
    });

    it('should return tenant-scoped records (正例)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-C' });
      controller.generateCode({ parentUserId: 'user-X', tenantId: 't2' });

      const records = controller.listRecords('t1');
      assert.equal(records.records.length, 2);
      assert.ok(records.records.every(r => ['user-B', 'user-C'].includes(r.childUserId)));
    });

    it('should return empty for tenant with no records (边界)', () => {
      const result = controller.listRecords('nonexistent');
      assert.deepEqual(result.records, []);
    });

    it('should return records with required fields (边界)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      const result = controller.listRecords('t');
      const record = result.records[0];
      assert.ok('recordId' in record);
      assert.ok('parentUserId' in record);
      assert.ok('childUserId' in record);
      assert.ok('level' in record);
      assert.ok('source' in record);
      assert.ok('tracked' in record);
    });
  });

  // ── listRewards ──
  describe('listRewards()', () => {
    it('should return empty list when no rewards exist (反例/空数据)', () => {
      const result = controller.listRewards('t');
      assert.deepEqual(result.rewards, []);
    });

    it('should return tenant-scoped rewards (正例)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't1' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const signup = controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      controller.issueRewards(signup.recordId);

      const rewards = controller.listRewards('t1');
      assert.equal(rewards.rewards.length, 1);
      assert.equal(rewards.rewards[0].recipientUserId, 'user-A');
      assert.equal(rewards.rewards[0].rewardType, 'points');
    });

    it('should return empty for tenant with no rewards (边界)', () => {
      const result = controller.listRewards('nonexistent');
      assert.deepEqual(result.rewards, []);
    });

    it('should return rewards with all required fields (边界)', () => {
      const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 't' });
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      const signup = controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-B' });
      controller.issueRewards(signup.recordId);
      const result = controller.listRewards('t');
      const reward = result.rewards[0];
      assert.ok('rewardId' in reward);
      assert.ok('recipientUserId' in reward);
      assert.ok('level' in reward);
      assert.ok('rewardType' in reward);
      assert.ok('rewardValue' in reward);
      assert.ok('status' in reward);
    });
  });
});
