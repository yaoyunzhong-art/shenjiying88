import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// referral.entity.test.ts · Phase-17 T8
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Referral Entity 测试

import 'reflect-metadata';
import assert from 'node:assert/strict';
import type {
  ReferralCode,
  ReferralRecord,
  ReferralReward,
  ReferralMetrics,
  GenerateCodeInput,
  TrackClickInput,
  TrackSignupInput,
  ReferralLevel,
} from './referral.entity';

describe('ReferralLevel', () => {
  it('level 1 is a valid ReferralLevel', () => {
    const level: ReferralLevel = 1;
    assert.equal(level, 1);
  });

  it('level 2 is a valid ReferralLevel', () => {
    const level: ReferralLevel = 2;
    assert.equal(level, 2);
  });

  it('level 3 is a valid ReferralLevel', () => {
    const level: ReferralLevel = 3;
    assert.equal(level, 3);
  });
});

describe('ReferralCode interface', () => {
  it('satisfies interface contract', () => {
    const code: ReferralCode = {
      codeId: 'code-abc',
      shortCode: 'ABCD1234',
      parentUserId: 'user-A',
      tenantId: 'tenant-A',
      qrCodeUrl: 'https://example.com/qr/ABCD1234.png',
      landingUrl: 'https://example.com/r/ABCD1234',
      createdAt: '2026-06-26T00:00:00.000Z',
      expiresAt: '2026-07-26T00:00:00.000Z',
      totalClicks: 0,
      totalSignups: 0,
    };

    assert.equal(code.shortCode.length, 8);
    assert.equal(code.totalClicks, 0);
    assert.equal(code.totalSignups, 0);
  });

  it('qrCodeUrl and expiresAt are optional', () => {
    const code: ReferralCode = {
      codeId: 'code-xyz',
      shortCode: 'XYZ67890',
      parentUserId: 'user-B',
      tenantId: 'tenant-B',
      landingUrl: 'https://example.com/r/XYZ67890',
      createdAt: new Date().toISOString(),
      totalClicks: 5,
      totalSignups: 2,
    };

    assert.equal(code.qrCodeUrl, undefined);
    assert.equal(code.expiresAt, undefined);
    assert.equal(code.totalClicks, 5);
  });

  it('shortCode is always 8 characters', () => {
    const codes: ReferralCode[] = [
      { codeId: '1', shortCode: 'AAAA1111', parentUserId: 'u1', tenantId: 't1', landingUrl: '/r/AAAA1111', createdAt: '', totalClicks: 0, totalSignups: 0 },
      { codeId: '2', shortCode: 'BBBB2222', parentUserId: 'u2', tenantId: 't2', landingUrl: '/r/BBBB2222', createdAt: '', totalClicks: 0, totalSignups: 0 },
    ];
    for (const c of codes) {
      assert.equal(c.shortCode.length, 8);
    }
  });
});

describe('ReferralRecord interface', () => {
  it('satisfies interface contract', () => {
    const record: ReferralRecord = {
      recordId: 'rec-001',
      parentUserId: 'user-A',
      childUserId: 'user-B',
      tenantId: 'tenant-A',
      level: 1,
      ancestorChain: ['user-A'],
      source: 'wechat',
      clickedAt: '2026-06-26T00:00:00.000Z',
      signedUpAt: '2026-06-26T01:00:00.000Z',
      firstOrderAt: '2026-06-27T00:00:00.000Z',
      tracked: true,
    };

    assert.equal(record.level, 1);
    assert.equal(record.tracked, true);
    assert.deepStrictEqual(record.ancestorChain, ['user-A']);
  });

  it('firstOrderAt is optional', () => {
    const record: ReferralRecord = {
      recordId: 'rec-002',
      parentUserId: 'user-A',
      childUserId: 'user-B',
      tenantId: 'tenant-A',
      level: 2,
      ancestorChain: ['user-B', 'user-A'],
      source: 'link',
      clickedAt: '2026-06-26T00:00:00.000Z',
      tracked: true,
    };

    assert.equal(record.firstOrderAt, undefined);
    assert.equal(record.signedUpAt, undefined);
  });

  it('level 3 ancestorChain has 3 elements', () => {
    const record: ReferralRecord = {
      recordId: 'rec-003',
      parentUserId: 'user-C',
      childUserId: 'user-D',
      tenantId: 'tenant-A',
      level: 1,
      ancestorChain: ['user-C', 'user-B', 'user-A'],
      source: 'mini-program',
      clickedAt: '',
      tracked: true,
    };

    assert.equal(record.ancestorChain.length, 3);
  });
});

describe('ReferralReward interface', () => {
  it('satisfies interface contract', () => {
    const reward: ReferralReward = {
      rewardId: 'reward-001',
      recordId: 'rec-001',
      recipientUserId: 'user-A',
      level: 1,
      rewardType: 'points',
      rewardValue: 100,
      status: 'issued',
      triggeredAt: '2026-06-26T00:00:00.000Z',
      issuedAt: '2026-06-26T00:00:00.000Z',
    };

    assert.equal(reward.rewardValue, 100);
    assert.equal(reward.status, 'issued');
  });

  it('supports coupon reward type', () => {
    const reward: ReferralReward = {
      rewardId: 'reward-002',
      recordId: 'rec-001',
      recipientUserId: 'user-A',
      level: 1,
      rewardType: 'coupon',
      rewardValue: 50,
      couponPlanId: 'coupon-l1-50',
      status: 'pending',
      triggeredAt: '',
    };

    assert.equal(reward.rewardType, 'coupon');
    assert.equal(reward.couponPlanId, 'coupon-l1-50');
    assert.equal(reward.status, 'pending');
  });

  it('supports all reward statuses', () => {
    const statuses: Array<ReferralReward['status']> = ['pending', 'issued', 'claimed', 'expired'];
    for (const s of statuses) {
      const reward: ReferralReward = { rewardId: 'r', recordId: 'rec', recipientUserId: 'u', level: 1, rewardType: 'points', rewardValue: 0, status: s, triggeredAt: '' };
      assert.equal(reward.status, s);
    }
  });
});

describe('ReferralMetrics interface', () => {
  it('satisfies interface contract', () => {
    const metrics: ReferralMetrics = {
      totalCodes: 100,
      totalClicks: 5000,
      totalSignups: 4800,
      trackRate: 0.96,
      conversionRate: 0.96,
      totalRewardsIssued: 4500,
      totalRewardsValue: 250000,
    };

    assert.equal(metrics.trackRate, 0.96);
    assert.equal(metrics.totalRewardsValue, 250000);
  });
});

describe('GenerateCodeInput interface', () => {
  it('satisfies interface contract', () => {
    const input: GenerateCodeInput = {
      parentUserId: 'user-A',
      tenantId: 'tenant-A',
      baseUrl: 'https://custom.example.com',
      expiresInDays: 30,
    };

    assert.equal(input.parentUserId, 'user-A');
    assert.equal(input.baseUrl, 'https://custom.example.com');
    assert.equal(input.expiresInDays, 30);
  });
});

describe('TrackClickInput interface', () => {
  it('satisfies interface contract', () => {
    const input: TrackClickInput = {
      shortCode: 'ABCD1234',
      childUserId: 'child-001',
      source: 'wechat',
    };

    assert.equal(input.shortCode, 'ABCD1234');
    assert.equal(input.source, 'wechat');
  });
});

describe('TrackSignupInput interface', () => {
  it('satisfies interface contract', () => {
    const input: TrackSignupInput = {
      shortCode: 'ABCD1234',
      childUserId: 'child-001',
      signupAt: '2026-06-26T01:00:00.000Z',
    };

    assert.equal(input.shortCode, 'ABCD1234');
    assert.equal(input.childUserId, 'child-001');
  });
});
