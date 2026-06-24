import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { PaginatedDataTableCard } = require('./PaginatedDataTableCard');

interface TestRow {
  id: number;
  name: string;
  status: string;
}

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: '名称', dataKey: 'name' as keyof TestRow },
  { key: 'status', header: '状态', render: (row: TestRow) => row.status },
];

const rows: TestRow[] = [
  { id: 1, name: '张三', status: '活跃' },
  { id: 2, name: '李四', status: '离线' },
];

describe('PaginatedDataTableCard', () => {
  test('renders loading skeleton when loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaginatedDataTableCard, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        loading: true,
        emptyTitle: '无数据',
        emptyDescription: '暂无记录',
      })
    );
    // LoadingSkeleton renders pulse animation skeleton, not "Loading" text
    assert.match(html, /@keyframes pulse/);
  });

  test('renders EmptyState when rows empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaginatedDataTableCard, {
        columns,
        rows: [],
        rowKey: (r: TestRow) => String(r.id),
        emptyTitle: '暂无会员',
        emptyDescription: '请先添加会员数据',
      })
    );
    assert.match(html, /暂无会员/);
    assert.match(html, /请先添加会员数据/);
  });

  test('renders DataTable with rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaginatedDataTableCard, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        emptyTitle: '无数据',
        emptyDescription: '暂无记录',
      })
    );
    assert.match(html, /张三/);
    assert.match(html, /李四/);
    assert.match(html, /<table/);
  });

  test('renders title on DataTable', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaginatedDataTableCard, {
        title: '会员列表',
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        emptyTitle: '无数据',
        emptyDescription: '暂无记录',
      })
    );
    assert.match(html, /会员列表/);
  });

  test('renders pagination when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaginatedDataTableCard, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        emptyTitle: '无数据',
        emptyDescription: '暂无记录',
        pagination: {
          page: 1,
          totalPages: 5,
          total: 50,
          onPageChange: () => {},
        },
      })
    );
    assert.match(html, /Total 50 items/);
  });

  test('does not render pagination when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaginatedDataTableCard, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        emptyTitle: '无数据',
        emptyDescription: '暂无记录',
      })
    );
    assert.doesNotMatch(html, /Total \d+ items/);
  });

  test('card has bordered rounded container style', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaginatedDataTableCard, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        emptyTitle: '无数据',
        emptyDescription: '暂无记录',
      })
    );
    assert.match(html, /border-radius:12/);
    assert.match(html, /border:1px solid rgba\(148,163,184,0\.12\)/);
  });

  test('passes striped prop to DataTable', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaginatedDataTableCard, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        striped: true,
        emptyTitle: '无数据',
        emptyDescription: '暂无记录',
      })
    );
    assert.match(html, /rgba\(148,163,184,0\.02\)/);
  });

  test('passes compact prop to DataTable', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaginatedDataTableCard, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        compact: true,
        emptyTitle: '无数据',
        emptyDescription: '暂无记录',
      })
    );
    assert.match(html, /padding-top:8/);
  });

  test('renders without sort when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaginatedDataTableCard, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        emptyTitle: '无数据',
        emptyDescription: '暂无记录',
      })
    );
    assert.match(html, /张三/);
  });
});
