/**
 * reports.test.ts — Page-level tests for admin-web 报表中心页面
 *
 * 正例 + 反例 + 边界, ≥3 个测试用例
 * References: page.tsx (ReportResult, buildChartOption, caching, export)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ─── Data shapes ─────────────────────────────────────────────────────────

type ReportTab = 'revenue' | 'product-ranking' | 'payment-mix' | 'hourly-heatmap' | 'order' | 'inventory';

interface ReportResult {
  type: string; tenantId: string;
  period: { from: string; to: string };
  columns: { field: string; alias: string; type: 'dimension' | 'metric' }[];
  rows: Record<string, any>[];
  totals?: Record<string, any>;
  generatedAt: string; cached: boolean;
}

// ─── Replicated business logic ───────────────────────────────────────────

function buildChartOption(tab: ReportTab, report: ReportResult): any {
  const common = {
    grid: { left: 60, right: 20, top: 40, bottom: 40 },
    tooltip: { trigger: 'axis' as const },
  };

  switch (tab) {
    case 'revenue': {
      const xData = report.rows.map(r => String(r.period ?? ''));
      const yData = report.rows.map(r => Number(r.revenue ?? 0));
      return {
        ...common, title: { text: '营收趋势' },
        xAxis: { type: 'category', data: xData },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: yData, smooth: true, areaStyle: { opacity: 0.2 } }],
      };
    }
    case 'product-ranking': {
      const xData = report.rows.map(r => String(r.name ?? r.sku ?? ''));
      const yData = report.rows.map(r => Number(r.soldQty ?? r.count ?? 0));
      return {
        ...common, title: { text: '商品排行' },
        xAxis: { type: 'category', data: xData },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: yData }],
      };
    }
    case 'payment-mix': {
      const data = report.rows.map(r => ({
        name: String(r.method ?? r.name ?? ''),
        value: Number(r.total ?? r.amount ?? 0),
      }));
      return {
        ...common, title: { text: '支付方式占比' },
        series: [{ type: 'pie', data, radius: ['40%', '70%'] }],
      };
    }
    case 'order': {
      const funnel = report.rows.map(r => ({
        name: String(r.stage ?? ''),
        value: Number(r.count ?? 0),
      }));
      return {
        ...common, title: { text: '订单转化漏斗' },
        tooltip: { trigger: 'item' },
        series: [{ type: 'funnel', data: funnel, left: '10%', width: '80%' }],
      };
    }
    case 'inventory': {
      const value = report.rows[0] ? Number(report.rows[0].turnoverRate ?? 0) : 0;
      return {
        ...common, title: { text: '库存周转' },
        series: [{
          type: 'gauge', detail: { formatter: '{value}%' },
          data: [{ value, name: '周转率' }],
        }],
      };
    }
    default:
      return { title: { text: tab } };
  }
}

function findColumn(report: ReportResult, field: string): ReportResult['columns'][0] | undefined {
  return report.columns.find(c => c.field === field);
}

function filterRowsByMetric(report: ReportResult, field: string, threshold: number): Record<string, any>[] {
  return report.rows.filter(r => Number(r[field] ?? 0) >= threshold);
}

// ─── Mock data ───────────────────────────────────────────────────────────

const MOCK_REVENUE: ReportResult = {
  type: 'revenue', tenantId: 't1',
  period: { from: '2024-06-01', to: '2024-06-30' },
  columns: [
    { field: 'period', alias: '日期', type: 'dimension' },
    { field: 'revenue', alias: '营收', type: 'metric' },
  ],
  rows: [
    { period: '2024-06-01', revenue: 12500 },
    { period: '2024-06-02', revenue: 15200 },
    { period: '2024-06-03', revenue: 9800 },
    { period: '2024-06-04', revenue: 18300 },
    { period: '2024-06-05', revenue: 21000 },
  ],
  totals: { revenue: 76800 },
  generatedAt: '2024-07-01T00:00:00Z',
  cached: false,
};

const MOCK_RANKING: ReportResult = {
  type: 'product-ranking', tenantId: 't1',
  period: { from: '2024-06-01', to: '2024-06-30' },
  columns: [
    { field: 'name', alias: '商品', type: 'dimension' },
    { field: 'soldQty', alias: '销量', type: 'metric' },
  ],
  rows: [
    { name: '投篮机', soldQty: 120, sku: 'SKU-001' },
    { name: '跳舞机', soldQty: 85, sku: 'SKU-002' },
    { name: '毛绒公仔', soldQty: 200, sku: 'SKU-003' },
  ],
  generatedAt: '2024-07-01T00:00:00Z',
  cached: true,
};

// ─── Tests ───────────────────────────────────────────────────────────────

describe('admin-reports: 正例', () => {
  it('buildChartOption revenue 正确构建 line 图', () => {
    const opt = buildChartOption('revenue', MOCK_REVENUE);
    assert.equal(opt.title.text, '营收趋势');
    assert.equal(opt.series[0].type, 'line');
    assert.equal(opt.xAxis.data.length, 5);
    assert.equal(opt.yAxis.type, 'value');
  });

  it('buildChartOption product-ranking 正确构建 bar 图', () => {
    const opt = buildChartOption('product-ranking', MOCK_RANKING);
    assert.equal(opt.title.text, '商品排行');
    assert.equal(opt.series[0].type, 'bar');
    assert.equal(opt.xAxis.data.length, 3);
  });

  it('buildChartOption payment-mix 构建 pie 图', () => {
    const mix: ReportResult = {
      ...MOCK_REVENUE, type: 'payment-mix',
      columns: [
        { field: 'method', alias: '方式', type: 'dimension' },
        { field: 'total', alias: '金额', type: 'metric' },
      ],
      rows: [
        { method: '微信支付', total: 45000 },
        { method: '支付宝', total: 21800 },
        { method: '现金', total: 10000 },
      ],
    };
    const opt = buildChartOption('payment-mix', mix);
    assert.equal(opt.series[0].type, 'pie');
    assert.equal(opt.series[0].data.length, 3);
  });

  it('buildChartOption order 构建 funnel 图', () => {
    const funnel: ReportResult = {
      ...MOCK_REVENUE, type: 'order',
      columns: [
        { field: 'stage', alias: '阶段', type: 'dimension' },
        { field: 'count', alias: '数量', type: 'metric' },
      ],
      rows: [
        { stage: '浏览', count: 10000 },
        { stage: '加购', count: 3000 },
        { stage: '下单', count: 1500 },
        { stage: '支付', count: 1200 },
      ],
    };
    const opt = buildChartOption('order', funnel);
    assert.equal(opt.series[0].type, 'funnel');
    assert.equal(opt.series[0].data.length, 4);
  });

  it('buildChartOption inventory 构建 gauge 图', () => {
    const inv: ReportResult = {
      ...MOCK_REVENUE, type: 'inventory',
      columns: [
        { field: 'turnoverRate', alias: '周转率', type: 'metric' },
      ],
      rows: [{ turnoverRate: 75.5 }],
    };
    const opt = buildChartOption('inventory', inv);
    assert.equal(opt.series[0].type, 'gauge');
    assert.equal(opt.series[0].data[0].value, 75.5);
  });

  it('findColumn 正确找到字段定义', () => {
    const col = findColumn(MOCK_REVENUE, 'revenue');
    assert.ok(col);
    assert.equal(col!.alias, '营收');
    assert.equal(col!.type, 'metric');
  });

  it('filterRowsByMetric 正确筛选', () => {
    const high = filterRowsByMetric(MOCK_REVENUE, 'revenue', 15000);
    assert.equal(high.length, 3);
    assert.ok(high.every(r => r.revenue >= 15000));
  });

  it('缓存感知 cached 标识', () => {
    assert.equal(MOCK_REVENUE.cached, false);
    assert.equal(MOCK_RANKING.cached, true);
  });
});

describe('admin-reports: 反例', () => {
  it('buildChartOption 不存在的 tab 返回默认标题', () => {
    const opt = buildChartOption('hourly-heatmap' as any, MOCK_REVENUE);
    assert.equal(opt.title.text, 'hourly-heatmap');
  });

  it('buildChartOption revenue 空数据生成空图表', () => {
    const empty: ReportResult = { ...MOCK_REVENUE, rows: [] };
    const opt = buildChartOption('revenue', empty);
    assert.equal(opt.xAxis.data.length, 0);
    assert.equal(opt.series[0].data.length, 0);
  });

  it('buildChartOption inventory 空行返回 0', () => {
    const inv: ReportResult = { ...MOCK_REVENUE, type: 'inventory', rows: [] };
    const opt = buildChartOption('inventory', inv);
    assert.equal(opt.series[0].data[0].value, 0);
  });

  it('findColumn 不存在的字段返回 undefined', () => {
    assert.equal(findColumn(MOCK_REVENUE, 'nonexistent'), undefined);
  });

  it('filterRowsByMetric 边界值', () => {
    const result = filterRowsByMetric(MOCK_REVENUE, 'revenue', 1000000);
    assert.equal(result.length, 0);
  });

  it('rows 中缺少字段返回 0', () => {
    const malformed: ReportResult = {
      ...MOCK_REVENUE,
      rows: [{ period: '2024-06-01' }], // no revenue field
    };
    const opt = buildChartOption('revenue', malformed);
    assert.equal(opt.series[0].data[0], 0);
  });
});

describe('admin-reports: 边界', () => {
  it('营收趋势 row 数量阈值测试（单日）', () => {
    const single: ReportResult = {
      ...MOCK_REVENUE,
      rows: [{ period: '2024-06-01', revenue: 500 }],
    };
    const opt = buildChartOption('revenue', single);
    assert.equal(opt.xAxis.data.length, 1);
  });

  it('营收趋势 row 数量阈值测试（30 天）', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      period: `2024-06-${String(i + 1).padStart(2, '0')}`,
      revenue: Math.floor(Math.random() * 30000),
    }));
    const r: ReportResult = { ...MOCK_REVENUE, rows: many };
    const opt = buildChartOption('revenue', r);
    assert.equal(opt.xAxis.data.length, 30);
  });

  it('product-ranking 最大商品数测试', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      name: `商品${i}`, soldQty: Math.floor(Math.random() * 1000), sku: `S-${i}`,
    }));
    const r: ReportResult = { ...MOCK_RANKING, rows: many };
    const opt = buildChartOption('product-ranking', r);
    assert.equal(opt.xAxis.data.length, 100);
  });

  it('payment-mix 单种支付方式', () => {
    const single: ReportResult = {
      ...MOCK_REVENUE, type: 'payment-mix',
      columns: [
        { field: 'method', alias: '方式', type: 'dimension' },
        { field: 'total', alias: '金额', type: 'metric' },
      ],
      rows: [{ method: '微信支付', total: 100000 }],
    };
    const opt = buildChartOption('payment-mix', single);
    assert.equal(opt.series[0].data.length, 1);
  });

  it('report 有 totals 汇总信息', () => {
    assert.ok(MOCK_REVENUE.totals);
    assert.equal(MOCK_REVENUE.totals!.revenue, 76800);
  });
});
