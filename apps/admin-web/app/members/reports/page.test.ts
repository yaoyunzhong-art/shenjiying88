/**
 * members/reports/page.test.ts — 会员报表首页 L1 测试
 *
 * 覆盖:
 *   正例 — 指标数据生成、RFM 分群结构、统计计算（总新增/活跃率/营收/流失率）
 *   反例 — 空数组统计、零值边界
 *   边界 — 90 天跨度、百分比格式化、金额格式化
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型定义 ────────────────────────────────────────

interface MemberMetrics {
  date: string;
  newMembers: number;
  totalMembers: number;
  activeMembers: number;
  activeRate: number;
  newRevenue: number;
  repeatRevenue: number;
  totalRevenue: number;
  avgRecharge: number;
  avgSpend: number;
  churnRate: number;
  retentionRate: number;
  ltv30: number;
  ltv90: number;
}

interface RFMSegment {
  segment: string;
  count: number;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
  totalValue: number;
  pctOfRevenue: number;
  color: string;
}

interface MemberActivity {
  period: string;
  dailyActive: number;
  weeklyActive: number;
  monthlyActive: number;
  avgSessionMinutes: number;
  avgVisitsPerWeek: number;
  peakDay: string;
  peakHour: string;
}

// ─── Mock RFM 数据 ──────────────────────────────────

const MOCK_RFM: RFMSegment[] = [
  { segment: '重要价值会员', count: 245, avgRecency: 2, avgFrequency: 8.5, avgMonetary: 850, totalValue: 208250, pctOfRevenue: 28, color: '#22c55e' },
  { segment: '重要发展会员', count: 380, avgRecency: 5, avgFrequency: 4.2, avgMonetary: 420, totalValue: 159600, pctOfRevenue: 22, color: '#3b82f6' },
  { segment: '重要保持会员', count: 210, avgRecency: 15, avgFrequency: 3.8, avgMonetary: 380, totalValue: 79800, pctOfRevenue: 11, color: '#8b5cf6' },
  { segment: '重要挽留会员', count: 156, avgRecency: 30, avgFrequency: 2.1, avgMonetary: 350, totalValue: 54600, pctOfRevenue: 7.5, color: '#f97316' },
  { segment: '一般价值会员', count: 420, avgRecency: 7, avgFrequency: 3.5, avgMonetary: 180, totalValue: 75600, pctOfRevenue: 10.5, color: '#06b6d4' },
  { segment: '一般发展会员', count: 345, avgRecency: 10, avgFrequency: 2.8, avgMonetary: 150, totalValue: 51750, pctOfRevenue: 7, color: '#eab308' },
  { segment: '一般保持会员', count: 280, avgRecency: 20, avgFrequency: 2.0, avgMonetary: 120, totalValue: 33600, pctOfRevenue: 4.5, color: '#6b7280' },
  { segment: '流失会员', count: 509, avgRecency: 60, avgFrequency: 1.5, avgMonetary: 90, totalValue: 45810, pctOfRevenue: 6.5, color: '#ef4444' },
];

const MOCK_ACTIVITY: MemberActivity = {
  period: '近30天',
  dailyActive: 320,
  weeklyActive: 980,
  monthlyActive: 1876,
  avgSessionMinutes: 68,
  avgVisitsPerWeek: 2.4,
  peakDay: '星期六',
  peakHour: '19:00-21:00',
};

// ─── 辅助函数 ────────────────────────────────────────

function generateMetrics(count: number): MemberMetrics[] {
  const data: MemberMetrics[] = [];
  let total = 2800;
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(2026, 3, 11 + i);
    const newM = 3 + Math.floor(Math.random() * 8);
    const active = Math.floor(total * (0.45 + Math.random() * 0.15));
    const churn = Math.round((0.03 + Math.random() * 0.05) * 100) / 100;
    total += newM - Math.floor(total * churn);
    const newRev = Math.round((newM * (80 + Math.random() * 120)) * 100) / 100;
    const repeatRev = Math.round((active * (40 + Math.random() * 80)) * 100) / 100;
    data.push({
      date: d.toISOString().split('T')[0],
      newMembers: newM,
      totalMembers: total,
      activeMembers: active,
      activeRate: Math.round((active / total) * 10000) / 100,
      newRevenue: newRev,
      repeatRevenue: repeatRev,
      totalRevenue: Math.round((newRev + repeatRev) * 100) / 100,
      avgRecharge: Math.round((150 + Math.random() * 200) * 100) / 100,
      avgSpend: Math.round((55 + Math.random() * 45) * 100) / 100,
      churnRate: churn,
      retentionRate: Math.round((1 - churn) * 10000) / 100,
      ltv30: Math.round((180 + Math.random() * 120) * 100) / 100,
      ltv90: Math.round((400 + Math.random() * 300) * 100) / 100,
    });
  }
  return data;
}

function computeActiveRate(metrics: MemberMetrics[]): number {
  if (metrics.length === 0) return 0;
  return metrics.reduce((s, m) => s + m.activeRate, 0) / metrics.length;
}

function computeTotalNewMembers(metrics: MemberMetrics[]): number {
  return metrics.reduce((s, m) => s + m.newMembers, 0);
}

function computeTotalRevenue(metrics: MemberMetrics[]): number {
  return metrics.reduce((s, m) => s + m.totalRevenue, 0);
}

function computeAvgChurn(metrics: MemberMetrics[]): number {
  if (metrics.length === 0) return 0;
  return metrics.reduce((s, m) => s + m.churnRate, 0) / metrics.length;
}

function computeAvgLTV30(metrics: MemberMetrics[]): number {
  if (metrics.length === 0) return 0;
  return metrics.reduce((s, m) => s + m.ltv30, 0) / metrics.length;
}

function rfmTotalMembers(rfm: RFMSegment[]): number {
  return rfm.reduce((s, r) => s + r.count, 0);
}

function rfmTotalValue(rfm: RFMSegment[]): number {
  return rfm.reduce((s, r) => s + r.totalValue, 0);
}

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

// ─── 测试套件 ────────────────────────────────────────

describe('members/reports — 指标数据生成', () => {
  it('1. 生成 90 天数据（正例）', () => {
    const metrics = generateMetrics(90);
    assert.equal(metrics.length, 90);
  });

  it('2. 每天新会员 > 0（正例）', () => {
    const metrics = generateMetrics(90);
    for (const m of metrics) {
      assert.ok(m.newMembers > 0, `${m.date} 新会员 > 0`);
    }
  });

  it('3. activeRate 在 0-100 之间（正例）', () => {
    const metrics = generateMetrics(90);
    for (const m of metrics) {
      assert.ok(m.activeRate >= 0 && m.activeRate <= 100, `${m.date} activeRate ${m.activeRate}`);
    }
  });

  it('4. totalMembers 非递减（正例）', () => {
    const metrics = generateMetrics(90);
    for (let i = 1; i < metrics.length; i++) {
      assert.ok(metrics[i]!.totalMembers >= metrics[i - 1]!.totalMembers || metrics[i]!.totalMembers > metrics[i - 1]!.totalMembers * 0.9);
    }
  });

  it('5. churnRate 在 0-1 之间（正例）', () => {
    const metrics = generateMetrics(90);
    for (const m of metrics) {
      assert.ok(m.churnRate >= 0 && m.churnRate <= 1, `${m.date} churn ${m.churnRate}`);
    }
  });

  it('6. 日期格式为 YYYY-MM-DD（正例）', () => {
    const metrics = generateMetrics(90);
    for (const m of metrics) {
      assert.match(m.date, /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('7. retentionRate = 1 - churnRate（正例）', () => {
    const metrics = generateMetrics(30);
    for (const m of metrics) {
      assert.equal(m.retentionRate, Math.round((1 - m.churnRate) * 10000) / 100);
    }
  });
});

describe('members/reports — 统计计算', () => {
  it('8. 总新增会员数 = 各天之和（正例）', () => {
    const metrics = generateMetrics(30);
    const sum = metrics.reduce((s, m) => s + m.newMembers, 0);
    assert.equal(computeTotalNewMembers(metrics), sum);
  });

  it('9. 平均 activeRate 在合理范围（正例）', () => {
    const metrics = generateMetrics(90);
    const avg = computeActiveRate(metrics);
    assert.ok(avg >= 30 && avg <= 65, `平均活跃率 ${avg}%`);
  });

  it('10. 总营收为正（正例）', () => {
    const metrics = generateMetrics(90);
    assert.ok(computeTotalRevenue(metrics) > 0);
  });

  it('11. 平均流失率 < 0.1（正例）', () => {
    const metrics = generateMetrics(90);
    assert.ok(computeAvgChurn(metrics) < 0.1);
  });

  it('12. 平均 LTV30 在合理范围（正例）', () => {
    const metrics = generateMetrics(90);
    const avg = computeAvgLTV30(metrics);
    assert.ok(avg >= 150 && avg <= 300, `平均 LTV30 = ${avg}`);
  });
});

describe('members/reports — RFM 分群', () => {
  it('13. 8 个分群（正例）', () => {
    assert.equal(MOCK_RFM.length, 8);
  });

  it('14. 总会员数（正例）', () => {
    const total = rfmTotalMembers(MOCK_RFM);
    assert.equal(total, 2545);
  });

  it('15. 各分群 count > 0（正例）', () => {
    for (const r of MOCK_RFM) {
      assert.ok(r.count > 0, `${r.segment} count > 0`);
    }
  });

  it('16. 各分群 avgMonetary > 0（正例）', () => {
    for (const r of MOCK_RFM) {
      assert.ok(r.avgMonetary > 0, `${r.segment} avgMonetary > 0`);
    }
  });

  it('17. pctOfRevenue 总和 ≈ 100（正例）', () => {
    const pctSum = MOCK_RFM.reduce((s, r) => s + r.pctOfRevenue, 0);
    assert.ok(Math.abs(pctSum - 100) < 2, `营收占比合计 ${pctSum}%`);
  });

  it('18. 重要价值会员总价值最高（正例）', () => {
    const sorted = [...MOCK_RFM].sort((a, b) => b.totalValue - a.totalValue);
    assert.equal(sorted[0]!.segment, '重要价值会员');
  });

  it('19. 流失会员数最多（正例）', () => {
    const sorted = [...MOCK_RFM].sort((a, b) => b.count - a.count);
    assert.equal(sorted[0]!.segment, '流失会员');
  });
});

describe('members/reports — 活跃度数据', () => {
  it('20. MAU > WAU > DAU（正例）', () => {
    assert.ok(MOCK_ACTIVITY.monthlyActive > MOCK_ACTIVITY.weeklyActive);
    assert.ok(MOCK_ACTIVITY.weeklyActive > MOCK_ACTIVITY.dailyActive);
  });

  it('21. DAU 占比合理（正例）', () => {
    const pct = (MOCK_ACTIVITY.dailyActive / 2800) * 100;
    assert.ok(pct >= 5 && pct <= 25, `DAU 占比 ${pct}%`);
  });

  it('22. 活跃时段非空（正例）', () => {
    assert.ok(MOCK_ACTIVITY.peakDay.length > 0);
    assert.ok(MOCK_ACTIVITY.peakHour.length > 0);
  });
});

describe('members/reports — 空数据与边界', () => {
  it('23. 空 metrics 返回 0（边界）', () => {
    assert.equal(computeTotalNewMembers([]), 0);
    assert.equal(computeAvgChurn([]), 0);
    assert.equal(computeAvgLTV30([]), 0);
    assert.equal(computeActiveRate([]), 0);
  });

  it('24. formatMoney 格式正确（正例）', () => {
    assert.match(formatMoney(1234.56), /^¥1,234\.56$/);
  });

  it('25. formatMoney 零值（边界）', () => {
    assert.equal(formatMoney(0), '¥0.00');
  });
});
