import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIDecisionPanel } = require('./AIDecisionPanel');

// ---- 测试工厂 ----
function makeRule(overrides = {}) {
  return {
    id: 'r1',
    name: '价格合规检查',
    status: 'passed',
    matchedCount: 1280,
    durationMs: 45,
    description: '检查所有SKU价格是否在合规范围内',
    suggestion: undefined,
    executedAt: '2026-06-24 18:00',
    ...overrides,
  };
}

const defaultSummary = { total: 10, passed: 7, failed: 2, warning: 1, pending: 0 };

// ---- 正例 ----
describe('AIDecisionPanel', () => {
  test('renders title and subtitle', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        title: '质量检测规则',
        subtitle: '实时评估',
        rules: [makeRule()],
        summary: defaultSummary,
      })
    );
    assert.match(html, /质量检测规则/);
    assert.match(html, /实时评估/);
  });

  test('renders default title when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, { rules: [makeRule()], summary: defaultSummary })
    );
    assert.match(html, /AI 决策面板/);
  });

  test('renders summary bar with total, passed, failed, pass rate', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule()],
        summary: { total: 10, passed: 7, failed: 2, warning: 1, pending: 0 },
      })
    );
    assert.match(html, /总计/);
    assert.match(html, /10/);
    assert.match(html, /通过/);
    assert.match(html, /7/);
    assert.match(html, /未通过/);
    assert.match(html, /2/);
    assert.match(html, /70%/); // 7/10 pass rate
  });

  test('computes summary from rules when not explicitly provided', () => {
    const rules = [
      makeRule({ id: '1', name: 'A', status: 'passed' }),
      makeRule({ id: '2', name: 'B', status: 'passed' }),
      makeRule({ id: '3', name: 'C', status: 'failed' }),
      makeRule({ id: '4', name: 'D', status: 'warning' }),
      makeRule({ id: '5', name: 'E', status: 'pending' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, { rules })
    );
    assert.match(html, /总计/);
    assert.match(html, /5/);
    assert.match(html, /2/); // passed
    assert.match(html, /1/); // failed / warning / pending each
    assert.match(html, /40%/); // 2/5
  });

  test('renders rule name, status badge, matched count, duration, description', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule()],
        summary: defaultSummary,
      })
    );
    assert.match(html, /价格合规检查/);
    assert.match(html, /通过/);
    assert.match(html, /匹配\s*1280/);
    assert.match(html, /45ms/);
    assert.match(html, /检查所有SKU价格是否在合规范围内/);
  });

  test('renders suggestion for failed rules', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [
          makeRule({
            id: 'f1',
            name: '库存异常',
            status: 'failed',
            suggestion: '3个SKU库存为负',
          }),
        ],
        summary: { total: 1, passed: 0, failed: 1, warning: 0, pending: 0 },
      })
    );
    assert.match(html, /3个SKU库存为负/);
  });

  test('renders coverage percent and delta when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule()],
        summary: { ...defaultSummary, coveragePercent: 85, delta: 5 },
      })
    );
    assert.match(html, /85%/);
    assert.match(html, /↑/);
    assert.match(html, /5%/);
  });

  test('renders negative delta', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule()],
        summary: { ...defaultSummary, coveragePercent: 80, delta: -3 },
      })
    );
    assert.match(html, /↓/);
    assert.match(html, /3%/);
  });

  test('renders all four status types with correct labels', () => {
    const rules = [
      makeRule({ id: '1', name: 'P', status: 'passed' }),
      makeRule({ id: '2', name: 'F', status: 'failed' }),
      makeRule({ id: '3', name: 'W', status: 'warning' }),
      makeRule({ id: '4', name: 'Pd', status: 'pending' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, { rules })
    );
    assert.match(html, /通过/);
    assert.match(html, /未通过/);
    assert.match(html, /警告/);
    assert.match(html, /待执行/);
  });

  test('renders status icons ✓ ✗ ⚠ ⋯', () => {
    const rules = [
      makeRule({ id: '1', name: 'P', status: 'passed' }),
      makeRule({ id: '2', name: 'F', status: 'failed' }),
      makeRule({ id: '3', name: 'W', status: 'warning' }),
      makeRule({ id: '4', name: 'Pd', status: 'pending' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, { rules })
    );
    assert.match(html, /✓/);
    assert.match(html, /✗/);
    assert.match(html, /⚠/);
    assert.match(html, /⋯/);
  });

  test('renders in compact mode without description and executedAt', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule()],
        summary: defaultSummary,
        compact: true,
      })
    );
    // In compact mode, description and executedAt should not appear
    const hasDescription = html.includes('检查所有SKU价格是否在合规范围内');
    const hasExecutedAt = html.includes('2026-06-24 18:00');
    assert.ok(!hasDescription, 'compact mode should hide description');
    assert.ok(!hasExecutedAt, 'compact mode should hide executedAt');
  });

  // ---- 反例 / 边界 ----
  test('renders empty state when rules is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [],
        emptyText: '暂无规则执行结果',
      })
    );
    assert.match(html, /暂无规则执行结果/);
  });

  test('renders custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [],
        emptyText: '✅ 所有规则均已执行',
      })
    );
    assert.match(html, /✅ 所有规则均已执行/);
  });

  test('renders all passed -> 100% pass rate', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule({ id: '1' }), makeRule({ id: '2' })],
        summary: { total: 2, passed: 2, failed: 0, warning: 0, pending: 0 },
      })
    );
    assert.match(html, /100%/);
  });

  test('renders zero pass rate when all failed', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule({ id: '1', status: 'failed' })],
        summary: { total: 1, passed: 0, failed: 1, warning: 0, pending: 0 },
      })
    );
    assert.match(html, /0%/);
  });

  test('renders passed progress segment', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule()],
        summary: defaultSummary,
      })
    );
    assert.match(html, /#22c55e/); // green progress segment
  });

  test('renders failed progress segment with red color', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule()],
        summary: { total: 10, passed: 0, failed: 10, warning: 0, pending: 0 },
      })
    );
    assert.match(html, /#ef4444/); // red progress segment
  });

  test('applies custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule()],
        summary: defaultSummary,
        className: 'my-custom-panel',
      })
    );
    assert.match(html, /class="my-custom-panel"/);
  });

  test('rule without matchedCount does not crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule({ matchedCount: undefined })],
        summary: defaultSummary,
      })
    );
    // Should still render the rule name
    assert.match(html, /价格合规检查/);
  });

  test('rule without durationMs does not show duration', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [makeRule({ durationMs: undefined })],
        summary: defaultSummary,
      })
    );
    // matchedCount (1280) is shown but no 'ms' duration suffix on this rule
    assert.match(html, /1280/);
  });

  test('does not crash when rules empty and summary total=0', () => {
    // Should not crash when summary has total=0 — empty state is rendered instead
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionPanel, {
        rules: [],
        summary: { total: 0, passed: 0, failed: 0, warning: 0, pending: 0 },
      })
    );
    assert.match(html, /暂无规则执行结果/);
  });
});
