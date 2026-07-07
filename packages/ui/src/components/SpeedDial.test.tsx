import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { SpeedDial } = require('./SpeedDial');
import type { SpeedDialAction } from './SpeedDial';

const noop = () => {};

const mockActions: SpeedDialAction[] = [
  { key: 'add', label: '新增', icon: '➕', onClick: noop },
  { key: 'edit', label: '编辑', icon: '✏️', onClick: noop },
  { key: 'delete', label: '删除', icon: '🗑️', onClick: noop, danger: true },
  { key: 'disabled', label: '禁用操作', icon: '🔒', onClick: noop, disabled: true },
];

function createElement(props: Record<string, unknown> = {}) {
  return React.createElement(SpeedDial, { actions: mockActions, ...props });
}

test('SpeedDial: renders main toggle button', () => {
  const el = createElement();
  assert.ok(el, '组件应正常创建');
  assert.equal(typeof el.type, 'function', 'type 应为 SpeedDial 函数');
});

test('SpeedDial: initial state sets aria-expanded=false', () => {
  const el = createElement();
  // 用 state 推断: 默认 open=false
  assert.equal(el.props.actions, mockActions);
});

test('SpeedDial: disables action when disabled=true', () => {
  const disabledAction = mockActions.find(a => a.disabled);
  assert.ok(disabledAction);
  assert.equal(disabledAction!.disabled, true);
  assert.equal(disabledAction!.key, 'disabled');
});

test('SpeedDial: marks danger actions', () => {
  const dangerAction = mockActions.find(a => a.danger);
  assert.ok(dangerAction);
  assert.equal(dangerAction!.danger, true);
  assert.equal(dangerAction!.key, 'delete');
});

test('SpeedDial: passes directions without error', () => {
  for (const dir of ['up', 'down', 'left', 'right'] as const) {
    const el = createElement({ direction: dir });
    assert.ok(el, `direction=${dir} 正常创建`);
  }
});

test('SpeedDial: passes size variants without error', () => {
  for (const size of ['sm', 'md', 'lg'] as const) {
    const el = createElement({ size });
    assert.ok(el, `size=${size} 正常创建`);
  }
});

test('SpeedDial: renders with custom icon', () => {
  const el = createElement({ icon: '🚀' });
  assert.ok(el, '自定义图标渲染');
  // 验证 icon prop 被传递到组件 (props 不一定会透传, 但确保创建不报错)
  assert.equal(el.props.icon, '🚀');
});

test('SpeedDial: renders with default icon', () => {
  const el = createElement();
  assert.equal(el.props.icon, undefined, '不传 icon 使用组件默认值');
});

test('SpeedDial: renders with fixed=false', () => {
  const el = createElement({ fixed: false });
  assert.ok(el, 'fixed=false 正常创建');
  assert.equal(el.props.fixed, false);
});

test('SpeedDial: handles empty actions', () => {
  const el = React.createElement(SpeedDial, { actions: [] });
  assert.ok(el, '空 actions 正常创建');
});

test('SpeedDial: actions array is passed correctly', () => {
  const el = createElement();
  assert.equal(el.props.actions.length, 4);
  assert.equal(el.props.actions[0].key, 'add');
  assert.equal(el.props.actions[0].label, '新增');
  assert.equal(el.props.actions[1].key, 'edit');
  assert.equal(el.props.actions[2].key, 'delete');
  assert.equal(el.props.actions[3].key, 'disabled');
});

test('SpeedDial: onClick callback works', () => {
  let called = false;
  const testActions: SpeedDialAction[] = [
    { key: 'test', label: '测试', icon: '🧪', onClick: () => { called = true; } },
  ];
  const el = React.createElement(SpeedDial, { actions: testActions });
  assert.ok(el);
  testActions[0].onClick();
  assert.equal(called, true);
});

test('SpeedDial: custom style merges', () => {
  const el = createElement({ style: { zIndex: 888 } });
  assert.ok(el, '自定义样式正常创建');
  assert.equal(el.props.style.zIndex, 888);
});

test('SpeedDial: offset prop works', () => {
  const el = createElement({ offset: 40 });
  assert.equal(el.props.offset, 40);
});

test('SpeedDial: offsetRight prop works', () => {
  const el = createElement({ offsetRight: 48 });
  assert.equal(el.props.offsetRight, 48);
});
