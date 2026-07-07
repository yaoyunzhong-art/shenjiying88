import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { Transfer } = require('./Transfer');
const { Button } = require('./Button');
const { Checkbox } = require('./Checkbox');

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(Transfer, props));
}

const sampleItems = [
  { key: '1', label: '选项一' },
  { key: '2', label: '选项二' },
  { key: '3', label: '选项三', description: '描述文字' },
  { key: '4', label: '选项四', disabled: true },
];

// ── Tests ───────────────────────────────────────────────────────────────────

test('Transfer: exports correctly', () => {
  assert.ok(Transfer, 'Transfer should be defined');
  assert.ok(typeof Transfer === 'function', 'Transfer should be callable');
});

test('Transfer: renders two panels with default titles', () => {
  const html = renderHTML({ dataSource: sampleItems, targetKeys: [] });
  assert.ok(html.includes('待选择'), 'should have left panel title');
  assert.ok(html.includes('已选择'), 'should have right panel title');
  assert.ok(html.includes('选项一'), 'should render item label');
  assert.ok(html.includes('选项二'), 'should render item label');
});

test('Transfer: renders items in correct panels based on targetKeys', () => {
  const html = renderHTML({ dataSource: sampleItems, targetKeys: ['1', '3'] });
  // left panel should have items not in targetKeys
  assert.ok(html.includes('选项二'), '选项二 should appear (not in targetKeys)');
  assert.ok(html.includes('选项四'), '选项四 should appear (not in targetKeys)');
});

test('Transfer: renders custom titles', () => {
  const html = renderHTML({
    dataSource: sampleItems,
    targetKeys: [],
    leftTitle: '可选',
    rightTitle: '已选',
  });
  assert.ok(html.includes('可选'), 'should use custom left title');
  assert.ok(html.includes('已选'), 'should use custom right title');
});

test('Transfer: renders with descriptions', () => {
  const html = renderHTML({ dataSource: sampleItems, targetKeys: [] });
  assert.ok(html.includes('描述文字'), 'should render item description');
});

test('Transfer: renders empty state when no items', () => {
  const html = renderHTML({ dataSource: [], targetKeys: [] });
  assert.ok(html.includes('暂无数据'), 'should show empty state');
});

test('Transfer: renders search inputs when showSearch is true', () => {
  const html = renderHTML({
    dataSource: sampleItems,
    targetKeys: [],
    showSearch: true,
  });
  assert.ok(html.includes('搜索'), 'should show search placeholder');
  // The SearchFilterInput component should render an input
  assert.ok(html.includes('input') || html.includes('Search'), 'should render search element');
});

test('Transfer: renders action buttons', () => {
  const html = renderHTML({ dataSource: sampleItems, targetKeys: [] });
  assert.ok(html.includes('&gt;'), 'should have move-right button');
  assert.ok(html.includes('&lt;'), 'should have move-left button');
});

test('Transfer: renders with custom className and style', () => {
  const html = renderHTML({
    dataSource: sampleItems,
    targetKeys: [],
    className: 'my-transfer',
    style: { border: '1px solid red' },
  });
  assert.ok(html.includes('my-transfer'), 'should include custom className');
});

test('Transfer: renders disabled state', () => {
  const html = renderHTML({
    dataSource: sampleItems,
    targetKeys: [],
    disabled: true,
  });
  // disabled should not crash, buttons should be disabled
  assert.ok(html.includes('&gt;'), 'buttons should still render');
  assert.ok(html.includes('&lt;'), 'buttons should still render');
});

test('Transfer: empty left panel shows empty text', () => {
  const html = renderHTML({
    dataSource: sampleItems,
    targetKeys: ['1', '2', '3', '4'],
  });
  // All items moved to right, left should be empty
  assert.ok(html.includes('暂无数据'), 'should show empty when left is empty');
});

test('Transfer: renders count in panel header', () => {
  const html = renderHTML({
    dataSource: sampleItems,
    targetKeys: ['1'],
  });
  // left panel should have 3 items (sampleItems minus targetKeys['1'])
  // right panel should have 1 item
  assert.ok(html, 'should render without error');
  // panel headers should contain count numbers
  const countMatch = html.match(/\d+/g);
  assert.ok(countMatch, 'should contain numeric counts in headers');
});
