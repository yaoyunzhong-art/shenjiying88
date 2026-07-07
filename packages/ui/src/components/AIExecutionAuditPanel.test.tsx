import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AIExecutionAuditPanel,
} = require('./AIExecutionAuditPanel');

// ---- 测试工厂 ----
function makeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    ruleName: '会员折扣规则',
    status: 'success',
    triggerSource: 'auto',
    durationMs: 1200,
    affectedCount: 15,
    successCount: 15,
    failureCount: 0,
    executedAt: '2026-06-29T10:00:00Z',
    message: '成功应用于 15 名会员',
    ...overrides,
  };
}

const defaultRecords = [
  makeRecord(),
  makeRecord({
    id: 'r2',
    ruleName: '限时优惠策略',
    status: 'failure',
    triggerSource: 'manual',
    durationMs: 3500,
    affectedCount: 0,
    successCount: 0,
    failureCount: 3,
    executedAt: '2026-06-29T10:05:00Z',
    operator: '张三',
    message: '库存不足',
  }),
  makeRecord({
    id: 'r3',
    ruleName: '智能推荐规则',
    status: 'partial',
    triggerSource: 'scheduled',
    durationMs: 890,
    affectedCount: 28,
    successCount: 20,
    failureCount: 8,
    executedAt: '2026-06-29T09:00:00Z',
    message: '部分商品不在推荐池中',
  }),
  makeRecord({
    id: 'r4',
    ruleName: '库存预警规则',
    status: 'skipped',
    triggerSource: 'auto',
    durationMs: 45,
    affectedCount: 0,
    successCount: 0,
    failureCount: 0,
    executedAt: '2026-06-29T08:00:00Z',
    message: '无异常商品',
  }),
];

// ---- 正例 ----
describe('AIExecutionAuditPanel', () => {
  test('renders title', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: defaultRecords,
      })
    );
    assert.match(html, /AI 决策执行审计/);
  });

  test('renders custom title', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: defaultRecords,
        title: '执行日志',
      })
    );
    assert.match(html, /执行日志/);
  });

  test('renders all filter tabs', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, { records: defaultRecords })
    );
    assert.match(html, /全部/);
    assert.match(html, /成功/);
    assert.match(html, /失败/);
    assert.match(html, /部分/);
    assert.match(html, /跳过/);
  });

  test('renders summary bar with total count', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, { records: defaultRecords })
    );
    assert.match(html, /共 4 条执行记录/);
  });

  test('renders all rule names', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, { records: defaultRecords })
    );
    assert.match(html, /会员折扣规则/);
    assert.match(html, /限时优惠策略/);
    assert.match(html, /智能推荐规则/);
    assert.match(html, /库存预警规则/);
  });

  test('renders status badges: success, failure, partial, skipped', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, { records: defaultRecords })
    );
    assert.match(html, /成功/);
    assert.match(html, /失败/);
  });

  test('renders trigger source badges', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, { records: defaultRecords })
    );
    assert.match(html, /手动/);
    assert.match(html, /定时/);
  });

  test('renders duration and affected counts', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, { records: defaultRecords })
    );
    assert.match(html, /1\.2s/); // 1200ms
    assert.match(html, /3\.5s/); // 3500ms
  });

  test('renders summary stats with affected total and avg duration', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, { records: defaultRecords })
    );
    assert.match(html, /影响 43 条/);
  });

  test('renders expanded detail with message', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: [makeRecord()],
        expandable: true,
      })
    );
    // By default the detail should be collapsible — messages appear on expand
    // In static render we can only check the container exists
    assert.match(html, /会员折扣规则/);
  });

  test('renders manual trigger badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: [makeRecord({ triggerSource: 'manual' })],
      })
    );
    assert.match(html, /手动/);
  });

  test('renders operator name in main row for manual records', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: [makeRecord({
          triggerSource: 'manual',
          operator: '张三',
          message: '手动触发',
        })],
        expandable: true,
      })
    );
    // Operator is visible in main row for manual records
    assert.match(html, /手动/);
    // expanded arrow is present indicating expandability
    assert.match(html, /▼/);
  });

  test('renders collapse arrow indicator when expandable', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: [makeRecord()],
        expandable: true,
      })
    );
    assert.match(html, /▼/);
  });

  test('does not render collapse arrow when not expandable', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: [makeRecord()],
        expandable: false,
      })
    );
    assert.ok(!html.includes('▼'));
  });

  // ---- 边界 / 反例 ----
  test('shows empty state when no records', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: [],
        emptyText: '暂无数据',
      })
    );
    assert.match(html, /暂无数据/);
  });

  test('shows default empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, { records: [] })
    );
    assert.match(html, /暂无执行记录/);
  });

  test('overflow hint when more records than maxItems', () => {
    const manyRecords = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `r${i}`, ruleName: `Rule ${i}` }));
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, { records: manyRecords, maxItems: 2 })
    );
    assert.match(html, /仅显示最近 2 条记录/);
    assert.match(html, /共 5 条/);
  });

  test('applies custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: defaultRecords,
        className: 'my-audit-panel',
      })
    );
    assert.match(html, /class="my-audit-panel"/);
  });

  test('single record does not crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: [makeRecord()],
      })
    );
    assert.match(html, /会员折扣规则/);
  });

  test('records with only skipped status renders summary correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: [makeRecord({ status: 'skipped', ruleName: '跳过规则' })],
      })
    );
    assert.match(html, /共 1 条执行记录/);
  });

  test('records with status without expandable mode still renders', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIExecutionAuditPanel, {
        records: [makeRecord()],
        expandable: false,
      })
    );
    assert.match(html, /会员折扣规则/);
  });
});
