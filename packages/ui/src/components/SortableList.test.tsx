import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { SortableList } = require('./SortableList');

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(SortableList, props));
}

const sampleItems = [
  { id: 'a', label: '项目 Alpha' },
  { id: 'b', label: '项目 Beta', description: '这是 Beta 的描述' },
  { id: 'c', label: '项目 Gamma', disabled: true },
  { id: 'd', label: '项目 Delta' },
];

// ── Tests ───────────────────────────────────────────────────────────────────

test('SortableList: exports correctly', () => {
  assert.ok(SortableList, 'SortableList should be defined');
  assert.ok(typeof SortableList === 'function', 'SortableList should be callable');
});

test('SortableList: renders all items with labels', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {} });
  assert.ok(html.includes('项目 Alpha'), 'should render Alpha');
  assert.ok(html.includes('项目 Beta'), 'should render Beta');
  assert.ok(html.includes('项目 Gamma'), 'should render Gamma');
  assert.ok(html.includes('项目 Delta'), 'should render Delta');
});

test('SortableList: renders item description', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {} });
  assert.ok(html.includes('这是 Beta 的描述'), 'should render Beta description');
});

test('SortableList: renders position badges', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {} });
  assert.ok(html.includes('#1'), 'should render position 1');
  assert.ok(html.includes('#2'), 'should render position 2');
  assert.ok(html.includes('#3'), 'should render position 3');
  assert.ok(html.includes('#4'), 'should render position 4');
});

test('SortableList: disabled items have aria-disabled', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {} });
  // Gamma is disabled
  assert.ok(html.includes('aria-disabled="true"'), 'disabled item should have aria-disabled');
});

test('SortableList: draggable attribute on enabled items', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {} });
  // Non-disabled items should be draggable
  assert.ok(html.includes('draggable="true"'), 'enabled items should be draggable');
});

test('SortableList: disabled prop prevents drag handles and draggable', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {}, disabled: true });
  // When disabled, draggable should never be true
  const draggableCount = (html.match(/draggable="true"/g) || []).length;
  assert.equal(draggableCount, 0, 'no items should be draggable when disabled');
});

test('SortableList: renders empty state when no items', () => {
  const html = renderHTML({ items: [], onReorder: () => {} });
  assert.ok(html.includes('暂无项目'), 'should show empty state');
});

test('SortableList: renders custom aria-label', () => {
  const label = '产品排序列表';
  const html = renderHTML({ items: sampleItems, onReorder: () => {}, ariaLabel: label });
  assert.ok(html.includes(label), 'should use custom aria-label');
});

test('SortableList: items have tabIndex for keyboard navigation', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {} });
  const tabIndex0Count = (html.match(/tabindex="0"/g) || []).length;
  // 3 non-disabled items should have tabIndex 0
  assert.equal(tabIndex0Count, 3, 'non-disabled items should have tabindex 0');
});

test('SortableList: disabled items have tabIndex -1', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {} });
  assert.ok(html.includes('tabindex="-1"'), 'disabled items should have tabindex -1');
});

test('SortableList: renders custom renderItem', () => {
  const customRender = (item: { id: string; label: string }) =>
    React.createElement('span', { 'data-testid': 'custom' }, `CUSTOM:${item.label}`);

  const html = renderHTML({
    items: sampleItems,
    onReorder: () => {},
    renderItem: customRender,
  });
  assert.ok(html.includes('CUSTOM:项目 Alpha'), 'should use custom render');
  assert.ok(html.includes('CUSTOM:项目 Beta'), 'should use custom render');
});

test('SortableList: supports className prop', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {}, className: 'my-list' });
  assert.ok(html.includes('my-list'), 'should include custom class');
});

test('SortableList: renders drag handle for enabled items', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {} });
  // The drag handle character ⠿ should appear
  assert.ok(html.includes('⠿'), 'should render drag handle characters');
});

test('SortableList: drag handle hidden when disabled', () => {
  const html = renderHTML({ items: sampleItems, onReorder: () => {}, disabled: true });
  const handleCount = (html.match(/⠿/g) || []).length;
  assert.equal(handleCount, 0, 'no drag handles when disabled');
});
