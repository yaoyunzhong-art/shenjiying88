/**
 * admin/dashboard/page.test.ts — 全局分析仪表盘 L1 测试
 *
 * 覆盖:
 *   正例 — 概览数据常量校验、收入趋势生成逻辑、地理分布统计、趋势方向
 *   反例 — 空/零值区间边界、极端值比率
 *   边界 — 趋势生成天数、最小值/最大值/极差计算
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 从 page.tsx 提取的 Mock 数据 ─────────────────────

const OVERVIEW = {
  totalTenants: 128,
  tenantChange: '+12',
  totalStores: 1847,
  storeChange: '+156',
  totalRevenue: 45280000,
  revenueChange: '+18.5%',
  activeUsers: 456000,
  userChange: '+22.3%',
};

const REGION_STATS = [
  { region: '华东', count: 486, percentage: 26.3 },
  { region: '华南', count: 352, percentage: 19.1 },
  { region: '华北', count: 298, percentage: 16.1 },
  { region: '西南', count: 245, percentage: 13.3 },
  { region: '华中', count: 198, percentage: 10.7 },
  { region: '东北', count: 132, percentage: 7.1 },
  { region: '西北', count: 89, percentage: 4.8 },
  { region: '港澳台', count: 47, percentage: 2.5 },
];

const CATEGORY_REVENUE = [
  { category: '餐饮美食', revenue: 10580000, growth: 15.2 },
  { category: '零售百货', revenue: 8920000, growth: 8.7 },
  { category: '生活服务', revenue: 6750000, growth: 22.4 },
  { category: '教育培训', revenue: 4230000, growth: -3.1 },
  { category: '医疗健康', revenue: 3820000, growth: 45.6 },
  { category: '娱乐休闲', revenue: 3150000, growth: 12.8 },
  { category: '其他', revenue: 2650000, growth: 6.3 },
];

// ─── 辅助函数 ────────────────────────────────────────

function generateRevenueTrend(): { day: string; revenue: number }[] {
  const base = 380000;
  const trend: { day: string; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dayOfWeek = d.getDay();
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.25 : 1.0;
    const trendFactor = 1 + (29 - i) * 0.003;
    const noise = 0.85 + Math.random() * 0.3;
    const revenue = Math.round(base * weekendBoost * trendFactor * noise);
    trend.push({ day: `${mm}-${dd}`, revenue });
  }
  return trend;
}

function computeMaxMin(trend: { revenue: number }[]): { max: number; min: number; range: number } {
  const revenues = trend.map(d => d.revenue);
  const max = Math.max(...revenues);
  const min = Math.min(...revenues);
  return { max, min, range: max - min || 1 };
}

function totalRevenueByCategory(items: typeof CATEGORY_REVENUE): number {
  return items.reduce((s, c) => s + c.revenue, 0);
}

function avgGrowth(items: typeof CATEGORY_REVENUE): number {
  return items.reduce((s, c) => s + c.growth, 0) / items.length;
}

function totalPercentage(stats: typeof REGION_STATS): number {
  return Math.round(stats.reduce((s, r) => s + r.percentage, 0) * 10) / 10;
}

// ─── 测试套件 ────────────────────────────────────────

describe('admin/dashboard — 概览数据', () => {
  it('1. OVERVIEW 字段完整性（正例）', () => {
    assert.ok(OVERVIEW.totalTenants > 0);
    assert.ok(OVERVIEW.totalStores > 0);
    assert.ok(OVERVIEW.totalRevenue > 0);
    assert.ok(OVERVIEW.activeUsers > 0);
  });

  it('2. 租户数 vs 门店数比例合理（正例）', () => {
    const ratio = OVERVIEW.totalStores / OVERVIEW.totalTenants;
    assert.ok(ratio > 5, '每租户至少 5 门店');
    assert.ok(ratio < 50, '每租户至多 50 门店');
  });

  it('3. 人均营收 >= 0（边界）', () => {
    const perUser = OVERVIEW.totalRevenue / OVERVIEW.activeUsers;
    assert.ok(perUser > 0);
    assert.ok(Number.isFinite(perUser));
  });

  it('4. 变更值格式（正例）', () => {
    assert.ok(OVERVIEW.tenantChange.startsWith('+') || OVERVIEW.tenantChange.startsWith('-'));
    assert.ok(OVERVIEW.revenueChange.includes('%'));
    assert.ok(OVERVIEW.userChange.includes('%'));
  });
});

describe('admin/dashboard — 收入趋势生成', () => {
  it('5. 生成 30 天数据（正例）', () => {
    const trend = generateRevenueTrend();
    assert.equal(trend.length, 30);
  });

  it('6. 每天 revenue > 0（正例）', () => {
    const trend = generateRevenueTrend();
    for (const d of trend) {
      assert.ok(d.revenue > 0, `${d.day} 营收应为正`);
    }
  });

  it('7. 日期格式 MM-DD（正例）', () => {
    const trend = generateRevenueTrend();
    for (const d of trend) {
      assert.match(d.day, /^\d{2}-\d{2}$/);
    }
  });

  it('8. 最大值 >= 最小值（正例）', () => {
    const trend = generateRevenueTrend();
    const { max, min } = computeMaxMin(trend);
    assert.ok(max >= min);
  });

  it('9. 极差至少为 1（边界）', () => {
    const trend = generateRevenueTrend();
    const { range } = computeMaxMin(trend);
    assert.ok(range >= 1);
  });

  it('10. 连续两次调用不同（随机性校验）', () => {
    const t1 = generateRevenueTrend();
    const t2 = generateRevenueTrend();
    const revs1 = t1.map(d => d.revenue);
    const revs2 = t2.map(d => d.revenue);
    const same = revs1.every((v, i) => v === revs2[i]);
    assert.ok(!same, '两次生成应有随机差异');
  });
});

describe('admin/dashboard — 地理分布', () => {
  it('11. 门店总数 1847（正例）', () => {
    const total = REGION_STATS.reduce((s, r) => s + r.count, 0);
    assert.equal(total, 1847);
  });

  it('12. 百分比合计 ≈ 100%（正例）', () => {
    const pct = totalPercentage(REGION_STATS);
    assert.ok(Math.abs(pct - 100) < 1, `百分比合计 ${pct}%，应在 100% 附近`);
  });

  it('13. 各区间占比 non-negative（反例）', () => {
    for (const r of REGION_STATS) {
      assert.ok(r.percentage >= 0, `${r.region} 占比不能为负`);
    }
  });

  it('14. 华东为第一大区（正例）', () => {
    const sorted = [...REGION_STATS].sort((a, b) => b.count - a.count);
    assert.equal(sorted[0]!.region, '华东');
  });

  it('15. 港澳台占比最小（正例）', () => {
    const sorted = [...REGION_STATS].sort((a, b) => a.count - b.count);
    assert.equal(sorted[0]!.region, '港澳台');
  });
});

describe('admin/dashboard — 分类营收', () => {
  it('16. 各分类营收为正（正例）', () => {
    for (const c of CATEGORY_REVENUE) {
      assert.ok(c.revenue > 0, `${c.category} 营收应 > 0`);
    }
  });

  it('17. 总营收 ≈ 40,100,000（正例）', () => {
    const total = totalRevenueByCategory(CATEGORY_REVENUE);
    assert.ok(Math.abs(total - 40100000) < 100000);
  });

  it('18. 增长率存在负值（反例覆盖）', () => {
    const negatives = CATEGORY_REVENUE.filter(c => c.growth < 0);
    assert.ok(negatives.length > 0, '至少一个分类增长率为负');
  });

  it('19. 平均增长率（正例）', () => {
    const avg = avgGrowth(CATEGORY_REVENUE);
    assert.ok(avg > 0, `平均增长率 ${avg}% 应为正`);
  });
});
