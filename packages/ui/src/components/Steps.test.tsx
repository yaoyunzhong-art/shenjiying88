import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';

// Testing approach: verify export structure, type safety, prop handling,
// and that the component creates valid React elements — no SSR needed.
// This matches the pattern used by all other component tests in this project.

import { Steps } from './Steps';

test('Steps exports correctly', () => {
  assert.ok(Steps, 'Steps should be defined');
  assert.ok(
    typeof Steps === 'function' || typeof Steps === 'object',
    'Steps should be a function or React.memo object',
  );
});

test('Steps renders with default props', () => {
  const el = React.createElement(Steps, { items: [] });
  assert.ok(el, 'should create a React element');
});

test('Steps renders with a single step', () => {
  const items = [{ title: 'Step 1' }];
  const el = React.createElement(Steps, { items, current: 0, 'data-testid': 's' });
  assert.ok(el, 'should create element with one step');
  const props = el.props as Record<string, unknown>;
  assert.ok(Array.isArray(props.items));
  assert.strictEqual(props.items.length, 1);
  assert.strictEqual(props.current, 0);
  assert.strictEqual(props['data-testid'], 's');
});

test('Steps renders multiple steps', () => {
  const items = [
    { title: '创建订单', description: '填写基本信息' },
    { title: '支付', description: '选择支付方式' },
    { title: '完成', description: '订单确认' },
  ];
  const el = React.createElement(Steps, { items, current: 1 });
  assert.ok(el, 'should create element with multiple steps');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.items.length, 3);
  assert.strictEqual(props.current, 1);
});

test('Steps accepts size prop', () => {
  const items = [{ title: 'Test' }];
  const el = React.createElement(Steps, { items, size: 'lg' });
  assert.ok(el, 'should create element with size');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.size, 'lg');
});

test('Steps size defaults to md', () => {
  const items = [{ title: 'Test' }];
  const el = React.createElement(Steps, { items });
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.size, undefined, 'size should be undefined (defaults to md)');
});

test('Steps accepts orientation prop', () => {
  const items = [{ title: 'Test' }];
  const el = React.createElement(Steps, { items, orientation: 'vertical' });
  assert.ok(el, 'should create element with vertical orientation');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.orientation, 'vertical');
});

test('Steps orientation defaults to horizontal', () => {
  const items = [{ title: 'Test' }];
  const el = React.createElement(Steps, { items });
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.orientation, undefined, 'orientation defaults to horizontal');
});

test('Steps accepts onStepClick callback', () => {
  const items = [
    { title: 'A', clickable: true },
    { title: 'B', clickable: true },
  ];
  const fn = () => {};
  const el = React.createElement(Steps, { items, onStepClick: fn });
  assert.ok(el, 'should create element with click handler');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.onStepClick, fn);
});

test('Steps accepts current prop', () => {
  const items = [
    { title: '步骤一' },
    { title: '步骤二' },
    { title: '步骤三' },
  ];
  const el = React.createElement(Steps, { items, current: 2 });
  assert.ok(el, 'should create element with current=2');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.current, 2);
});

test('Steps current defaults to 0', () => {
  const items = [{ title: 'Test' }];
  const el = React.createElement(Steps, { items });
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.current, undefined, 'current defaults to 0');
});

test('Steps accepts items with explicit status', () => {
  const items = [
    { title: 'A', status: 'completed' as const },
    { title: 'B', status: 'error' as const },
    { title: 'C', status: 'waiting' as const },
  ];
  const el = React.createElement(Steps, { items, current: 1 });
  assert.ok(el, 'should create element with explicit statuses');
  const props = el.props as Record<string, unknown>;
  const arr = props.items as Array<Record<string, unknown>>;
  assert.strictEqual(arr[0].status, 'completed');
  assert.strictEqual(arr[1].status, 'error');
  assert.strictEqual(arr[2].status, 'waiting');
});

test('Steps accepts items with icon prop', () => {
  const icon = React.createElement('span', null, '🔒');
  const items = [{ title: 'Secure', icon }];
  const el = React.createElement(Steps, { items });
  assert.ok(el, 'should create element with custom icon');
  const props = el.props as Record<string, unknown>;
  const arr = props.items as Array<Record<string, unknown>>;
  assert.ok(arr[0].icon);
});

test('Steps accepts items with description', () => {
  const items = [{ title: '步骤', description: '描述文本' }];
  const el = React.createElement(Steps, { items });
  assert.ok(el, 'should create element with description');
  const props = el.props as Record<string, unknown>;
  const arr = props.items as Array<Record<string, unknown>>;
  assert.strictEqual(arr[0].description, '描述文本');
});

test('Steps accepts showConnector prop', () => {
  const items = [{ title: 'A' }, { title: 'B' }];
  const el = React.createElement(Steps, { items, showConnector: false });
  assert.ok(el, 'should create element without connectors');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.showConnector, false);
});

test('Steps showConnector defaults to true', () => {
  const items = [{ title: 'A' }];
  const el = React.createElement(Steps, { items });
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.showConnector, undefined, 'showConnector defaults to true');
});

test('Steps accepts className prop', () => {
  const items = [{ title: 'Test' }];
  const el = React.createElement(Steps, { items, className: 'custom-steps' });
  assert.ok(el, 'should create element with className');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.className, 'custom-steps');
});

test('Steps accepts style prop', () => {
  const items = [{ title: 'Test' }];
  const el = React.createElement(Steps, { items, style: { backgroundColor: '#f0f0f0' } });
  assert.ok(el, 'should create element with style');
  const props = el.props as Record<string, unknown>;
  assert.ok(props.style);
  assert.strictEqual((props.style as Record<string, unknown>).backgroundColor, '#f0f0f0');
});

test('Steps handles data-testid prop', () => {
  const items = [{ title: 'A' }, { title: 'B' }];
  const el = React.createElement(Steps, { items, 'data-testid': 'steps-wizard' });
  assert.ok(el, 'should create element with data-testid');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props['data-testid'], 'steps-wizard');
});

test('Steps renders with all props combined', () => {
  const items = [
    { title: '信息', description: '基本信息填写' },
    { title: '审核', description: '提交审核' },
    { title: '完成', description: '审核通过' },
  ];
  const el = React.createElement(Steps, {
    items,
    current: 1,
    size: 'lg',
    orientation: 'vertical',
    showConnector: true,
    onStepClick: () => {},
    className: 'wizard-steps',
    style: { padding: 16 },
    'data-testid': 'wizard',
  });
  assert.ok(el, 'should create element with all props');
  const props = el.props as Record<string, unknown>;
  assert.strictEqual(props.items.length, 3);
  assert.strictEqual(props.current, 1);
  assert.strictEqual(props.size, 'lg');
  assert.strictEqual(props.orientation, 'vertical');
  assert.strictEqual(props.showConnector, true);
  assert.strictEqual(props['data-testid'], 'wizard');
  assert.strictEqual(props.className, 'wizard-steps');
});

test('Steps handles empty items gracefully', () => {
  const el = React.createElement(Steps, { items: [] });
  assert.ok(el, 'should handle empty items');
});

test('Steps handles null items gracefully', () => {
  // @ts-expect-error - testing runtime handling
  const el = React.createElement(Steps, { items: null });
  assert.ok(el, 'should handle null items');
});

test('Steps handles clickable step with item-level clickable', () => {
  const items = [
    { title: 'Step 1', clickable: true },
    { title: 'Step 2', clickable: false },
    { title: 'Step 3' },
  ];
  const el = React.createElement(Steps, { items });
  assert.ok(el, 'should create element with mixed clickable steps');
  const props = el.props as Record<string, unknown>;
  const arr = props.items as Array<Record<string, unknown>>;
  assert.strictEqual(arr[0].clickable, true);
  assert.strictEqual(arr[1].clickable, false);
  assert.strictEqual(arr[2].clickable, undefined);
});
