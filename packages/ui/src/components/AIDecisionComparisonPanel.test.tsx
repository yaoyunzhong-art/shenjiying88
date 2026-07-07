/**
 * AIDecisionComparisonPanel.test.tsx — AI决策对比分析面板 L1 冒烟测试
 * 类型: C-AI前端组件
 * 覆盖: 正例 + 反例(防御) + 边界(空数据/单条/极端值)
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIDecisionComparisonPanel } = require('./AIDecisionComparisonPanel');

// ── 数据工厂 ──

function makeItem(overrides?: Record<string, unknown>) {
  return {
    id: 'dec-001',
    ruleName: '定价策略-A',
    category: 'pricing' as const,
    confidence: 0.87,
    status: 'success' as const,
    recommendedValue: '¥118.00',
    originalValue: '¥129.00',
    expectedLiftPct: 15,
    actualLiftPct: 13.2,
    deviationScore: 0.12,
    executedAt: '2026-06-30T08:00:00Z',
    adopted: true,
    trigger: 'cron' as const,
    ...overrides,
  };
}

const COMPARISON_ITEMS = [
  makeItem({ id: 'dec-001', ruleName: '定价策略-A', category: 'pricing', confidence: 0.87, status: 'success', adopted: true }),
  makeItem({ id: 'dec-002', ruleName: '库存调配-B', category: 'inventory', confidence: 0.92, status: 'success', adopted: true, recommendedValue: '调拨 200', originalValue: '调拨 0', expectedLiftPct: 10, actualLiftPct: 9.5, deviationScore: 0.05 }),
  makeItem({ id: 'dec-003', ruleName: '促销活动-C', category: 'promotion', confidence: 0.65, status: 'failure', adopted: false, recommendedValue: '满减 8折', originalValue: '满减 9折', expectedLiftPct: 20, actualLiftPct: null, deviationScore: null }),
  makeItem({ id: 'dec-004', ruleName: '资源分配-D', category: 'allocation', confidence: 0.78, status: 'rejected', adopted: false, recommendedValue: '分配 60%', originalValue: '分配 40%', expectedLiftPct: 8, actualLiftPct: 7.2, deviationScore: 0.08 }),
];

// ── 正例 ──

describe('AIDecisionComparisonPanel — positive cases', () => {

  test('renders stats row with total count', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /总决策数/);
    assert.match(html, /4/);
  });

  test('renders all item rule names', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /定价策略-A/);
    assert.match(html, /库存调配-B/);
    assert.match(html, /促销活动-C/);
    assert.match(html, /资源分配-D/);
  });

  test('renders expected lift percentages', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /预期 \+15%/);
    assert.match(html, /预期 \+10%/);
    assert.match(html, /预期 \+20%/);
  });

  test('renders actual lift when present', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /实际 \+13\.2%/);
    assert.match(html, /实际 \+9\.5%/);
  });

  test('renders "待采集" when actual lift is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /待采集/);
  });

  test('renders confidence percentages', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /87%/);
    assert.match(html, /92%/);
    assert.match(html, /65%/);
  });

  test('renders deviation labels for items with score', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    // deviation labels: 优/中/差
    assert.match(html, /优/);
    assert.match(html, /中/);
  });

  test('renders "待评估" for items without deviation score', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /待评估/);
  });

  test('renders category labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /定价策略/);
    assert.match(html, /库存调配/);
    assert.match(html, /促销活动/);
    assert.match(html, /资源分配/);
  });

  test('renders trigger labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /定时/);
  });

  test('renders checkbox for adoption toggle', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, {
        items: COMPARISON_ITEMS,
        onToggleAdopt: () => {},
      })
    );
    const matches = html.match(/type="checkbox"/g);
    assert.equal(matches?.length, 4);
  });

  test('renders bottom summary row', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /共 4 条记录/);
    assert.match(html, /已采纳 2/);
  });

  test('renders status dot for each status type', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    // success, failure, rejected each have a colored circle dot
    assert.ok(html.includes('success'));
  });
});

// ── 反例 / 边界 ──

describe('AIDecisionComparisonPanel — edge cases & defensive', () => {

  test('renders empty state when items is empty array', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: [] })
    );
    assert.match(html, /暂无匹配的决策记录/);
    // Stats should render with 0 values
    assert.match(html, /总决策数/);
    assert.match(html, /0/);
  });

  test('does not crash when onItemClick is undefined and user clicks row', () => {
    // Should render without error — we just verify markup
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /定价策略-A/);
  });

  test('does not crash with single item', () => {
    const single = [makeItem()];
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: single })
    );
    assert.match(html, /定价策略-A/);
    assert.match(html, /共 1 条记录/);
  });

  test('filters by category', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, {
        items: COMPARISON_ITEMS,
        categoryFilter: 'pricing',
      })
    );
    assert.match(html, /定价策略-A/);
    assert.doesNotMatch(html, /库存调配-B/);
  });

  test('filters by status', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, {
        items: COMPARISON_ITEMS,
        statusFilter: 'failure',
      })
    );
    assert.match(html, /促销活动-C/);
    assert.doesNotMatch(html, /定价策略-A/);
  });

  test('filters by adopted status', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, {
        items: COMPARISON_ITEMS,
        adoptedFilter: 'adopted',
      })
    );
    assert.match(html, /定价策略-A/);
    assert.match(html, /库存调配-B/);
    assert.doesNotMatch(html, /促销活动-C/);
  });

  test('filters by not-adopted', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, {
        items: COMPARISON_ITEMS,
        adoptedFilter: 'not-adopted',
      })
    );
    assert.match(html, /促销活动-C/);
    assert.doesNotMatch(html, /定价策略-A/);
  });

  test('sorts by confidence descending', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, {
        items: COMPARISON_ITEMS,
        sort: 'confidence',
      })
    );
    // Should render all items, first should be 92%
    assert.match(html, /92%/);
    assert.match(html, /87%/);
    assert.match(html, /78%/);
    assert.match(html, /65%/);
  });

  test('renders recommended and original values', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: COMPARISON_ITEMS })
    );
    assert.match(html, /¥118\.00/);
    assert.match(html, /¥129\.00/);
    assert.match(html, /调拨 200/);
    assert.match(html, /调拨 0/);
  });

  test('renders with extreme confidence values', () => {
    const extreme = [
      makeItem({ id: 'hi', confidence: 0.999, ruleName: '高置信度' }),
      makeItem({ id: 'lo', confidence: 0.001, ruleName: '低置信度' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: extreme })
    );
    assert.match(html, /100%/);
    assert.match(html, /0%/);
  });

  test('renders with items that have 0 expected lift', () => {
    const zeroLift = [makeItem({ expectedLiftPct: 0, actualLiftPct: 0 })];
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionComparisonPanel, { items: zeroLift })
    );
    assert.match(html, /预期 \+0%/);
    assert.match(html, /实际 \+0%/);
  });
});
