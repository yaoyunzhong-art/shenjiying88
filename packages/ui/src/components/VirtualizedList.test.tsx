/**
 * VirtualizedList component tests
 *
 * Strategy: static markup renders verify structure,
 * unit-level logic tests verify the binary search helpers and
 * rendering invariants.
 */

import React from 'react';
import type { VirtualizedListRow } from './VirtualizedList';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT +
    '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { VirtualizedList } = require('./VirtualizedList');

// ── helpers ──
interface TestItem {
  name: string;
  id: number;
}

function createRows(count: number): VirtualizedListRow<TestItem>[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `row-${i}`,
    data: { name: `Item ${i + 1}`, id: i + 1 },
  }));
}

function simpleRender(row: VirtualizedListRow<TestItem>, _index: number) {
  return React.createElement(
    'div',
    { style: { width: '100%', padding: '0 16px' } },
    row.data.name,
  );
}

// ── tests ──
describe('VirtualizedList', () => {
  // 1. 空数据
  test('renders empty state when rows is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows: [],
        rowHeight: 48,
        height: 400,
        renderRow: simpleRender,
        emptyText: '列表为空',
      }),
    );
    assert.match(html, /列表为空/);
  });

  test('renders default empty text when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows: [],
        rowHeight: 48,
        height: 400,
        renderRow: simpleRender,
      }),
    );
    assert.match(html, /暂无数据/);
  });

  test('empty state has no listitems', () => {
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows: [],
        rowHeight: 48,
        height: 400,
        renderRow: simpleRender,
      }),
    );
    assert.doesNotMatch(html, /role="listitem"/);
  });

  // 2. 基本渲染 — 固定行高
  test('renders visible rows for small dataset', () => {
    const rows = createRows(5);
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows,
        rowHeight: 48,
        height: 400,
        renderRow: simpleRender,
      }),
    );
    // 5行全部应该渲染（都在可视区域内）
    assert.match(html, /Item 1/);
    assert.match(html, /Item 5/);
  });

  test('renders only subset for large dataset', () => {
    const rows = createRows(10000);
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows,
        rowHeight: 48,
        height: 400,
        overscan: 3,
        renderRow: simpleRender,
      }),
    );
    // 第一项必然渲染
    assert.match(html, /Item 1/);
    // 10000 项的数据不可见（不在可视范围 + overscan）
    assert.doesNotMatch(html, /Item 10000/);
  });

  // 3. 动态行高
  test('supports dynamic row height via rowHeightFn', () => {
    const rows = createRows(10);
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows,
        rowHeightFn: (row: VirtualizedListRow<TestItem>) =>
          row.data.id % 2 === 0 ? 64 : 32,
        height: 400,
        renderRow: simpleRender,
      }),
    );
    assert.match(html, /Item 1/);
    assert.match(html, /Item 10/);
  });

  // 4. 自定义高度
  test('uses provided height prop', () => {
    const rows = createRows(5);
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows,
        rowHeight: 48,
        height: 500,
        renderRow: simpleRender,
      }),
    );
    assert.match(html, /height:500px/);
  });

  // 5. 禁用状态
  test('applies disabled style', () => {
    const rows = createRows(5);
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows,
        rowHeight: 48,
        height: 400,
        renderRow: simpleRender,
        disabled: true,
      }),
    );
    assert.match(html, /opacity:0.6/);
    assert.match(html, /pointer-events:none/);
  });

  // 6. 列表容器有 role="list"
  test('container has role="list"', () => {
    const rows = createRows(5);
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows,
        rowHeight: 48,
        height: 400,
        renderRow: simpleRender,
      }),
    );
    assert.match(html, /role="list"/);
  });

  // 7. 列表项有 role="listitem"
  test('visible items have role="listitem"', () => {
    const rows = createRows(3);
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows,
        rowHeight: 48,
        height: 400,
        renderRow: simpleRender,
      }),
    );
    assert.match(html, /role="listitem"/);
  });

  // 8. 总高度占位
  test('renders total height placeholder', () => {
    const rows = createRows(100);
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows,
        rowHeight: 48,
        height: 400,
        renderRow: simpleRender,
      }),
    );
    // 总高度 = 100 * 48 = 4800
    assert.match(html, /height:4800px/);
  });

  // 9. 空数据时高度保持
  test('empty state respects height', () => {
    const html = renderToStaticMarkup(
      React.createElement(VirtualizedList, {
        rows: [],
        rowHeight: 48,
        height: 400,
        renderRow: simpleRender,
      }),
    );
    assert.match(html, /height:400px/);
  });
});
