import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIDecisionTimeline } = require('./AIDecisionTimeline');

// ---- 测试工厂 ----
function makeEvent(overrides = {}) {
  return {
    id: 'e1',
    timestamp: '2026-06-30 14:22',
    title: '库存异常规则触发',
    description: '3个SKU库存为负',
    status: 'warning',
    ruleCount: 12,
    passedCount: 9,
    failedCount: 3,
    operator: 'system',
    actionLabel: '自动触发',
    ...overrides,
  };
}

// ---- 正例 ----
describe('AIDecisionTimeline', () => {
  test('renders title and subtitle', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, {
        title: '决策历史',
        subtitle: '近7天记录',
        events: [makeEvent()],
      })
    );
    assert.match(html, /决策历史/);
    assert.match(html, /近7天记录/);
  });

  test('renders default title', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, { events: [makeEvent()] })
    );
    assert.match(html, /AI 决策时间线/);
  });

  test('renders event timestamp, title, description', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, { events: [makeEvent()] })
    );
    assert.match(html, /2026-06-30 14:22/);
    assert.match(html, /库存异常规则触发/);
    assert.match(html, /3个SKU库存为负/);
  });

  test('renders operator and action label', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, { events: [makeEvent()] })
    );
    assert.match(html, /system/);
    assert.match(html, /自动触发/);
  });

  test('renders rule, passed, failed counts', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, { events: [makeEvent()] })
    );
    assert.match(html, /12/);
    assert.match(html, /9/);
    assert.match(html, /3/);
  });

  test('renders all five status types with correct labels', () => {
    const events = [
      makeEvent({ id: '1', title: 'S', status: 'success' }),
      makeEvent({ id: '2', title: 'F', status: 'failure' }),
      makeEvent({ id: '3', title: 'W', status: 'warning' }),
      makeEvent({ id: '4', title: 'Sk', status: 'skipped' }),
      makeEvent({ id: '5', title: 'R', status: 'running' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, { events })
    );
    assert.match(html, /成功/);
    assert.match(html, /失败/);
    assert.match(html, /警告/);
    assert.match(html, /跳过/);
    assert.match(html, /执行中/);
  });

  test('renders overview bar with event counts', () => {
    const events = [
      makeEvent({ id: '1', status: 'success' }),
      makeEvent({ id: '2', status: 'success' }),
      makeEvent({ id: '3', status: 'failure' }),
      makeEvent({ id: '4', status: 'warning' }),
      makeEvent({ id: '5', status: 'running' }),
      makeEvent({ id: '6', status: 'warning' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, { events })
    );
    assert.match(html, /6/); // total
    assert.match(html, /2/); // success
  });

  test('renders empty state when events is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, {
        events: [],
        emptyText: '暂无记录',
      })
    );
    assert.match(html, /暂无记录/);
  });

  test('renders custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, {
        events: [],
        emptyText: '一切正常',
      })
    );
    assert.match(html, /一切正常/);
  });

  test('applies custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, {
        events: [makeEvent()],
        className: 'my-timeline',
      })
    );
    assert.match(html, /class="my-timeline"/);
  });

  test('respects maxVisible', () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({ id: `e${i}`, title: `Event ${i}` })
    );
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, { events, maxVisible: 2 })
    );
    // Should show 2 events and "展开剩余 3 条记录" button
    assert.match(html, /Event 0/);
    assert.match(html, /Event 1/);
    assert.match(html, /展开/);
    assert.match(html, /3/);
    // Event 2 should NOT appear
    assert.ok(!html.includes('Event 2'), 'should not render event 2 when maxVisible=2');
  });

  test('all events visible when maxVisible >= events.length', () => {
    const events = Array.from({ length: 3 }, (_, i) =>
      makeEvent({ id: `e${i}`, title: `Event ${i}` })
    );
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, { events, maxVisible: 5 })
    );
    assert.match(html, /Event 0/);
    assert.match(html, /Event 1/);
    assert.match(html, /Event 2/);
  });

  test('renders spinning icon for running status', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, {
        events: [makeEvent({ id: 'r1', title: 'Running', status: 'running' })],
      })
    );
    assert.match(html, /aidtSpin/);
  });

  test('event without description and ruleCount renders', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, {
        events: [
          makeEvent({
            description: undefined,
            ruleCount: undefined,
            passedCount: undefined,
            failedCount: undefined,
          }),
        ],
      })
    );
    assert.ok(html.includes(makeEvent().title), 'should include event title');
  });

  test('event without operator still renders', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, {
        events: [makeEvent({ operator: undefined, actionLabel: undefined })],
      })
    );
    assert.ok(html.includes(makeEvent().title), 'should include event title');
  });

  test('event with renderDetail renders custom content', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDecisionTimeline, {
        events: [
          makeEvent({
            renderDetail: () =>
              React.createElement(
                'div',
                { 'data-testid': 'custom-detail' },
                '自定义详情内容'
              ),
          }),
        ],
      })
    );
    assert.match(html, /自定义详情内容/);
  });
});
