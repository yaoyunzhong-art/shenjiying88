import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// referral.dto.test.ts · Phase-17 T8
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Referral DTO 测试

import 'reflect-metadata';
import assert from 'node:assert/strict';
import {
  GenerateCodeDto,
  GenerateCodeResponseDto,
  TrackClickDto,
  TrackSignupDto,
  TrackSignupResponseDto,
  IssueRewardsResponseDto,
  ReferralMetricsResponseDto,
  ReferralRecordResponseDto,
  ReferralRewardsResponseDto,
} from './referral.dto';

describe('GenerateCodeDto', () => {
  it('constructs with required fields', () => {
    const dto = new GenerateCodeDto();
    dto.parentUserId = 'user-A';
    dto.tenantId = 'tenant-A';
    assert.equal(dto.parentUserId, 'user-A');
    assert.equal(dto.tenantId, 'tenant-A');
  });

  it('optional fields default to undefined', () => {
    const dto = new GenerateCodeDto();
    dto.parentUserId = 'user-A';
    dto.tenantId = 'tenant-A';
    assert.equal(dto.baseUrl, undefined);
    assert.equal(dto.expiresInDays, undefined);
  });

  it('accepts optional baseUrl and expiresInDays', () => {
    const dto = new GenerateCodeDto();
    dto.parentUserId = 'user-A';
    dto.tenantId = 'tenant-A';
    dto.baseUrl = 'https://custom.example.com';
    dto.expiresInDays = 30;
    assert.equal(dto.baseUrl, 'https://custom.example.com');
    assert.equal(dto.expiresInDays, 30);
  });
});

describe('GenerateCodeResponseDto', () => {
  it('constructs with all fields', () => {
    const dto = new GenerateCodeResponseDto();
    dto.codeId = 'code-abc123';
    dto.shortCode = 'ABCD1234';
    dto.parentUserId = 'user-A';
    dto.tenantId = 'tenant-A';
    dto.qrCodeUrl = 'https://m.example.com/qr/ABCD1234.png';
    dto.landingUrl = 'https://m.example.com/r/ABCD1234';
    dto.createdAt = '2026-06-26T00:00:00.000Z';
    dto.expiresAt = '2026-07-26T00:00:00.000Z';

    assert.equal(dto.codeId, 'code-abc123');
    assert.equal(dto.shortCode, 'ABCD1234');
    assert.equal(dto.landingUrl, 'https://m.example.com/r/ABCD1234');
    assert.ok(dto.qrCodeUrl!.includes('.png'));
  });

  it('expiresAt may be undefined', () => {
    const dto = new GenerateCodeResponseDto();
    dto.codeId = 'code-xyz';
    dto.shortCode = 'XYZ67890';
    dto.parentUserId = 'user-B';
    dto.tenantId = 'tenant-B';
    dto.landingUrl = '/r/XYZ67890';
    dto.createdAt = new Date().toISOString();
    assert.equal(dto.expiresAt, undefined);
  });
});

describe('TrackClickDto', () => {
  it('constructs valid click dto', () => {
    const dto = new TrackClickDto();
    dto.shortCode = 'ABCD1234';
    dto.source = 'wechat';
    assert.equal(dto.shortCode, 'ABCD1234');
    assert.equal(dto.source, 'wechat');
  });

  it('childUserId optional', () => {
    const dto = new TrackClickDto();
    dto.shortCode = 'ABCD1234';
    dto.source = 'qrcode';
    assert.equal(dto.childUserId, undefined);
  });

  it('accepts all source types', () => {
    const sources = ['wechat', 'mini-program', 'link', 'qrcode'] as const;
    for (const src of sources) {
      const dto = new TrackClickDto();
      dto.shortCode = 'CODE';
      dto.source = src;
      assert.equal(dto.source, src);
    }
  });
});

describe('TrackSignupDto', () => {
  it('constructs with required fields', () => {
    const dto = new TrackSignupDto();
    dto.shortCode = 'ABCD1234';
    dto.childUserId = 'child-001';
    assert.equal(dto.shortCode, 'ABCD1234');
    assert.equal(dto.childUserId, 'child-001');
  });

  it('signupAt optional', () => {
    const dto = new TrackSignupDto();
    dto.shortCode = 'ABCD1234';
    dto.childUserId = 'child-001';
    assert.equal(dto.signupAt, undefined);
  });
});

describe('TrackSignupResponseDto', () => {
  it('constructs full response', () => {
    const dto = new TrackSignupResponseDto();
    dto.recordId = 'rec-abc';
    dto.parentUserId = 'user-A';
    dto.childUserId = 'child-001';
    dto.level = 1;
    dto.ancestorChain = ['user-A'];
    dto.source = 'wechat';
    dto.tracked = true;

    assert.equal(dto.level, 1);
    assert.deepStrictEqual(dto.ancestorChain, ['user-A']);
    assert.equal(dto.tracked, true);
  });
});

describe('IssueRewardsResponseDto', () => {
  it('constructs with rewards array', () => {
    const dto = new IssueRewardsResponseDto();
    dto.rewards = [
      { rewardId: 'r1', recipientUserId: 'u1', level: 1, rewardType: 'points', rewardValue: 100, status: 'issued' },
      { rewardId: 'r2', recipientUserId: 'u2', level: 2, rewardType: 'points', rewardValue: 50, status: 'issued' },
    ];

    assert.equal(dto.rewards.length, 2);
    assert.equal(dto.rewards[0].rewardValue, 100);
    assert.equal(dto.rewards[1].level, 2);
  });

  it('handles empty rewards', () => {
    const dto = new IssueRewardsResponseDto();
    dto.rewards = [];
    assert.equal(dto.rewards.length, 0);
  });
});

describe('ReferralMetricsResponseDto', () => {
  it('constructs with all metrics fields', () => {
    const dto = new ReferralMetricsResponseDto();
    dto.totalCodes = 10;
    dto.totalClicks = 200;
    dto.totalSignups = 180;
    dto.trackRate = 0.9;
    dto.conversionRate = 0.9;
    dto.totalRewardsIssued = 150;
    dto.totalRewardsValue = 7500;

    assert.equal(dto.totalCodes, 10);
    assert.equal(dto.trackRate, 0.9);
    assert.equal(dto.totalRewardsValue, 7500);
  });

  it('handles zero metrics', () => {
    const dto = new ReferralMetricsResponseDto();
    dto.totalCodes = 0;
    dto.totalClicks = 0;
    dto.totalSignups = 0;
    dto.trackRate = 0;
    dto.conversionRate = 0;
    dto.totalRewardsIssued = 0;
    dto.totalRewardsValue = 0;

    assert.equal(dto.totalCodes, 0);
    assert.equal(dto.trackRate, 0);
  });
});

describe('ReferralRecordResponseDto', () => {
  it('constructs with records array', () => {
    const dto = new ReferralRecordResponseDto();
    dto.records = [
      { recordId: 'r1', parentUserId: 'u1', childUserId: 'c1', level: 1, source: 'wechat', signedUpAt: '2026-06-26T00:00:00.000Z', tracked: true },
    ];
    assert.equal(dto.records.length, 1);
    assert.equal(dto.records[0].tracked, true);
  });
});

describe('ReferralRewardsResponseDto', () => {
  it('constructs with rewards array', () => {
    const dto = new ReferralRewardsResponseDto();
    dto.rewards = [
      { rewardId: 'rw1', recipientUserId: 'u1', level: 1, rewardType: 'points', rewardValue: 100, status: 'issued', issuedAt: '2026-06-26T00:00:00.000Z' },
    ];
    assert.equal(dto.rewards.length, 1);
    assert.equal(dto.rewards[0].rewardValue, 100);
  });
});
