/**
 * reports/page.test.tsx — 报表中心页面 L1 冒烟测试
 * ⚡ 覆盖: buildChartOption 6 种图表 / 正例+反例+边界
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

import { buildChartOption } from './reports-utils';
import type { ReportResult, ReportTab } from './reports-utils';

// ─── Mock ReportResult Factory ───────────────────────────

function makeReport(overrides?: Partial<ReportResult>): ReportResult {
  return {
    type: 'revenue',
    tenantId: 'demo-tenant',
    period: { from: '2024-06-01', to: '2024-06-30' },
    columns: [
      { field: 'period', alias: '日期', type: 'dimension' },
      { field: 'revenue', alias: '营收', type: 'metric' },
    ],
    rows: [
      { period: '2024-06-01', revenue: 500000 },
      { period: '2024-06-02', revenue: 620000 },
      { period: '2024-06-03', revenue: 480000 },
    ],
    generatedAt: '2024-07-01T00:00:00Z',
    cached: false,
    totals: { period: '合计', revenue: 1600000 },
    ...overrides,
  };
}

// ====================================================================
//  正例
// ====================================================================

describe('reports-page: 正例 — buildChartOption', () => {
  it('revenue tab should return line chart with correct xAxis/yAxis', () => {
    const report = makeReport();
    const opt = buildChartOption('revenue', report);

    assert.equal(opt.title?.text, '营收趋势');
    assert.equal(opt.series?.[0]?.type, 'line');
    assert.equal(opt.series?.[0]?.name, '营收');
    assert.deepEqual(opt.xAxis?.data, ['2024-06-01', '2024-06-02', '2024-06-03']);
    assert.deepEqual(opt.yAxis?.data, undefined);
    assert.equal(opt.tooltip?.trigger, 'axis');
  });

  it('revenue series data should match report row revenue values', () => {
    const report = makeReport();
    const opt = buildChartOption('revenue', report);
    assert.deepEqual(opt.series?.[0]?.data, [500000, 620000, 480000]);
  });

  it('product-ranking tab should return bar chart', () => {
    const report = makeReport({
      type: 'product-ranking',
      columns: [
        { field: 'name', alias: '商品', type: 'dimension' },
        { field: 'soldQty', alias: '销量', type: 'metric' },
      ],
      rows: [
        { name: '商品A', soldQty: 1200 },
        { name: '商品B', soldQty: 980 },
        { name: '商品C', soldQty: 760 },
      ],
    });
    const opt = buildChartOption('product-ranking', report);

    assert.equal(opt.title?.text, '商品 Top N 排行');
    assert.equal(opt.series?.[0]?.type, 'bar');
    assert.equal(opt.series?.[0]?.name, '销量');
    assert.deepEqual(opt.xAxis?.data, ['商品A', '商品B', '商品C']);
    assert.deepEqual(opt.series?.[0]?.data, [1200, 980, 760]);
  });

  it('product-ranking should fallback to sku field when name is missing', () => {
    const report = makeReport({
      type: 'product-ranking',
      columns: [
        { field: 'sku', alias: 'SKU', type: 'dimension' },
        { field: 'count', alias: '数量', type: 'metric' },
      ],
      rows: [
        { sku: 'SKU-001', count: 55 },
        { sku: 'SKU-002', count: 42 },
      ],
    });
    const opt = buildChartOption('product-ranking', report);
    assert.deepEqual(opt.xAxis?.data, ['SKU-001', 'SKU-002']);
    assert.deepEqual(opt.series?.[0]?.data, [55, 42]);
  });

  it('payment-mix tab should return pie chart', () => {
    const report = makeReport({
      type: 'payment-mix',
      columns: [
        { field: 'method', alias: '方式', type: 'dimension' },
        { field: 'amount', alias: '金额', type: 'metric' },
      ],
      rows: [
        { method: '微信支付', amount: 800000 },
        { method: '支付宝', amount: 600000 },
        { method: '银联', amount: 200000 },
      ],
    });
    const opt = buildChartOption('payment-mix', report);

    assert.equal(opt.title?.text, '支付方式占比');
    assert.equal(opt.series?.[0]?.type, 'pie');
    assert.equal(opt.series?.[0]?.data?.length, 3);
    assert.equal(opt.series?.[0]?.data?.[0]?.name, '微信支付');
    assert.equal(opt.series?.[0]?.data?.[0]?.value, 800000);
  });

  it('payment-mix should fallback to amountCents field', () => {
    const report = makeReport({
      type: 'payment-mix',
      columns: [
        { field: 'method', alias: '方式', type: 'dimension' },
        { field: 'amountCents', alias: '金额分', type: 'metric' },
      ],
      rows: [
        { method: '现金', amountCents: 100000 },
      ],
    });
    const opt = buildChartOption('payment-mix', report);
    assert.equal(opt.series?.[0]?.data?.[0]?.value, 100000);
  });

  it('hourly-heatmap tab should return heatmap chart with 7×24 data', () => {
    const report = makeReport({ type: 'hourly-heatmap', rows: [] });
    const opt = buildChartOption('hourly-heatmap', report);

    assert.equal(opt.title?.text, '时段热力图');
    assert.equal(opt.series?.[0]?.type, 'heatmap');
    assert.equal(opt.xAxis?.type, 'category');
    assert.equal(opt.xAxis?.data?.length, 24);
    assert.equal(opt.yAxis?.data?.length, 7);
    assert.equal(opt.series?.[0]?.data?.length, 24 * 7);
    assert.ok(opt.visualMap, 'heatmap should have visualMap');
  });

  it('order tab should return funnel chart', () => {
    const report = makeReport({
      type: 'order',
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
    });
    const opt = buildChartOption('order', report);

    assert.equal(opt.title?.text, '订单转化漏斗');
    assert.equal(opt.series?.[0]?.type, 'funnel');
    assert.equal(opt.series?.[0]?.data?.length, 4);
    assert.equal(opt.series?.[0]?.data?.[0]?.name, '浏览');
    assert.equal(opt.series?.[0]?.data?.[0]?.value, 10000);
    assert.equal(opt.series?.[0]?.data?.[3]?.name, '支付');
    assert.equal(opt.series?.[0]?.data?.[3]?.value, 1200);
  });

  it('inventory tab should return gauge chart', () => {
    const report = makeReport({
      type: 'inventory',
      columns: [{ field: 'turnoverRate', alias: '周转率', type: 'metric' }],
      rows: [{ turnoverRate: 0.85 }],
    });
    const opt = buildChartOption('inventory', report);

    assert.equal(opt.title?.text, '库存周转率');
    assert.equal(opt.series?.[0]?.type, 'gauge');
    assert.ok(opt.series?.[0]?.data?.[0]?.value, 'gauge should have a value');
  });
});

// ====================================================================
//  反例
// ====================================================================

describe('reports-page: 反例 — buildChartOption', () => {
  it('revenue with empty rows should produce empty line chart', () => {
    const report = makeReport({ rows: [] });
    const opt = buildChartOption('revenue', report);

    assert.equal(opt.title?.text, '营收趋势');
    assert.deepEqual(opt.series?.[0]?.data, []);
    assert.deepEqual(opt.xAxis?.data, []);
  });

  it('product-ranking with empty rows should produce empty bar chart', () => {
    const report = makeReport({
      type: 'product-ranking',
      rows: [],
      columns: [
        { field: 'name', alias: '商品', type: 'dimension' },
        { field: 'soldQty', alias: '销量', type: 'metric' },
      ],
    });
    const opt = buildChartOption('product-ranking', report);

    assert.equal(opt.series?.[0]?.type, 'bar');
    assert.deepEqual(opt.series?.[0]?.data, []);
    assert.deepEqual(opt.xAxis?.data, []);
  });

  it('payment-mix with empty rows should return empty pie data', () => {
    const report = makeReport({
      type: 'payment-mix',
      rows: [],
      columns: [
        { field: 'method', alias: '方式', type: 'dimension' },
        { field: 'amount', alias: '金额', type: 'metric' },
      ],
    });
    const opt = buildChartOption('payment-mix', report);

    assert.equal(opt.series?.[0]?.type, 'pie');
    assert.equal(opt.series?.[0]?.data?.length, 0);
  });

  it('inventory with empty rows should default gauge value to 0', () => {
    const report = makeReport({
      type: 'inventory',
      rows: [],
      columns: [{ field: 'turnoverRate', alias: '周转率', type: 'metric' }],
    });
    const opt = buildChartOption('inventory', report);

    assert.equal(opt.series?.[0]?.type, 'gauge');
    assert.ok(
      opt.series?.[0]?.data?.[0]?.value !== undefined,
      'gauge should still have value even with empty rows'
    );
  });

  it('inventory with rows missing turnoverRate should default to 0', () => {
    const report = makeReport({ type: 'inventory', rows: [{}] });
    const opt = buildChartOption('inventory', report);

    const val = Number(opt.series?.[0]?.data?.[0]?.value ?? '');
    assert.equal(val, 0);
  });

  it('revenue with missing revenue field in row should produce NaN-free data', () => {
    const report = makeReport({
      rows: [{ period: '2024-06-01' }, { period: '2024-06-02', revenue: undefined }],
    });
    const opt = buildChartOption('revenue', report);

    const data = opt.series?.[0]?.data ?? [];
    for (const d of data) {
      assert.equal(typeof d, 'number', `revenue data point should be number, got ${typeof d}`);
      assert.ok(!Number.isNaN(d), 'revenue data point should not be NaN');
    }
  });

  it('unknown report tab should return default fallback option', () => {
    const report = makeReport();
    const opt = buildChartOption('unknown-report-tab' as ReportTab, report);

    assert.equal(opt.title?.text, '未知报表');
    assert.equal(opt.series, undefined);
  });
});

// ====================================================================
//  边界
// ====================================================================

describe('reports-page: 边界 — buildChartOption', () => {
  it('revenue with single data row should still produce valid chart', () => {
    const report = makeReport({
      rows: [{ period: '2024-06-01', revenue: 100000 }],
    });
    const opt = buildChartOption('revenue', report);

    assert.equal(opt.xAxis?.data?.length, 1);
    assert.equal(opt.series?.[0]?.data?.length, 1);
    assert.equal(opt.series?.[0]?.data?.[0], 100000);
  });

  it('revenue with very large numbers should not truncate', () => {
    const report = makeReport({
      rows: [{ period: '2024-06-01', revenue: 999999999999 }],
    });
    const opt = buildChartOption('revenue', report);

    assert.equal(opt.series?.[0]?.data?.[0], 999999999999);
  });

  it('revenue with zero revenue should render zero', () => {
    const report = makeReport({
      rows: [{ period: '2024-06-01', revenue: 0 }],
    });
    const opt = buildChartOption('revenue', report);

    assert.equal(opt.series?.[0]?.data?.[0], 0);
  });

  it('revenue with negative revenue should handle negative values', () => {
    const report = makeReport({
      rows: [{ period: '2024-06-01', revenue: -50000 }],
    });
    const opt = buildChartOption('revenue', report);

    assert.equal(opt.series?.[0]?.data?.[0], -50000);
  });

  it('all charts should have tooltip and grid configured', () => {
    const tabs: ReportTab[] = ['revenue', 'product-ranking', 'payment-mix', 'hourly-heatmap', 'order', 'inventory'];
    const report = makeReport({
      rows: [{ period: '2024-06-01', revenue: 100 }],
    });

    for (const tab of tabs) {
      const opt = buildChartOption(tab, report);
      if (['revenue', 'product-ranking'].includes(tab)) {
        assert.ok(opt.tooltip, `${tab} should have tooltip`);
        assert.ok(opt.grid, `${tab} should have grid`);
      }
    }
  });

  it('revenue should have smooth line and areaStyle (visual polish)', () => {
    const report = makeReport();
    const opt = buildChartOption('revenue', report);

    assert.equal(opt.series?.[0]?.smooth, true, 'revenue chart should be smooth');
    assert.ok(opt.series?.[0]?.areaStyle, 'revenue chart should have areaStyle');
  });

  it('inventory gauge should have progress bar and pointer configured', () => {
    const report = makeReport({
      type: 'inventory',
      rows: [{ turnoverRate: 0.75 }],
    });
    const opt = buildChartOption('inventory', report);

    assert.ok(opt.series?.[0]?.progress, 'gauge should have progress');
    assert.equal(opt.series?.[0]?.anchor?.show, true, 'gauge should have visible anchor');
    assert.equal(opt.series?.[0]?.pointer?.width, 5, 'gauge pointer width should be 5');
  });

  it('payment-mix should have legend at bottom', () => {
    const report = makeReport({
      type: 'payment-mix',
      rows: [{ method: '微信支付', amount: 100 }],
    });
    const opt = buildChartOption('payment-mix', report);

    assert.equal(opt.legend?.bottom, 10);
  });

  it('hourly-heatmap should have correct day labels', () => {
    const report = makeReport({ type: 'hourly-heatmap', rows: [] });
    const opt = buildChartOption('hourly-heatmap', report);

    assert.deepEqual(opt.yAxis?.data, ['周一', '周二', '周三', '周四', '周五', '周六', '周日']);
  });

  it('product-ranking should rotate x-axis labels at 30° for readability', () => {
    const report = makeReport({
      type: 'product-ranking',
      columns: [
        { field: 'name', alias: '商品', type: 'dimension' },
        { field: 'soldQty', alias: '销量', type: 'metric' },
      ],
      rows: [{ name: '超长商品名称', soldQty: 100 }],
    });
    const opt = buildChartOption('product-ranking', report);

    assert.equal(opt.xAxis?.axisLabel?.rotate, 30);
  });
});
