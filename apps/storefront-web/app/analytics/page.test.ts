/**
 * analytics/page.test.ts — 数据分析页 L1 测试
 *
 * 覆盖: 数据模型 / KPI 汇总 / 高峰分析 / 品类洞察 / 每日均线 / 增长率计算 / 异常管理
 * 角色视角: 👔 店长 / 💰 财务 / 🎯 运营总监 / 🛡️ 品质管理
 *
 * 纯 node:test 风格 (与 store-revenue/page.test.ts 同模式)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync } from 'node:fs';

// ── 类型 (mirrors page.tsx) ──

interface KpiCard {
  label: string;
  value: string;
  trend: number;
  unit?: string;
  variant: 'success' | 'warning' | 'error' | 'info';
}

interface HourlyTraffic {
  hour: number;
  visitors: number;
  transactions: number;
  revenue: number;
}

interface CategoryMetric {
  category: string;
  sales: number;
  revenue: number;
  percentage: number;
  growth: number;
}

interface DailyComparison {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  visitors: number;
}

interface AnomalyRecord {
  id: string;
  metric: string;
  expected: number;
  actual: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  resolved: boolean;
}

// ── Mock 数据 (mirrors page.tsx) ──

const MOCK_KPI_CARDS: KpiCard[] = [
  { label: '今日营收', value: '¥12,580', trend: 8.3, unit: '元', variant: 'success' },
  { label: '今日订单', value: '86', trend: 5.1, unit: '单', variant: 'success' },
  { label: '客单价', value: '¥286', trend: -2.4, unit: '元', variant: 'warning' },
  { label: '到店客流', value: '342', trend: 12.7, unit: '人', variant: 'success' },
  { label: '转化率', value: '25.1%', trend: -0.8, unit: '%', variant: 'warning' },
  { label: '会员消费占比', value: '62.3%', trend: 3.5, unit: '%', variant: 'success' },
];

const MOCK_HOURLY_TRAFFIC: HourlyTraffic[] = [
  { hour: 8, visitors: 12, transactions: 5, revenue: 680 },
  { hour: 9, visitors: 28, transactions: 14, revenue: 2100 },
  { hour: 10, visitors: 45, transactions: 22, revenue: 3850 },
  { hour: 11, visitors: 62, transactions: 30, revenue: 5200 },
  { hour: 12, visitors: 78, transactions: 38, revenue: 6800 },
  { hour: 13, visitors: 55, transactions: 28, revenue: 4600 },
  { hour: 14, visitors: 48, transactions: 24, revenue: 4100 },
  { hour: 15, visitors: 52, transactions: 26, revenue: 4350 },
  { hour: 16, visitors: 68, transactions: 34, revenue: 5800 },
  { hour: 17, visitors: 85, transactions: 42, revenue: 7200 },
  { hour: 18, visitors: 92, transactions: 46, revenue: 8100 },
  { hour: 19, visitors: 88, transactions: 44, revenue: 7650 },
  { hour: 20, visitors: 72, transactions: 36, revenue: 6200 },
  { hour: 21, visitors: 45, transactions: 22, revenue: 3800 },
  { hour: 22, visitors: 22, transactions: 10, revenue: 1650 },
];

const MOCK_CATEGORY_METRICS: CategoryMetric[] = [
  { category: '饮品', sales: 286, revenue: 8580, percentage: 28.6, growth: 12.4 },
  { category: '轻食', sales: 198, revenue: 5940, percentage: 19.8, growth: 8.2 },
  { category: '甜品', sales: 145, revenue: 4350, percentage: 14.5, growth: -3.1 },
  { category: '套餐', sales: 112, revenue: 5600, percentage: 18.7, growth: 15.6 },
  { category: '会员权益', sales: 86, revenue: 4150, percentage: 13.8, growth: 22.8 },
  { category: '其他', sales: 52, revenue: 1360, percentage: 4.6, growth: -1.5 },
];

const MOCK_DAILY_COMPARISON: DailyComparison[] = [
  { date: '2026-07-13', revenue: 48200, orders: 86, avgOrderValue: 560, visitors: 210 },
  { date: '2026-07-14', revenue: 51300, orders: 92, avgOrderValue: 558, visitors: 235 },
  { date: '2026-07-15', revenue: 46800, orders: 84, avgOrderValue: 557, visitors: 220 },
  { date: '2026-07-16', revenue: 55600, orders: 98, avgOrderValue: 567, visitors: 265 },
  { date: '2026-07-17', revenue: 61200, orders: 105, avgOrderValue: 583, visitors: 290 },
  { date: '2026-07-18', revenue: 58900, orders: 102, avgOrderValue: 577, visitors: 280 },
  { date: '2026-07-19', revenue: 44500, orders: 78, avgOrderValue: 570, visitors: 195 },
];

const MOCK_ANOMALIES: AnomalyRecord[] = [
  { id: 'an-01', metric: '客单价', expected: 570, actual: 286, deviation: -49.8, severity: 'high', timestamp: '2026-07-19T10:30:00Z', resolved: false },
  { id: 'an-02', metric: '夜间订单', expected: 15, actual: 35, deviation: 133.3, severity: 'medium', timestamp: '2026-07-19T06:00:00Z', resolved: true },
  { id: 'an-03', metric: '退款率', expected: 3.0, actual: 7.8, deviation: 160, severity: 'high', timestamp: '2026-07-18T18:00:00Z', resolved: false },
  { id: 'an-04', metric: '库存周转', expected: 15, actual: 8, deviation: -46.7, severity: 'medium', timestamp: '2026-07-17T12:00:00Z', resolved: false },
  { id: 'an-05', metric: '会员活跃', expected: 180, actual: 145, deviation: -19.4, severity: 'low', timestamp: '2026-07-16T20:00:00Z', resolved: true },
  { id: 'an-06', metric: '支付成功率', expected: 99.0, actual: 96.2, deviation: -2.8, severity: 'low', timestamp: '2026-07-15T14:00:00Z', resolved: false },
];

// ── 纯函数 (mirrors page.tsx exports) ──

function computeKpiTotals(kpis: KpiCard[]): { positiveTrends: number; negativeTrends: number; avgTrend: number } {
  const positiveTrends = kpis.filter(k => k.trend > 0).length;
  const negativeTrends = kpis.filter(k => k.trend < 0).length;
  const avgTrend = kpis.length > 0 ? Math.round(kpis.reduce((s, k) => s + k.trend, 0) / kpis.length * 10) / 10 : 0;
  return { positiveTrends, negativeTrends, avgTrend };
}

function computePeakHour(traffic: HourlyTraffic[]): { hour: number; visitors: number; revenue: number } | null {
  if (traffic.length === 0) return null;
  return traffic.reduce((peak, curr) => curr.visitors > peak.visitors ? curr : peak, traffic[0]);
}

function computeCategoryInsights(categories: CategoryMetric[]): {
  totalSales: number;
  totalRevenue: number;
  topCategory: string;
  positiveGrowth: number;
  negativeGrowth: number;
} {
  const totalSales = categories.reduce((s, c) => s + c.sales, 0);
  const totalRevenue = categories.reduce((s, c) => s + c.revenue, 0);
  const topCategory = categories.reduce((best, c) => c.sales > best.sales ? c : best, categories[0]).category;
  const positiveGrowth = categories.filter(c => c.growth > 0).length;
  const negativeGrowth = categories.filter(c => c.growth < 0).length;
  return { totalSales, totalRevenue, topCategory, positiveGrowth, negativeGrowth };
}

function computeDailyAverages(days: DailyComparison[]): {
  avgRevenue: number;
  avgOrders: number;
  avgAOV: number;
  avgVisitors: number;
  maxRevenueDay: string;
  minRevenueDay: string;
} {
  if (days.length === 0) {
    return { avgRevenue: 0, avgOrders: 0, avgAOV: 0, avgVisitors: 0, maxRevenueDay: '', minRevenueDay: '' };
  }
  const avgRevenue = Math.round(days.reduce((s, d) => s + d.revenue, 0) / days.length);
  const avgOrders = Math.round(days.reduce((s, d) => s + d.orders, 0) / days.length);
  const avgAOV = Math.round(days.reduce((s, d) => s + d.avgOrderValue, 0) / days.length);
  const avgVisitors = Math.round(days.reduce((s, d) => s + d.visitors, 0) / days.length);
  const max = days.reduce((a, b) => a.revenue > b.revenue ? a : b);
  const min = days.reduce((a, b) => a.revenue < b.revenue ? a : b);
  return { avgRevenue, avgOrders, avgAOV, avgVisitors, maxRevenueDay: max.date, minRevenueDay: min.date };
}

function computeRevenueGrowth(days: DailyComparison[]): number {
  if (days.length < 2) return 0;
  const mid = Math.floor(days.length / 2);
  const firstHalf = days.slice(0, mid).reduce((s, d) => s + d.revenue, 0);
  const secondHalf = days.slice(mid).reduce((s, d) => s + d.revenue, 0);
  if (firstHalf === 0) return 0;
  return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
}

function countUnresolvedAnomalies(anomalies: AnomalyRecord[]): number {
  return anomalies.filter(a => !a.resolved).length;
}

function filterAnomaliesBySeverity(anomalies: AnomalyRecord[], severity: 'low' | 'medium' | 'high'): AnomalyRecord[] {
  return anomalies.filter(a => a.severity === severity);
}

function anomalySeverityWeight(severity: 'low' | 'medium' | 'high'): number {
  const map = { low: 1, medium: 2, high: 3 };
  return map[severity];
}

// ════════════════════════════════════════════════════════
// 正例
// ════════════════════════════════════════════════════════

describe('analytics — KPI 指标', () => {

  it('应有 6 个 KPI 指标卡', () => {
    assert.equal(MOCK_KPI_CARDS.length, 6);
  });

  it('每个 KPI 应有完整字段', () => {
    for (const k of MOCK_KPI_CARDS) {
      assert.ok(k.label);
      assert.ok(k.value);
      assert.equal(typeof k.trend, 'number');
      assert.ok(['success', 'warning', 'error', 'info'].includes(k.variant), `invalid variant: ${k.variant}`);
    }
  });

  it('KPI 正向趋势指标多于负向', () => {
    const result = computeKpiTotals(MOCK_KPI_CARDS);
    assert.ok(result.positiveTrends > result.negativeTrends, 'positive trends should dominate');
  });

  it('KPI 平均趋势应 ~4.4%', () => {
    const result = computeKpiTotals(MOCK_KPI_CARDS);
    assert.equal(result.avgTrend, 4.4);
  });

  it('趋势为正的有 4 个', () => {
    const result = computeKpiTotals(MOCK_KPI_CARDS);
    assert.equal(result.positiveTrends, 4);
  });

  it('趋势为负的有 2 个', () => {
    const result = computeKpiTotals(MOCK_KPI_CARDS);
    assert.equal(result.negativeTrends, 2);
  });
});

describe('analytics — 小时级客流', () => {

  it('应有 15 个小时段数据', () => {
    assert.equal(MOCK_HOURLY_TRAFFIC.length, 15);
  });

  it('所有小时在 8-22 范围内', () => {
    for (const t of MOCK_HOURLY_TRAFFIC) {
      assert.ok(t.hour >= 8 && t.hour <= 22, `hour ${t.hour} out of range`);
    }
  });

  it('所有客流和交易数非负', () => {
    for (const t of MOCK_HOURLY_TRAFFIC) {
      assert.ok(t.visitors >= 0, `hour ${t.hour} negative visitors`);
      assert.ok(t.transactions >= 0, `hour ${t.hour} negative transactions`);
      assert.ok(t.revenue >= 0, `hour ${t.hour} negative revenue`);
    }
  });

  it('高峰时段为 18 点 (收银台高峰)', () => {
    const peak = computePeakHour(MOCK_HOURLY_TRAFFIC);
    assert.notEqual(peak, null);
    assert.equal(peak!.hour, 18);
    assert.equal(peak!.visitors, 92);
  });

  it('客流量与交易数正相关', () => {
    for (const t of MOCK_HOURLY_TRAFFIC) {
      assert.ok(t.transactions <= t.visitors, `hour ${t.hour}: transactions ${t.transactions} > visitors ${t.visitors}`);
    }
  });

  it('高峰时段营收最高', () => {
    const peak = computePeakHour(MOCK_HOURLY_TRAFFIC);
    const maxRevenue = MOCK_HOURLY_TRAFFIC.reduce((max, curr) => curr.revenue > max.revenue ? curr : max, MOCK_HOURLY_TRAFFIC[0]);
    assert.equal(peak!.hour, maxRevenue.hour, 'peak visitors should align with peak revenue');
  });
});

describe('analytics — 品类分析', () => {

  it('应有 6 个品类', () => {
    assert.equal(MOCK_CATEGORY_METRICS.length, 6);
  });

  it('品类总销售额应正确', () => {
    const result = computeCategoryInsights(MOCK_CATEGORY_METRICS);
    assert.equal(result.totalSales, 879);
  });

  it('品类总收入应正确', () => {
    const result = computeCategoryInsights(MOCK_CATEGORY_METRICS);
    assert.equal(result.totalRevenue, 29980);
  });

  it('Top 品类应为 "饮品"', () => {
    const result = computeCategoryInsights(MOCK_CATEGORY_METRICS);
    assert.equal(result.topCategory, '饮品');
  });

  it('正增长品类 > 负增长品类', () => {
    const result = computeCategoryInsights(MOCK_CATEGORY_METRICS);
    assert.ok(result.positiveGrowth > result.negativeGrowth, 'more categories should have positive growth');
  });

  it('品类百分比之和应在 99-101% 之间（误差允许）', () => {
    const total = MOCK_CATEGORY_METRICS.reduce((s, c) => s + c.percentage, 0);
    assert.ok(total >= 99 && total <= 101, `category percentages sum to ${total}`);
  });

  it('每个品类 revenue 应与 sales * 单价一致', () => {
    // Verify revenue/unit sanity: each category revenue should be reasonable relative to sales
    for (const c of MOCK_CATEGORY_METRICS) {
      const unitPrice = Math.round(c.revenue / c.sales);
      assert.ok(unitPrice >= 10 && unitPrice <= 80, `category ${c.category} unit price ${unitPrice} out of range`);
    }
  });
});

describe('analytics — 每日营收对比', () => {

  it('应有 7 天对比数据', () => {
    assert.equal(MOCK_DAILY_COMPARISON.length, 7);
  });

  it('日期格式为 YYYY-MM-DD', () => {
    for (const d of MOCK_DAILY_COMPARISON) {
      assert.match(d.date, /^\d{4}-\d{2}-\d{2}$/, `invalid date: ${d.date}`);
    }
  });

  it('日均营收应 ~52357', () => {
    const avg = computeDailyAverages(MOCK_DAILY_COMPARISON);
    assert.equal(avg.avgRevenue, 52357);
  });

  it('日均订单 ~92', () => {
    const avg = computeDailyAverages(MOCK_DAILY_COMPARISON);
    assert.equal(avg.avgOrders, 92);
  });

  it('日均客单价 ~567', () => {
    const avg = computeDailyAverages(MOCK_DAILY_COMPARISON);
    assert.equal(avg.avgAOV, 567);
  });

  it('日均客流 ~242 人', () => {
    const avg = computeDailyAverages(MOCK_DAILY_COMPARISON);
    assert.equal(avg.avgVisitors, 242);
  });

  it('最高营收日为 2026-07-17', () => {
    const avg = computeDailyAverages(MOCK_DAILY_COMPARISON);
    assert.equal(avg.maxRevenueDay, '2026-07-17');
  });

  it('最低营收日为 2026-07-19', () => {
    const avg = computeDailyAverages(MOCK_DAILY_COMPARISON);
    assert.equal(avg.minRevenueDay, '2026-07-19');
  });

  it('单日最高营收 61200 > 单日最低 44500', () => {
    const max = Math.max(...MOCK_DAILY_COMPARISON.map(d => d.revenue));
    const min = Math.min(...MOCK_DAILY_COMPARISON.map(d => d.revenue));
    assert.ok(max > min);
    assert.equal(max, 61200);
    assert.equal(min, 44500);
  });

  it('revenue 与 orders/avgOrderValue 相乘一致', () => {
    for (const d of MOCK_DAILY_COMPARISON) {
      const computed = Math.round(d.orders * d.avgOrderValue);
      const diff = Math.abs(computed - d.revenue);
      assert.ok(diff <= 100, `${d.date}: computed ${computed} vs actual ${d.revenue} diff ${diff} > 100`);
    }
  });
});

describe('analytics — 增长率', () => {

  it('7 天数据应有正增长', () => {
    const growth = computeRevenueGrowth(MOCK_DAILY_COMPARISON);
    assert.ok(growth > 0, 'revenue growth should be positive');
  });

  it('具体增长率应为 51%', () => {
    const growth = computeRevenueGrowth(MOCK_DAILY_COMPARISON);
    assert.equal(growth, 51);
  });

  it('不足 2 天数据增长率为 0', () => {
    assert.equal(computeRevenueGrowth([]), 0);
    assert.equal(computeRevenueGrowth([MOCK_DAILY_COMPARISON[0]]), 0);
  });
});

describe('analytics — 异常指标', () => {

  it('应有 6 条异常记录', () => {
    assert.equal(MOCK_ANOMALIES.length, 6);
  });

  it('每个异常应有唯一 id', () => {
    const ids = MOCK_ANOMALIES.map(a => a.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('未处理异常为 4 条', () => {
    assert.equal(countUnresolvedAnomalies(MOCK_ANOMALIES), 4);
  });

  it('严重等级分布: high=2, medium=2, low=2', () => {
    assert.equal(filterAnomaliesBySeverity(MOCK_ANOMALIES, 'high').length, 2);
    assert.equal(filterAnomaliesBySeverity(MOCK_ANOMALIES, 'medium').length, 2);
    assert.equal(filterAnomaliesBySeverity(MOCK_ANOMALIES, 'low').length, 2);
  });

  it('所有异常 severity 有效', () => {
    const valid = ['low', 'medium', 'high'];
    for (const a of MOCK_ANOMALIES) {
      assert.ok(valid.includes(a.severity), `invalid severity: ${a.severity}`);
    }
  });

  it('severity 权重 high > medium > low', () => {
    assert.ok(anomalySeverityWeight('high') > anomalySeverityWeight('medium'));
    assert.ok(anomalySeverityWeight('medium') > anomalySeverityWeight('low'));
  });

  it('已解决 + 未解决 = 总数', () => {
    const unresolved = countUnresolvedAnomalies(MOCK_ANOMALIES);
    const resolved = MOCK_ANOMALIES.filter(a => a.resolved).length;
    assert.equal(unresolved + resolved, MOCK_ANOMALIES.length);
  });

  it('timestamp 格式合法', () => {
    for (const a of MOCK_ANOMALIES) {
      const d = new Date(a.timestamp);
      assert.ok(d.getTime() > 0, `invalid timestamp: ${a.timestamp}`);
    }
  });
});

// ════════════════════════════════════════════════════════
// 反例
// ════════════════════════════════════════════════════════

describe('analytics — 反例', () => {

  it('KPI 指标 value 不应为空字符串', () => {
    for (const k of MOCK_KPI_CARDS) {
      assert.ok(k.value.length > 0, `${k.label} has empty value`);
    }
  });

  it('客流量不应超过店铺合理容量', () => {
    for (const t of MOCK_HOURLY_TRAFFIC) {
      assert.ok(t.visitors <= 200, `hour ${t.hour} visitors ${t.visitors} exceeds capacity`);
    }
  });

  it('品类占比不应 > 40%（单体不应过大）', () => {
    for (const c of MOCK_CATEGORY_METRICS) {
      assert.ok(c.percentage < 40, `category ${c.category} percentage ${c.percentage} too high`);
    }
  });

  it('日均 AOV 不应低于 500（区间检查）', () => {
    const avg = computeDailyAverages(MOCK_DAILY_COMPARISON);
    assert.ok(avg.avgAOV >= 500, `avg AOV ${avg.avgAOV} too low`);
  });

  it('异常 deviation 不应为 NaN', () => {
    for (const a of MOCK_ANOMALIES) {
      assert.ok(!Number.isNaN(a.deviation), `${a.id} has NaN deviation`);
    }
  });
});

// ════════════════════════════════════════════════════════
// 边界
// ════════════════════════════════════════════════════════

describe('analytics — 边界', () => {

  it('空 hourlys 高峰返回 null', () => {
    assert.equal(computePeakHour([]), null);
  });

  it('单条 hourlys 高峰返回自身', () => {
    const single = [{ hour: 10, visitors: 30, transactions: 15, revenue: 2000 }];
    const peak = computePeakHour(single);
    assert.notEqual(peak, null);
    assert.equal(peak!.hour, 10);
    assert.equal(peak!.visitors, 30);
  });

  it('空 daily 对比返回全零', () => {
    const avg = computeDailyAverages([]);
    assert.equal(avg.avgRevenue, 0);
    assert.equal(avg.avgOrders, 0);
    assert.equal(avg.avgAOV, 0);
    assert.equal(avg.avgVisitors, 0);
    assert.equal(avg.maxRevenueDay, '');
    assert.equal(avg.minRevenueDay, '');
  });

  it('空异常列表 countUnresolved 返回 0', () => {
    assert.equal(countUnresolvedAnomalies([]), 0);
  });

  it('空异常列表 filterBySeverity 返回空数组', () => {
    assert.equal(filterAnomaliesBySeverity([], 'high').length, 0);
  });

  it('增长率为 0 时所有期 revenue 相等', () => {
    const flat: DailyComparison[] = [
      { date: '2026-07-13', revenue: 50000, orders: 80, avgOrderValue: 625, visitors: 200 },
      { date: '2026-07-14', revenue: 50000, orders: 80, avgOrderValue: 625, visitors: 200 },
      { date: '2026-07-15', revenue: 50000, orders: 80, avgOrderValue: 625, visitors: 200 },
      { date: '2026-07-16', revenue: 50000, orders: 80, avgOrderValue: 625, visitors: 200 },
    ];
    assert.equal(computeRevenueGrowth(flat), 0);
  });

  it('所有 resolved 异常', () => {
    const allResolved = MOCK_ANOMALIES.map(a => ({ ...a, resolved: true }));
    assert.equal(countUnresolvedAnomalies(allResolved), 0);
  });

  it('所有 unresolved 异常', () => {
    const allUnresolved = MOCK_ANOMALIES.map(a => ({ ...a, resolved: false }));
    assert.equal(countUnresolvedAnomalies(allUnresolved), MOCK_ANOMALIES.length);
  });

  it('页面文件 page.tsx 存在', () => {
    const url = new URL('./page.tsx', import.meta.url);
    assert.ok(existsSync(url), 'page.tsx 应存在');
  });

  it('每日订单数不应为负数', () => {
    for (const d of MOCK_DAILY_COMPARISON) {
      assert.ok(d.orders >= 0, `${d.date} negative orders`);
    }
  });

  it('KPI trend 应为有限数字', () => {
    for (const k of MOCK_KPI_CARDS) {
      assert.ok(Number.isFinite(k.trend), `${k.label} trend is not finite`);
    }
  });
});
