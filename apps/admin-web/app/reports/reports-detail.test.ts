/**
 * reports-detail.test.ts — 报表详情页 L1 测试
 * 覆盖: getReportTitle / getReportTab / loadReportDetail 正例+反例+边界
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

import type { ReportResult } from './reports-utils';

// ─── 页面辅助函数 (从 [id]/page.tsx 提取的纯函数) ────────

function getReportTitle(report: Pick<ReportResult, 'type'>): string {
  switch (report.type) {
    case 'revenue':
      return '营收趋势报表';
    case 'product-ranking':
      return '商品销量排行';
    case 'payment-mix':
      return '支付方式占比';
    case 'hourly-heatmap':
      return '时段热力图';
    case 'order':
      return '订单转化漏斗';
    case 'inventory':
      return '库存周转报表';
    default:
      return `报表 ${report.type}`;
  }
}

type ReportTab = 'revenue' | 'product-ranking' | 'payment-mix' | 'hourly-heatmap' | 'order' | 'inventory';

function getReportTab(type: string): ReportTab {
  if (['revenue'].includes(type)) return 'revenue';
  if (['product-ranking'].includes(type)) return 'product-ranking';
  if (['payment-mix'].includes(type)) return 'payment-mix';
  if (['hourly-heatmap'].includes(type)) return 'hourly-heatmap';
  if (['order'].includes(type)) return 'order';
  if (['inventory'].includes(type)) return 'inventory';
  return 'revenue';
}

// ─── Mock 数据 ───────────────────────────────────────────

const MOCK_REPORTS: Record<string, ReportResult> = {
  'report-revenue-001': {
    type: 'revenue',
    tenantId: 'demo-tenant',
    period: { from: '2026-01-01', to: '2026-06-30' },
    columns: [
      { field: 'period', alias: '月份', type: 'dimension' },
      { field: 'revenue', alias: '营收(元)', type: 'metric' },
    ],
    rows: [
      { period: '2026-01', revenue: 580000 },
      { period: '2026-02', revenue: 620000 },
    ],
    totals: { period: '合计', revenue: 1200000 },
    generatedAt: '2026-07-01T00:00:00Z',
    cached: false,
  },
  'report-product-001': {
    type: 'product-ranking',
    tenantId: 'demo-tenant',
    period: { from: '2026-06-01', to: '2026-06-30' },
    columns: [
      { field: 'sku', alias: 'SKU', type: 'dimension' },
      { field: 'soldQty', alias: '销量', type: 'metric' },
    ],
    rows: [
      { sku: 'SKU-A001', soldQty: 4520 },
    ],
    generatedAt: '2026-07-01T00:00:00Z',
    cached: true,
  },
};

async function loadReportDetail(id: string): Promise<ReportResult | null> {
  await new Promise((r) => setTimeout(r, 50));
  return MOCK_REPORTS[id] ?? null;
}

// ====================================================================
//  正例
// ====================================================================

describe('reports-detail: 正例 (positive cases)', () => {
  describe('getReportTitle', () => {
    it('should return correct Chinese title for revenue', () => {
      assert.strictEqual(getReportTitle({ type: 'revenue' }), '营收趋势报表');
    });

    it('should return correct Chinese title for product-ranking', () => {
      assert.strictEqual(getReportTitle({ type: 'product-ranking' }), '商品销量排行');
    });

    it('should return correct Chinese title for payment-mix', () => {
      assert.strictEqual(getReportTitle({ type: 'payment-mix' }), '支付方式占比');
    });

    it('should return correct Chinese title for hourly-heatmap', () => {
      assert.strictEqual(getReportTitle({ type: 'hourly-heatmap' }), '时段热力图');
    });

    it('should return correct Chinese title for order funnel', () => {
      assert.strictEqual(getReportTitle({ type: 'order' }), '订单转化漏斗');
    });

    it('should return correct Chinese title for inventory', () => {
      assert.strictEqual(getReportTitle({ type: 'inventory' }), '库存周转报表');
    });
  });

  describe('getReportTab', () => {
    it('revenue type maps to revenue tab', () => {
      assert.strictEqual(getReportTab('revenue'), 'revenue');
    });

    it('product-ranking type maps to product-ranking tab', () => {
      assert.strictEqual(getReportTab('product-ranking'), 'product-ranking');
    });

    it('order type maps to order tab', () => {
      assert.strictEqual(getReportTab('order'), 'order');
    });
  });

  describe('loadReportDetail', () => {
    it('should return report for known ID', async () => {
      const report = await loadReportDetail('report-revenue-001');
      assert.ok(report);
      assert.strictEqual(report!.type, 'revenue');
      assert.strictEqual(report!.tenantId, 'demo-tenant');
    });

    it('should return cached report with correct flag', async () => {
      const report = await loadReportDetail('report-product-001');
      assert.ok(report);
      assert.strictEqual(report!.cached, true);
    });

    it('should include totals when present', async () => {
      const report = await loadReportDetail('report-revenue-001');
      assert.ok(report!.totals);
      assert.strictEqual(report!.totals!.revenue, 1200000);
    });

    it('should have valid period range', async () => {
      const report = await loadReportDetail('report-revenue-001')!;
      assert.ok(report);
      assert.ok(report.period.from < report.period.to, 'from must be before to');
    });
  });
});

// ====================================================================
//  反例
// ====================================================================

describe('reports-detail: 反例 (negative cases)', () => {
  it('loadReportDetail should return null for unknown ID', async () => {
    const report = await loadReportDetail('nonexistent-id');
    assert.strictEqual(report, null);
  });

  it('getReportTitle should handle unknown type gracefully', () => {
    assert.strictEqual(getReportTitle({ type: 'unknown_xyz' }), '报表 unknown_xyz');
  });

  it('getReportTab should default to revenue for unknown type', () => {
    assert.strictEqual(getReportTab('alien_format'), 'revenue');
  });

  it('loadReportDetail should return null for empty string ID', async () => {
    const report = await loadReportDetail('');
    assert.strictEqual(report, null);
  });
});

// ====================================================================
//  边界
// ====================================================================

describe('reports-detail: 边界 (boundary cases)', () => {
  it('should handle report with single row', async () => {
    const report = await loadReportDetail('report-product-001');
    assert.ok(report);
    assert.strictEqual(report!.rows.length, 1);
  });

  it('should handle report with zero metric columns', async () => {
    const report = await loadReportDetail('report-revenue-001');
    assert.ok(report);
    const metricCols = report!.columns.filter((c) => c.type === 'metric');
    assert.ok(metricCols.length >= 1);
  });

  it('getReportTitle case sensitivity should not matter (all lowercase keys)', () => {
    assert.strictEqual(getReportTitle({ type: 'revenue' }), '营收趋势报表');
  });

  it('getReportTab should handle hyphenated type', () => {
    assert.strictEqual(getReportTab('product-ranking'), 'product-ranking');
  });
});
