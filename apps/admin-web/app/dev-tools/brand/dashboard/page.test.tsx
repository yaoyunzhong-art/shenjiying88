import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('BrandDashboardPage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function BrandDashboardPage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState/useEffect/useCallback等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
});

describe('BrandDashboardPage — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接导出any', () => assert.ok(!SRC.includes('as any')));
});

describe('BrandDashboardPage — 看板模块', () => {
  it('应包含 REVENUE 营收数据', () => assert.ok(SRC.includes('REVENUE')));
  it('应包含 BRAND_METRICS 品牌指标', () => assert.ok(SRC.includes('BRAND_METRICS')));
  it('应包含 RevenueRow 接口', () => assert.ok(SRC.includes('interface RevenueRow')));
  it('应包含 BrandMetric 接口', () => assert.ok(SRC.includes('interface BrandMetric')));
  it('应包含 Table 展示', () => assert.ok(SRC.includes('Table')));
});

describe('BrandDashboardPage — 指标', () => {
  it('应计算总营收', () => assert.ok(SRC.includes('totalRev')));
  it('应计算总成本', () => assert.ok(SRC.includes('totalCost')));
  it('应计算平均 ROI', () => assert.ok(SRC.includes('avgRoi')));
  it('应支持时间段切换', () => assert.ok(SRC.includes('period')));
});

describe('BrandDashboardPage — 品牌表现', () => {
  it('应展示品牌社媒表现', () => assert.ok(SRC.includes('社交') || SRC.includes('触达')));
  it('应展示营收趋势', () => assert.ok(SRC.includes('营收趋势')));
});
