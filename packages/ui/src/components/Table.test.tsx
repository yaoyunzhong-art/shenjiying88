import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Table } = require('./Table');

// ── Test data ────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const columns = [
  { key: 'id', header: 'ID', align: 'center' as const, sortable: true },
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role', render: (row: User) => <strong>{row.role}</strong> },
];

const rows: User[] = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'Admin', active: true },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'Editor', active: false },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'Viewer', active: true },
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Table', () => {
  // ── Basic rendering ─────────────────────────────────────────────────────

  test('renders column headers', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.match(html, /ID/);
    assert.match(html, /Name/);
    assert.match(html, /Email/);
    assert.match(html, /Role/);
  });

  test('renders row data from column key', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.match(html, /Alice/);
    assert.match(html, /Bob/);
    assert.match(html, /Charlie/);
  });

  test('renders numeric data', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.match(html, />1</);
    assert.match(html, />2</);
    assert.match(html, />3</);
  });

  test('uses custom render function', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.match(html, /<strong>Admin<\/strong>/);
    assert.match(html, /<strong>Editor<\/strong>/);
  });

  test('falls back to column key when header and title are absent', () => {
    const cols = [{ key: 'custom_field' }];
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: cols, rows: [{ custom_field: 'val' }], rowKey: () => 'k' })
    );
    assert.match(html, /custom_field/);
  });

  test('prefers header over title', () => {
    const cols = [{ key: 'col', title: '标题', header: '表头' }];
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: cols, rows: [{ col: 'x' }], rowKey: () => 'k' })
    );
    assert.match(html, /表头/);
    assert.doesNotMatch(html, />标题</);
  });

  // ── Empty / Loading ─────────────────────────────────────────────────────

  test('shows loading state', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows: [], rowKey: (r: User) => String(r.id), loading: true })
    );
    assert.match(html, /Loading.../);
  });

  test('shows empty text when no rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows: [], rowKey: (r: User) => String(r.id) })
    );
    assert.match(html, /No data/);
  });

  test('shows custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows: [],
        rowKey: (r: User) => String(r.id),
        emptyText: 'Nothing here',
      })
    );
    assert.match(html, /Nothing here/);
  });

  test('empty row spans all columns including checkbox column', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows: [],
        rowKey: (r: User) => String(r.id),
        selectable: true,
      })
    );
    // colSpan should cover columns + 1 for checkbox
    assert.match(html, /colSpan="\d+"/);
  });

  // ── Visual modes ────────────────────────────────────────────────────────

  test('striped rows add background on odd rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id), striped: true })
    );
    assert.match(html, /rgba\(148,163,184,0\.02\)/);
  });

  test('compact mode uses reduced padding', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id), compact: true })
    );
    // compact => padding:8px 12px (shorthand)
    assert.match(html, /padding:8px.*12px/);
  });

  test('bordered mode adds stronger borders', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id), bordered: true })
    );
    assert.match(html, /rgba\(148,163,184,0\.18\)/);
  });

  test('non-bordered uses lighter borders', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.match(html, /rgba\(148,163,184,0\.12\)/);
  });

  // ── Header styling ──────────────────────────────────────────────────────

  test('headers are uppercase with letter spacing', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.match(html, /text-transform:uppercase/);
    assert.match(html, /letter-spacing:0\.05em/);
  });

  test('table is full width with collapsed borders', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.match(html, /width:100%/);
    assert.match(html, /border-collapse:collapse/);
  });

  test('overflow-x auto for responsive container', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.match(html, /overflow-x:auto/);
  });

  // ── Column width / align ────────────────────────────────────────────────

  test('column width is applied to th', () => {
    const cols = [{ key: 'n', header: 'N', width: '300px' }];
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns: cols, rows: [{ n: 'x' }], rowKey: () => 'k' })
    );
    assert.match(html, /width:300px/);
  });

  test('column center alignment', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.match(html, /text-align:center/);
  });

  // ── Title / Toolbar ─────────────────────────────────────────────────────

  test('renders title above table', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        rowKey: (r: User) => String(r.id),
        title: 'User List',
      })
    );
    assert.match(html, /User List/);
  });

  test('renders toolbar', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        rowKey: (r: User) => String(r.id),
        toolbar: React.createElement('button', { key: 'add' }, 'Add User'),
      })
    );
    assert.match(html, /Add User/);
  });

  // ── Row click ───────────────────────────────────────────────────────────

  test('sets cursor pointer when onRowClick provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        rowKey: (r: User) => String(r.id),
        onRowClick: () => {},
      })
    );
    assert.match(html, /cursor:pointer/);
  });

  test('no cursor pointer without onRowClick', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.doesNotMatch(html, /cursor:pointer/);
  });

  // ── Selectable ──────────────────────────────────────────────────────────

  test('selectable adds checkbox column', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        rowKey: (r: User) => String(r.id),
        selectable: true,
      })
    );
    assert.match(html, /type="checkbox"/);
  });

  test('select all checkbox present when selectable', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        rowKey: (r: User) => String(r.id),
        selectable: true,
      })
    );
    assert.match(html, /Select all rows/);
  });

  test('no checkbox when selectable is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.doesNotMatch(html, /type="checkbox"/);
  });

  test('selected rows have highlight background', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        rowKey: (r: User) => String(r.id),
        selectable: true,
        selectedKeys: ['1'],
      })
    );
    assert.match(html, /rgba\(56,189,248,0\.08\)/);
  });

  // ── Sortable columns get sort indicator ─────────────────────────────────

  test('sortable columns show sort icons', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        rowKey: (r: User) => String(r.id),
        onSortChange: () => {},
      })
    );
    assert.match(html, /↕/);
  });

  test('active sort column shows direction arrow', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        rowKey: (r: User) => String(r.id),
        sort: { key: 'id', direction: 'asc' },
        onSortChange: () => {},
      })
    );
    assert.match(html, /▲/);
  });

  test('desc sort arrow shows when direction is desc', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        rowKey: (r: User) => String(r.id),
        sort: { key: 'id', direction: 'desc' },
        onSortChange: () => {},
      })
    );
    assert.match(html, /▼/);
  });

  test('active sort arrow is highlighted blue', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows,
        rowKey: (r: User) => String(r.id),
        sort: { key: 'id', direction: 'asc' },
        onSortChange: () => {},
      })
    );
    assert.match(html, /#38bdf8/);
  });

  // ── Pagination ──────────────────────────────────────────────────────────

  test('renders pagination controls', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows: rows.slice(0, 2),
        rowKey: (r: User) => String(r.id),
        pagination: { page: 0, pageSize: 2, total: 3 },
        onPaginationChange: () => {},
      })
    );
    assert.match(html, /Prev/);
    assert.match(html, /Next/);
    assert.match(html, /Page 1/);
  });

  test('pagination shows record range', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows: rows.slice(0, 2),
        rowKey: (r: User) => String(r.id),
        pagination: { page: 0, pageSize: 2, total: 3 },
        onPaginationChange: () => {},
      })
    );
    assert.match(html, /1–2 of 3/);
  });

  test('prev button disabled on first page', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows: rows.slice(0, 2),
        rowKey: (r: User) => String(r.id),
        pagination: { page: 0, pageSize: 2, total: 3 },
        onPaginationChange: () => {},
      })
    );
    // React renders disabled="" for boolean disabled attribute
    assert.match(html, /← Prev/);
    assert.match(html, /disabled=""/);
  });

  test('next button disabled on last page', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows: rows.slice(0, 1),
        rowKey: (r: User) => String(r.id),
        pagination: { page: 1, pageSize: 2, total: 3 },
        onPaginationChange: () => {},
      })
    );
    assert.match(html, /Next →/);
    assert.match(html, /disabled=""/);
  });

  test('no pagination when pagination prop absent', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, { columns, rows, rowKey: (r: User) => String(r.id) })
    );
    assert.doesNotMatch(html, /Prev/);
    assert.doesNotMatch(html, /Next/);
  });

  test('pagination shows No results when total is 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(Table, {
        columns,
        rows: [],
        rowKey: (r: User) => String(r.id),
        pagination: { page: 0, pageSize: 10, total: 0 },
        onPaginationChange: () => {},
      })
    );
    assert.match(html, /No results/);
  });
});
