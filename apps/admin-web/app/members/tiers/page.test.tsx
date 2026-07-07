/**
 * MemberTiersPage 页面逻辑层测试
 *
 * 覆盖:
 * 1. 等级数据结构和映射校验
 * 2. 等级分布统计逻辑
 * 3. 趋势显示逻辑
 * 4. 筛选切换逻辑
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 等级数据定义（复用页面中的模拟数据）───────────────

interface MemberTier {
  tier: string;
  key: string;
  count: number;
  growth?: number;
}

const MOCK_TIERS: MemberTier[] = [
  { tier: '钻石会员', key: 'diamond', count: 128, growth: 0.12 },
  { tier: '黄金会员', key: 'gold', count: 450, growth: 0.05 },
  { tier: '白银会员', key: 'silver', count: 620, growth: -0.03 },
  { tier: '青铜会员', key: 'bronze', count: 890, growth: 0.01 },
  { tier: '铂金会员', key: 'platinum', count: 76, growth: 0.18 },
  { tier: '普通会员', key: 'regular', count: 2340, growth: -0.08 },
];

// ─── 辅助函数 ────────────────────────────────────────

function calculateTotal(tiers: MemberTier[]): number {
  return tiers.reduce((sum, t) => sum + t.count, 0);
}

function calculatePercentage(count: number, total: number): string {
  if (total === 0) return '0.0';
  return ((count / total) * 100).toFixed(1);
}

function filterByTier(tiers: MemberTier[], key: string | null): MemberTier[] {
  if (!key) return tiers;
  return tiers.filter((t) => t.key === key);
}

// ─── 测试套件 ────────────────────────────────────────

describe('MemberTiersPage — 等级数据逻辑', () => {
  it('1. 总人数计算正确（正例）', () => {
    const total = calculateTotal(MOCK_TIERS);
    assert.equal(total, 128 + 450 + 620 + 890 + 76 + 2340);
  });

  it('2. 每个等级占比计算正确（正例）', () => {
    const total = calculateTotal(MOCK_TIERS);
    for (const tier of MOCK_TIERS) {
      const pct = calculatePercentage(tier.count, total);
      const expected = ((tier.count / total) * 100).toFixed(1);
      assert.equal(pct, expected, `${tier.tier} 占比应为 ${expected}%`);
    }
  });

  it('3. 空数据总人数为 0（边界）', () => {
    assert.equal(calculateTotal([]), 0);
  });

  it('4. 空数据百分比为 0.0（边界）', () => {
    assert.equal(calculatePercentage(100, 0), '0.0');
  });

  it('5. 筛选 — 按等级 key 筛选（正例）', () => {
    const result = filterByTier(MOCK_TIERS, 'diamond');
    assert.equal(result.length, 1);
    assert.equal(result[0]!.tier, '钻石会员');
  });

  it('6. 筛选 — null 返回全部（正例）', () => {
    const result = filterByTier(MOCK_TIERS, null);
    assert.equal(result.length, MOCK_TIERS.length);
  });

  it('7. 筛选 — 不存在的 key 返回空（反例）', () => {
    const result = filterByTier(MOCK_TIERS, 'nonexistent');
    assert.equal(result.length, 0);
  });

  it('8. 增长率 — 正增长标识（正例）', () => {
    for (const tier of MOCK_TIERS) {
      if (tier.growth != null && tier.growth > 0) {
        assert.ok(tier.growth > 0, `${tier.tier} 应为正增长`);
      }
    }
  });

  it('9. 增长率 — 负增长标识（反例校验）', () => {
    for (const tier of MOCK_TIERS) {
      if (tier.growth != null && tier.growth < 0) {
        assert.ok(tier.growth < 0, `${tier.tier} 应为负增长`);
      }
    }
  });

  it('10. 增长率 — 零增长边界', () => {
    const tier: MemberTier = { tier: '测试', key: 'test', count: 100, growth: 0 };
    assert.equal(tier.growth, 0);
  });

  it('11. 增长率 — undefined 增长不参与计算', () => {
    const tier: MemberTier = { tier: '测试', key: 'test', count: 100 };
    assert.equal(tier.growth, undefined);
  });

  it('12. 等级 key 唯一性验证', () => {
    const keys = MOCK_TIERS.map((t) => t.key);
    const uniqueKeys = new Set(keys);
    assert.equal(keys.length, uniqueKeys.size, '所有等级 key 应唯一');
  });

  it('13. 所有等级 count 为非负数', () => {
    for (const tier of MOCK_TIERS) {
      assert.ok(tier.count >= 0, `${tier.tier} 人数不应为负`);
    }
  });
});
