/**
 * KpiSummaryCard.test.tsx — KpiSummaryCard 组件冒烟测试
 * 覆盖: 正例(渲染标题/指标/KPI项目) + 反例(防御) + 边界(空items/单列)
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { KpiSummaryCard } = require('./KpiSummaryCard');

/* ── 辅助: 检查是否渲染了测试标记 ── */

function hasTestId(html: string, id: string): boolean {
  return html.includes(`data-testid="${id}"`);
}

/* ── 正例: 基本渲染 ── */

describe('KpiSummaryCard', () => {
  test('renders title and KPI items', () => {
    const items = [
      { label: '营收', value: '¥12,345' },
      { label: '单量', value: 156 },
      { label: '客单价', value: '¥79.13' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(KpiSummaryCard, { title: '今日概览', items })
    );
    assert.match(html, /今日概览/);
    assert.match(html, /营收/);
    assert.match(html, /¥12,345/);
    assert.match(html, /单量/);
    assert.match(html, /156/);
    assert.match(html, /客单价/);
    assert.match(html, /¥79.13/);
    assert.equal(hasTestId(html, 'kpi-summary-card'), true);
  });

  test('renders trend indicators', () => {
    const items = [
      { label: '增长', value: 100, trend: { value: '+12.5%', positive: true } },
      { label: '下降', value: 50, trend: { value: '-8.3%', positive: false } },
    ];
    const html = renderToStaticMarkup(
      React.createElement(KpiSummaryCard, { title: '趋势', items })
    );
    assert.match(html, /增长/);
    assert.match(html, /下降/);
    assert.match(html, /12\.5%/);
    assert.match(html, /8\.3%/);
    assert.match(html, /\u2191/); // up arrow
    assert.match(html, /\u2193/); // down arrow
  });

  test('renders with helper text', () => {
    const items = [
      { label: '活跃用户', value: 892, helper: '较昨日 +23' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(KpiSummaryCard, { title: '用户', items })
    );
    assert.match(html, /活跃用户/);
    assert.match(html, /892/);
    assert.match(html, /较昨日 \+23/);
  });

  test('renders variant cards (success/warning)', () => {
    const items = [
      { label: '正常', value: 95, variant: 'success' as const },
      { label: '警告', value: 5, variant: 'warning' as const },
    ];
    const html = renderToStaticMarkup(
      React.createElement(KpiSummaryCard, { title: '状态', items })
    );
    assert.match(html, /正常/);
    assert.match(html, /警告/);
  });

  /* ── 边界: 空数组 / 单列 / 紧凑模式 ── */

  test('handles empty items gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(KpiSummaryCard, { title: '无数据', items: [] })
    );
    assert.match(html, /无数据/);
    // 不出现 NaN/undefined 文本
    assert.doesNotMatch(html, /NaN/);
    assert.doesNotMatch(html, /undefined/);
  });

  test('renders with 1 column layout', () => {
    const items = [
      { label: '单指标', value: '99.9%' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(KpiSummaryCard, { title: '单列', items, columns: 1 })
    );
    assert.match(html, /单指标/);
    assert.match(html, /99\.9%/);
  });

  test('renders with compact mode', () => {
    const items = [
      { label: '紧凑', value: 'A' },
      { label: '模式', value: 'B' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(KpiSummaryCard, { title: '紧凑测试', items, compact: true })
    );
    assert.match(html, /紧凑测试/);
    assert.match(html, /紧凑/);
    assert.match(html, /模式/);
  });

  /* ── 反例: 防御 ── */

  test('clamps columns out of range', () => {
    const items = [
      { label: 'A', value: 1 },
      { label: 'B', value: 2 },
      { label: 'C', value: 3 },
      { label: 'D', value: 4 },
      { label: 'E', value: 5 },
    ];
    // 传递 columns=6 应被 clamp 到 4
    const html = renderToStaticMarkup(
      React.createElement(KpiSummaryCard, { title: '溢出', items, columns: 6 as any })
    );
    assert.match(html, /A/);
    assert.match(html, /E/);
  });

  test('renders with negative columns (defaults to 1)', () => {
    const items = [
      { label: '保护', value: 'ok' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(KpiSummaryCard, { title: '防御', items, columns: -1 as any })
    );
    assert.match(html, /保护/);
    assert.match(html, /ok/);
  });

  test('renders with large number of items', () => {
    const items = Array.from({ length: 9 }, (_, i) => ({
      label: `指标${i + 1}`,
      value: (i + 1) * 100,
    }));
    const html = renderToStaticMarkup(
      React.createElement(KpiSummaryCard, { title: '大量', items })
    );
    for (let i = 0; i < 9; i++) {
      assert.match(html, new RegExp(`指标${i + 1}`));
    }
  });

  test('renders with default export', () => {
    const mod = require('./KpiSummaryCard');
    assert.equal(typeof mod.KpiSummaryCard, 'function');
    assert.equal(typeof mod.default, 'function');
  });
});
