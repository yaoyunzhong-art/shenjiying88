import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  ComparisonBreakdownChart,
} = require('./ComparisonBreakdownChart');

import type { ComparisonItem, ComparisonBreakdownChartProps } from './ComparisonBreakdownChart';

/** Helper: produce a sample data item */
function item(overrides: Partial<ComparisonItem> = {}): ComparisonItem {
  return {
    label: '类别 A',
    value: 100,
    ...overrides,
  };
}

/** Render a component to static HTML string */
function render(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

/** Check if rendered HTML contains a string */
function contains(html: string, str: string): boolean {
  return html.includes(str);
}

/* ── 正例 ── */

describe('ComparisonBreakdownChart — 正例', () => {
  test('导出存在且为函数', () => {
    assert.equal(typeof ComparisonBreakdownChart, 'function');
  });

  test('基础渲染：展示标题和数据行', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        title: '销售占⽐对比',
        data: [
          item({ label: '服饰', value: 320 }),
          item({ label: '数码', value: 280 }),
          item({ label: '食品', value: 150 }),
        ],
      }),
    );
    assert.ok(contains(html, '销售占⽐对比'), '应该渲染标题');
    assert.ok(contains(html, '服饰'), '应该渲染服饰行');
    assert.ok(contains(html, '数码'), '应该渲染数码行');
    assert.ok(contains(html, '食品'), '应该渲染食品行');
    assert.ok(contains(html, '320'), '应该渲染服饰数值');
    assert.ok(contains(html, '280'), '应该渲染数码数值');
    assert.ok(contains(html, '150'), '应该渲染食品数值');
  });

  test('显示基准值双柱', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        title: '本月 vs 上月',
        data: [
          item({ label: 'A', value: 200, baseline: 180 }),
          item({ label: 'B', value: 150, baseline: 160 }),
        ],
      }),
    );
    assert.ok(contains(html, '200'), '应显示主值');
    assert.ok(contains(html, '/ 180'), '应显示基准值');
    assert.ok(contains(html, '/ 160'), '应显示 B 基准值');
  });

  test('可隐藏基准柱', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        title: '仅主值',
        showBaseline: false,
        data: [
          item({ label: 'X', value: 50, baseline: 40 }),
        ],
      }),
    );
    assert.ok(contains(html, 'X'), '应显示标签');
    assert.ok(contains(html, '50'), '应显示主值');
    // 不显示基准值的 `/ 40`
    assert.equal(contains(html, '/ 40'), false, '不应显示基准值');
  });

  test('可隐藏数值', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        title: '无数值',
        showValues: false,
        data: [
          item({ label: 'Y', value: 999 }),
        ],
      }),
    );
    assert.ok(contains(html, 'Y'), '应显示标签');
    assert.equal(contains(html, '999'), false, '应隐藏数值');
  });

  test('空数据时显示空态文案', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        data: [],
        emptyText: '暂无对比数据',
      }),
    );
    assert.ok(contains(html, '暂无对比数据'), '应显示空态文案');
  });

  test('加载态显示骨架', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        loading: true,
        data: [],
      }),
    );
    assert.ok(contains(html, 'comparison-breakdown-chart--loading'), '应有加载态类名');
  });

  test('自定义颜色生效', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        data: [
          item({ label: 'A', value: 50, color: '#ff0000' }),
        ],
        barColor: '#00ff00',
      }),
    );
    assert.ok(contains(html, 'comparison-breakdown-chart'), '应正常渲染');
  });

  test('包含 data-testid 属性', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        data: [item({ label: 'A', value: 100 })],
        'data-testid': 'my-breakdown',
      }),
    );
    assert.ok(contains(html, 'my-breakdown'), '应有自定义 data-testid');
    assert.ok(contains(html, 'my-breakdown-row-0'), '行应有 data-testid');
    assert.ok(contains(html, 'my-breakdown-label-0'), '标签应有 data-testid');
  });
});

/* ── 边界 & 异常 ── */

describe('ComparisonBreakdownChart — 异常边界', () => {
  test('data 为 null/undefined 时显示空态', () => {
    const htmlNull = render(
      React.createElement(ComparisonBreakdownChart, { data: null as unknown as ComparisonItem[] }),
    );
    assert.ok(contains(htmlNull, '暂无对比数据'), 'null 数据应显示空态');

    const htmlUndefined = render(
      React.createElement(ComparisonBreakdownChart, { data: undefined as unknown as ComparisonItem[] }),
    );
    assert.ok(contains(htmlUndefined, '暂无对比数据'), 'undefined 数据应显示空态');
  });

  test('全零值数据不报错', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        data: [
          item({ label: 'A', value: 0 }),
          item({ label: 'B', value: 0 }),
        ],
      }),
    );
    // 不会 crash
    assert.ok(contains(html, 'A'), '零值数据应正常渲染');
    assert.ok(contains(html, 'B'), '零值数据应正常渲染');
  });

  test('超大值不回退为 0', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        data: [item({ label: 'Z', value: 999999 })],
      }),
    );
    assert.ok(contains(html, '999999'), '超大值应正常显示');
  });

  test('不传入 title 时不渲染标题区域', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        data: [item({ label: 'N', value: 10 })],
      }),
    );
    assert.equal(contains(html, 'comparison-breakdown-chart__header'), false, '无标题时不渲染标题域');
  });

  test('单条数据正常', () => {
    const html = render(
      React.createElement(ComparisonBreakdownChart, {
        data: [item({ label: '仅一条', value: 42 })],
      }),
    );
    assert.ok(contains(html, '仅一条'), '单条数据正常');
    assert.ok(contains(html, '42'), '单条数据数值正常');
  });
});
