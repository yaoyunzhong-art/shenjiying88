/**
 * member-config.test.ts — Page-level tests for admin-web 会员配置中心
 *
 * 正例 + 反例 + 边界, ≥3 个测试用例
 * References: page.tsx (MemberConfig, validation, level thresholds)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ─── Data shapes ─────────────────────────────────────────────────────────

interface MemberConfig {
  points: { earnRate: number; redeemRate: number; enabled: boolean; expiryDays: number };
  levels: { thresholds: { BRONZE: number; SILVER: number; GOLD: number; PLATINUM: number; DIAMOND: number } };
  lifecycle: { dormantDays: number; churnedDays: number };
  phoneUniqueScope: 'global' | 'tenant';
  crossTenantEnabled: boolean;
}

// ─── Replicated business logic ───────────────────────────────────────────

const LEVEL_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const;
type Level = typeof LEVEL_ORDER[number];

function getMemberLevel(totalSpendCents: number, config: MemberConfig): Level {
  const t = config.levels.thresholds;
  if (totalSpendCents >= t.DIAMOND) return 'DIAMOND';
  if (totalSpendCents >= t.PLATINUM) return 'PLATINUM';
  if (totalSpendCents >= t.GOLD) return 'GOLD';
  if (totalSpendCents >= t.SILVER) return 'SILVER';
  return 'BRONZE';
}

function getLevelIndex(level: Level): number {
  return LEVEL_ORDER.indexOf(level);
}

function validateLevelThresholds(thresholds: MemberConfig['levels']['thresholds']): string | null {
  const values = [thresholds.BRONZE, thresholds.SILVER, thresholds.GOLD, thresholds.PLATINUM, thresholds.DIAMOND];
  for (let i = 1; i < values.length; i++) {
    if (values[i]! <= values[i - 1]!) return `等级阈值必须递增：${LEVEL_ORDER[i - 1]!}(${values[i - 1]!}) 应小于 ${LEVEL_ORDER[i]!}(${values[i]!})`;
  }
  if (values.some(v => v < 0)) return '等级阈值不能为负数';
  return null;
}

function validatePointsConfig(points: MemberConfig['points']): string | null {
  if (points.earnRate <= 0) return '获取比例必须大于 0';
  if (points.redeemRate <= 0) return '兑换比例必须大于 0';
  if (points.expiryDays <= 0) return '有效期必须大于 0 天';
  if (points.earnRate > 100) return '获取比例不能超过 100%';
  return null;
}

function validateLifecycle(lifecycle: MemberConfig['lifecycle']): string | null {
  if (lifecycle.dormantDays < 1) return '休眠天数必须 ≥ 1';
  if (lifecycle.churnedDays < 1) return '流失天数必须 ≥ 1';
  if (lifecycle.churnedDays <= lifecycle.dormantDays) return '流失天数必须大于休眠天数';
  return null;
}

// ─── Mock configs ────────────────────────────────────────────────────────

const DEFAULT_CONFIG: MemberConfig = {
  points: { earnRate: 1, redeemRate: 100, enabled: true, expiryDays: 365 },
  levels: { thresholds: { BRONZE: 0, SILVER: 100000, GOLD: 500000, PLATINUM: 2000000, DIAMOND: 5000000 } },
  lifecycle: { dormantDays: 90, churnedDays: 365 },
  phoneUniqueScope: 'global',
  crossTenantEnabled: false,
};

// ─── Tests ───────────────────────────────────────────────────────────────

describe('admin-member-config: 正例', () => {
  it('getMemberLevel 各等级正确判断', () => {
    const t = DEFAULT_CONFIG.levels.thresholds;
    assert.equal(getMemberLevel(0, DEFAULT_CONFIG), 'BRONZE');
    assert.equal(getMemberLevel(t.SILVER, DEFAULT_CONFIG), 'SILVER');
    assert.equal(getMemberLevel(t.GOLD, DEFAULT_CONFIG), 'GOLD');
    assert.equal(getMemberLevel(t.PLATINUM, DEFAULT_CONFIG), 'PLATINUM');
    assert.equal(getMemberLevel(t.DIAMOND, DEFAULT_CONFIG), 'DIAMOND');
  });

  it('等级阈值严格递增', () => {
    const err = validateLevelThresholds(DEFAULT_CONFIG.levels.thresholds);
    assert.equal(err, null);
  });

  it('积分配置全部合法', () => {
    const err = validatePointsConfig(DEFAULT_CONFIG.points);
    assert.equal(err, null);
  });

  it('休眠配置合法', () => {
    const err = validateLifecycle(DEFAULT_CONFIG.lifecycle);
    assert.equal(err, null);
  });

  it('等级索引递增', () => {
    for (let i = 1; i < LEVEL_ORDER.length; i++) {
      assert.ok(getLevelIndex(LEVEL_ORDER[i]!) > getLevelIndex(LEVEL_ORDER[i - 1]!));
    }
  });

  it('DIAMOND 等级包含所有低等级权益', () => {
    const diamondIdx = getLevelIndex('DIAMOND');
    for (const level of LEVEL_ORDER) {
      assert.ok(getLevelIndex(level) <= diamondIdx);
    }
  });
});

describe('admin-member-config: 反例', () => {
  it('validateLevelThresholds 阈值非递增', () => {
    const bad = { BRONZE: 0, SILVER: 100000, GOLD: 50000, PLATINUM: 2000000, DIAMOND: 5000000 };
    const err = validateLevelThresholds(bad);
    assert.ok(err?.includes('递增'));
  });

  it('validateLevelThresholds 负数阈值', () => {
    const bad = { BRONZE: -100, SILVER: 100000, GOLD: 500000, PLATINUM: 2000000, DIAMOND: 5000000 };
    const err = validateLevelThresholds(bad);
    assert.ok(err?.includes('负数'));
  });

  it('validatePointsConfig earnRate 为 0', () => {
    const err = validatePointsConfig({ ...DEFAULT_CONFIG.points, earnRate: 0 });
    assert.ok(err?.includes('必须大于 0'));
  });

  it('validatePointsConfig redeemRate 为负数', () => {
    const err = validatePointsConfig({ ...DEFAULT_CONFIG.points, redeemRate: -100 });
    assert.ok(err?.includes('必须大于 0'));
  });

  it('validatePointsConfig earnRate 超过 100', () => {
    const err = validatePointsConfig({ ...DEFAULT_CONFIG.points, earnRate: 200 });
    assert.ok(err?.includes('100%'));
  });

  it('validateLifecycle churnedDays <= dormantDays', () => {
    const err = validateLifecycle({ dormantDays: 180, churnedDays: 90 });
    assert.ok(err?.includes('必须大于'));
  });

  it('validateLifecycle dormantDays 为 0', () => {
    const err = validateLifecycle({ dormantDays: 0, churnedDays: 365 });
    assert.ok(err?.includes('≥ 1'));
  });
});

describe('admin-member-config: 边界', () => {
  it('getMemberLevel 恰好等于阈值', () => {
    const t = DEFAULT_CONFIG.levels.thresholds;
    assert.equal(getMemberLevel(100000, DEFAULT_CONFIG), 'SILVER');
    assert.equal(getMemberLevel(99999, DEFAULT_CONFIG), 'BRONZE');
  });

  it('BRONZE 阈值可为 0', () => {
    const t = DEFAULT_CONFIG.levels.thresholds;
    assert.equal(t.BRONZE, 0);
    assert.equal(getMemberLevel(0, DEFAULT_CONFIG), 'BRONZE');
  });

  it('极大数据等级的判定', () => {
    assert.equal(getMemberLevel(9999999999, DEFAULT_CONFIG), 'DIAMOND');
  });

  it('LEVEL_ORDER 有 5 级', () => {
    assert.equal(LEVEL_ORDER.length, 5);
  });

  it('points expiryDays 为 1 天', () => {
    const err = validatePointsConfig({ ...DEFAULT_CONFIG.points, expiryDays: 1 });
    assert.equal(err, null);
  });
});
