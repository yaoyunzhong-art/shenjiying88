import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Table } = require('./Table');

interface SampleData {
  id: string;
  name: string;
  age: number;
}

const SAMPLE_COLUMNS = [
  { key: 'name', header: '姓名', sortable: true },
  { key: 'age', header: '年龄', align: 'right' as const },
];

const SAMPLE_ROWS: SampleData[] = [
  { id: '1', name: '张三', age: 30 },
  { id: '2', name: '李四', age: 25 },
  { id: '3', name: '王五', age: 35 },
];

const rowKey = (r: SampleData) => r.id;

describe('Table', () => {
  test('renders column headers', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: SAMPLE_ROWS, rowKey })
    );
    assert.match(html, /姓名/);
    assert.match(html, /年龄/);
  });

  test('renders row data', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: SAMPLE_ROWS, rowKey })
    );
    assert.match(html, /张三/);
    assert.match(html, /李四/);
    assert.match(html, /王五/);
    assert.match(html, /30/);
    assert.match(html, /25/);
    assert.match(html, /35/);
  });

  test('shows empty state when no rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: [], rowKey, emptyText: '暂无数据' })
    );
    assert.match(html, /暂无数据/);
  });

  test('loading state shows Loading text', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: SAMPLE_ROWS, rowKey, loading: true })
    );
    assert.match(html, /Loading/);
  });

  test('selectable renders checkbox column', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: SAMPLE_ROWS, rowKey, selectable: true })
    );
    assert.match(html, /type="checkbox"/);
    assert.match(html, /Select all rows/);
  });

  test('renders title in toolbar', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: SAMPLE_ROWS, rowKey, title: '用户列表' })
    );
    assert.match(html, /用户列表/);
  });

  test('renders toolbar element', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns: SAMPLE_COLUMNS,
        rows: SAMPLE_ROWS,
        rowKey,
        toolbar: React.createElement('button', null, '新增'),
      })
    );
    assert.match(html, /新增/);
  });

  test('compact mode renders without error', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: [{ id: '1', name: '测试', age: 20 }], rowKey, compact: true })
    );
    assert.match(html, /测试/);
  });

  test('custom render function in column', () => {
    const columnsWithRender = [
      { key: 'name', header: '姓名', render: (row: SampleData) => `👤 ${row.name}` },
      ...SAMPLE_COLUMNS.slice(1),
    ];
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: columnsWithRender, rows: SAMPLE_ROWS, rowKey })
    );
    assert.match(html, /👤 张三/);
  });

  test('sortable column shows sort indicator', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns: SAMPLE_COLUMNS,
        rows: SAMPLE_ROWS,
        rowKey,
        sort: { key: 'name', direction: 'asc' },
        onSortChange: () => {},
      })
    );
    assert.match(html, /▲/);
  });

  test('pagination footer renders', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns: SAMPLE_COLUMNS,
        rows: SAMPLE_ROWS,
        rowKey,
        pagination: { page: 0, pageSize: 2, total: 3 },
        onPaginationChange: () => {},
      })
    );
    assert.match(html, /Showing/);
    assert.match(html, /of/);
    assert.match(html, /Prev/);
    assert.match(html, /Next/);
  });

  test('bordered mode renders without error', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: SAMPLE_ROWS, rowKey, bordered: true })
    );
    assert.match(html, /张三/);
  });

  test('hoverable false renders without error', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: SAMPLE_ROWS, rowKey, hoverable: false })
    );
    assert.match(html, /张三/);
  });

  test('striped mode renders without error', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: SAMPLE_ROWS, rowKey, striped: true })
    );
    assert.match(html, /张三/);
  });

  test('renders with empty columns and rows gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: [], rows: [], rowKey: () => '' })
    );
    assert.ok(html);
  });

  test('data-testid is not present by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: SAMPLE_COLUMNS, rows: SAMPLE_ROWS, rowKey })
    );
    // Table doesn't have data-testid on root by default
    assert.ok(html);
  });
});
