import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  ScenarioComparisonPanel,
} = require('./ScenarioComparisonPanel');

import type { ScenarioItem, ScenarioComparisonPanelProps } from './ScenarioComparisonPanel';

/** Helper: produce a sample scenario item */
function scenario(overrides: Partial<ScenarioItem> = {}): ScenarioItem {
  return {
    name: '方案 A',
    description: '默认策略方案',
    metrics: [
      { label: '预期收益', value: 85, unit: '万', trend: 'good', delta: 12 },
      { label: '执行成本', value: 40, unit: '万', trend: 'bad', delta: -5 },
    ],
    score: 78,
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

describe('ScenarioComparisonPanel — 正例', () => {
  test('导出存在且为函数', () => {
    assert.equal(typeof ScenarioComparisonPanel, 'function');
  });

  test('基础渲染：展示标题和场景', () => {
    const html = render(
      React.createElement(ScenarioComparisonPanel, {
        title: '营销场景对比',
        scenarios: [
          scenario({ name: '方案 A', score: 82 }),
          scenario({ name: '方案 B', score: 75, recommended: true }),
        ],
      }),
    );
    assert.ok(contains(html, '营销场景对比'));
    assert.ok(contains(html, '方案 A'));
    assert.ok(contains(html, '方案 B'));
    assert.ok(contains(html, '82'));
    assert.ok(contains(html, '75'));
    assert.ok(contains(html, '推荐'));
  });

  test('渲染指标数据', () => {
    const html = render(
      React.createElement(ScenarioComparisonPanel, {
        scenarios: [
          scenario({
            metrics: [
              { label: 'ROI', value: 120, unit: '%', trend: 'good', delta: 15 },
              { label: '风险', value: 30, unit: '%', trend: 'bad' },
            ],
          }),
        ],
      }),
    );
    assert.ok(contains(html, 'ROI'));
    assert.ok(contains(html, '120%'));
    assert.ok(contains(html, '风险'));
    assert.ok(contains(html, '30%'));
  });

  test('显示推荐标记', () => {
    const html = render(
      React.createElement(ScenarioComparisonPanel, {
        scenarios: [
          scenario({ name: '普通方案' }),
          scenario({ name: '推荐方案', recommended: true }),
        ],
      }),
    );
    assert.ok(contains(html, '推荐方案'));
    assert.ok(contains(html, '推荐'));
  });

  test('默认标题', () => {
    const html = render(
      React.createElement(ScenarioComparisonPanel, {
        scenarios: [scenario()],
      }),
    );
    assert.ok(contains(html, '场景对比'));
  });

  test('自定义 data-testid', () => {
    const html = render(
      React.createElement(ScenarioComparisonPanel, {
        scenarios: [scenario()],
        'data-testid': 'my-panel',
      }),
    );
    assert.ok(contains(html, 'data-testid="my-panel"'));
  });
});

/* ── 边界/错误场景 ── */

describe('ScenarioComparisonPanel — 边界/错误场景', () => {
  test('scenarios 为空数组时显示空态', () => {
    const html = render(
      React.createElement(ScenarioComparisonPanel, {
        scenarios: [],
        emptyText: '暂无对比场景',
      }),
    );
    assert.ok(contains(html, '暂无对比场景'));
    assert.ok(contains(html, 'data-testid="scenario-comparison-panel-empty"'));
  });

  test('loading 状态不渲染数据', () => {
    const html = render(
      React.createElement(ScenarioComparisonPanel, {
        loading: true,
        scenarios: [scenario()],
      }),
    );
    assert.ok(contains(html, 'data-testid="scenario-comparison-panel-loading"'));
    assert.ok(!contains(html, '方案 A'));
  });

  test('缺少 description 时不会报错', () => {
    const html = render(
      React.createElement(ScenarioComparisonPanel, {
        scenarios: [scenario({ description: undefined })],
      }),
    );
    // 应该依然能正常渲染
    assert.ok(contains(html, '方案 A'));
  });

  test('缺少 score 时不会显示分数徽标', () => {
    const html = render(
      React.createElement(ScenarioComparisonPanel, {
        scenarios: [scenario({ score: undefined })],
      }),
    );
    // 36 是 ScoreBadge 的宽度，未渲染则不会出现
    assert.ok(contains(html, '方案 A'));
  });

  test('缺少 trend / delta 时显示基础值', () => {
    const html = render(
      React.createElement(ScenarioComparisonPanel, {
        scenarios: [
          scenario({
            metrics: [{ label: '访客数', value: 500 }],
          }),
        ],
      }),
    );
    assert.ok(contains(html, '访客数'));
    assert.ok(contains(html, '500'));
  });
});
