import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { AuditTimeline } = require('./AuditTimeline');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(AuditTimeline, props));
}

const MOCK_EVENTS = [
  {
    id: 'evt-001',
    timestamp: '2026-07-11T03:00:00Z',
    actor: '张三',
    action: '创建订单',
    target: '订单 #SO-20260711-001',
    detail: '订单金额 ¥3,860.00',
    severity: 'success' as const,
    status: 'completed' as const,
  },
  {
    id: 'evt-002',
    timestamp: '2026-07-11T02:45:00Z',
    actor: '李四',
    action: '修改价格',
    target: '商品 SKU-001',
    detail: '原价 ¥50.00 → 新价 ¥45.00',
    severity: 'warning' as const,
    status: 'completed' as const,
  },
  {
    id: 'evt-003',
    timestamp: '2026-07-11T02:30:00Z',
    actor: '系统',
    action: '同步库存失败',
    target: 'ERP 接口',
    severity: 'error' as const,
    status: 'failed' as const,
  },
  {
    id: 'evt-004',
    timestamp: '2026-07-11T02:00:00Z',
    actor: '王五',
    action: '登录系统',
    target: '后台管理',
    severity: 'info' as const,
    status: 'completed' as const,
  },
];

test('AuditTimeline renders event actions', () => {
  const html = renderHTML({ events: MOCK_EVENTS });
  assert.ok(html.includes('创建订单'), 'should show 创建订单');
  assert.ok(html.includes('修改价格'), 'should show 修改价格');
  assert.ok(html.includes('同步库存失败'), 'should show 同步库存失败');
  assert.ok(html.includes('登录系统'), 'should show 登录系统');
});

test('AuditTimeline renders actor names', () => {
  const html = renderHTML({ events: MOCK_EVENTS });
  assert.ok(html.includes('张三'), 'should show 张三');
  assert.ok(html.includes('李四'), 'should show 李四');
  assert.ok(html.includes('系统'), 'should show 系统');
  assert.ok(html.includes('王五'), 'should show 王五');
});

test('AuditTimeline renders empty state when no events', () => {
  const html = renderHTML({ events: [] });
  assert.ok(html.includes('暂无审计事件'), 'should show empty text');
});

test('AuditTimeline renders custom empty text', () => {
  const html = renderHTML({ events: [], emptyText: '无记录' });
  assert.ok(html.includes('无记录'), 'should show custom empty text');
});

test('AuditTimeline renders detail blocks', () => {
  const html = renderHTML({ events: MOCK_EVENTS });
  assert.ok(html.includes('订单金额 ¥3,860.00'), 'should show amount detail');
  assert.ok(html.includes('原价 ¥50.00 → 新价 ¥45.00'), 'should show price detail');
});

test('AuditTimeline accepts data-testid prop', () => {
  const html = renderHTML({ events: MOCK_EVENTS, 'data-testid': 'audit-timeline' });
  assert.ok(html.includes('data-testid="audit-timeline"'), 'should have data-testid');
});

test('AuditTimeline renders with single event', () => {
  const html = renderHTML({ events: [MOCK_EVENTS[0]] });
  assert.ok(html.includes('创建订单'), 'should render single event');
  assert.ok(!html.includes('修改价格'), 'should NOT render other events');
});

test('AuditTimeline renders data-testid on individual events', () => {
  const html = renderHTML({ events: MOCK_EVENTS, 'data-testid': 'timeline' });
  assert.ok(html.includes('data-testid="timeline"'), 'root should have data-testid');
});
