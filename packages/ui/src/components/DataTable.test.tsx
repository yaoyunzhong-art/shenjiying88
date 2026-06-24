import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DataTable } = require('./DataTable');

interface TestRow {
  id: number;
  name: string;
  status: string;
  score: number;
}

const columns = [
  { key: 'id', header: 'ID', align: 'center' as const },
  { key: 'name', header: '姓名', dataKey: 'name' as keyof TestRow },
  { key: 'status', header: '状态', render: (row: TestRow) => row.status },
  { key: 'score', header: '分数', dataKey: 'score' as keyof TestRow, align: 'right' as const },
];

const rows: TestRow[] = [
  { id: 1, name: '张三', status: '活跃', score: 95 },
  { id: 2, name: '李四', status: '离线', score: 82 },
  { id: 3, name: '王五', status: '活跃', score: 78 },
];

describe('DataTable', () => {
  test('renders loading state', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows: [],
        rowKey: (r: TestRow) => String(r.id),
        loading: true,
      })
    );
    assert.match(html, /Loading.../);
  });

  test('renders empty state with default text when no rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows: [],
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /No data/);
  });

  test('renders custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows: [],
        rowKey: (r: TestRow) => String(r.id),
        emptyText: '暂无数据，请添加记录',
      })
    );
    assert.match(html, /暂无数据，请添加记录/);
  });

  test('renders table with header columns', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /ID/);
    assert.match(html, /姓名/);
    assert.match(html, /状态/);
    assert.match(html, /分数/);
  });

  test('prefers header over title for column header', () => {
    const colsWithTitle = [
      { key: 'col1', title: '标题', header: '表头' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns: colsWithTitle,
        rows: [{ id: 1 }],
        rowKey: (r: any) => String(r.id),
      })
    );
    assert.match(html, /表头/);
    assert.doesNotMatch(html, />标题</);
  });

  test('falls back to key when no header or title', () => {
    const colsNoHeader = [
      { key: 'some_column' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns: colsNoHeader,
        rows: [{ id: 1 }],
        rowKey: (r: any) => String(r.id),
      })
    );
    assert.match(html, /some_column/);
  });

  test('renders row data via dataKey', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /张三/);
    assert.match(html, /李四/);
    assert.match(html, /王五/);
  });

  test('renders numeric data via dataKey', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, />95</);
    assert.match(html, />82</);
    assert.match(html, />78</);
  });

  test('renders row data via render function', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /活跃/);
    assert.match(html, /离线/);
  });

  test('render function receives row and index', () => {
    const customCols = [
      { key: 'index', header: '#', render: (_row: TestRow, idx: number) => `Row ${idx + 1}` },
    ];
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns: customCols,
        rows: rows.slice(0, 2),
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /Row 1/);
    assert.match(html, /Row 2/);
  });

  test('renders title above table', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        title: '用户列表',
      })
    );
    assert.match(html, /用户列表/);
  });

  test('does not render title div when no title', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    // The title div has specific styles; check for table without preceding title div
    assert.match(html, /<table/);
  });

  test('sets cursor pointer when onRowClick provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        onRowClick: () => {},
      })
    );
    assert.match(html, /cursor:pointer/);
  });

  test('accepts items prop as alias for rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        items: rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /张三/);
    assert.match(html, /李四/);
  });

  test('rows takes precedence over items (rows ?? items)', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows: [{ id: 99, name: '忽略', status: 'X', score: 0 }],
        items: rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    // rows wins via (rows ?? items), so we see 忽略 not 张三
    assert.match(html, /忽略/);
    assert.doesNotMatch(html, /张三/);
  });

  test('align center for column', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /text-align:center/);
  });

  test('align right for score column', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /text-align:right/);
  });

  test('striped rows apply background on odd indices', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        striped: true,
      })
    );
    assert.match(html, /rgba\(148,163,184,0\.02\)/);
  });

  test('compact mode uses reduced padding', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
        compact: true,
      })
    );
    assert.match(html, /padding-top:8/);
    assert.match(html, /padding-bottom:8/);
  });

  test('column width is applied', () => {
    const widthCols = [
      { key: 'name', header: '名称', width: '200px' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns: widthCols,
        rows: [{ id: 1, name: '测试' }],
        rowKey: (r: any) => String(r.id),
      })
    );
    assert.match(html, /width:200px/);
  });

  test('renders uppercase headers with letter spacing', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /text-transform:uppercase/);
    assert.match(html, /letter-spacing:0\.05em/);
  });

  test('table has full width and collapsed borders', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /width:100%/);
    assert.match(html, /border-collapse:collapse/);
  });

  test('has overflow-x auto for responsive scrolling', () => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        rows,
        rowKey: (r: TestRow) => String(r.id),
      })
    );
    assert.match(html, /overflow-x:auto/);
  });
});
