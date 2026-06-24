import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ListToolbar } = require('./ListToolbar');
import type {
  ListToolbarSortOption,
  ListToolbarFilterOption,
  ListToolbarViewMode,
  ListToolbarBatchAction,
} from './ListToolbar';

const sortOptions: ListToolbarSortOption[] = [
  { key: 'name', label: '按名称' },
  { key: 'date', label: '按日期' },
  { key: 'status', label: '按状态' },
];

const filterOptions: ListToolbarFilterOption[] = [
  { key: 'active', label: '启用', active: false },
  { key: 'inactive', label: '禁用', active: false },
  { key: 'pending', label: '待审核', active: false },
];

const viewModes: ListToolbarViewMode[] = [
  { key: 'table', label: '表格' },
  { key: 'grid', label: '网格' },
  { key: 'card', label: '卡片' },
];

const batchActions: ListToolbarBatchAction[] = [
  { key: 'delete', label: '批量删除', variant: 'danger' },
  { key: 'approve', label: '批量审批', variant: 'primary' },
  { key: 'export', label: '导出', variant: 'default' },
];

describe('ListToolbar', () => {
  test('renders search input with placeholder', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { searchPlaceholder: '查找订单...' })
    );
    assert.match(html, /placeholder="查找订单\.\.\."/);
  });

  test('renders default search placeholder', () => {
    const html = renderToStaticMarkup(React.createElement(ListToolbar, {}));
    assert.match(html, /placeholder="搜索\.\.\."/);
  });

  test('renders sort select with options', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { sortOptions })
    );
    assert.match(html, /按名称/);
    assert.match(html, /按日期/);
    assert.match(html, /按状态/);
    assert.match(html, /list-toolbar-sort-select/);
  });

  test('does not render sort select when empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { sortOptions: [] })
    );
    assert.ok(!html.includes('list-toolbar-sort-select'));
  });

  test('renders sort direction toggle when sort key is active', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, {
        sortOptions,
        activeSortKey: 'name',
        sortDirection: 'asc',
        onSortDirectionChange: () => {},
      })
    );
    assert.match(html, /list-toolbar-sort-direction/);
  });

  test('no sort direction toggle without active sort key', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { sortOptions })
    );
    assert.ok(!html.includes('list-toolbar-sort-direction'));
  });

  test('renders filter chips', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { filterOptions })
    );
    assert.match(html, /启用/);
    assert.match(html, /禁用/);
    assert.match(html, /待审核/);
    assert.match(html, /list-toolbar-filters/);
  });

  test('renders view mode toggle buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { viewModes })
    );
    assert.match(html, /list-toolbar-view-modes/);
    assert.match(html, /view-mode-table/);
    assert.match(html, /view-mode-grid/);
    assert.match(html, /view-mode-card/);
  });

  test('renders create button when label and handler provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { createLabel: '新建记录', onCreate: () => {} })
    );
    assert.match(html, /list-toolbar-create/);
    assert.match(html, /新建记录/);
  });

  test('does not render create button without handler', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { createLabel: '新建记录' })
    );
    assert.ok(!html.includes('list-toolbar-create'));
  });

  test('renders total count', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { totalCount: 42, totalLabel: '条记录' })
    );
    assert.match(html, /共 42 条记录/);
  });

  test('does not render total count when undefined', () => {
    const html = renderToStaticMarkup(React.createElement(ListToolbar, {}));
    assert.ok(!html.includes('list-toolbar-total'));
  });

  test('renders batch actions bar when selectedCount > 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, {
        batchActions,
        selectedCount: 5,
        onBatchAction: () => {},
      })
    );
    assert.match(html, /list-toolbar-batch-bar/);
    assert.match(html, /已选择 5 项/);
    assert.match(html, /批量删除/);
    assert.match(html, /批量审批/);
    assert.match(html, /导出/);
  });

  test('does not render batch bar when selectedCount is 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, {
        batchActions,
        selectedCount: 0,
      })
    );
    assert.ok(!html.includes('list-toolbar-batch-bar'));
  });

  test('renders children slot', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ListToolbar,
        {},
        React.createElement('span', { 'data-testid': 'custom-child' }, 'Custom content')
      )
    );
    assert.match(html, /custom-child/);
    assert.match(html, /Custom content/);
  });

  test('applies custom data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { 'data-testid': 'my-toolbar' })
    );
    assert.match(html, /my-toolbar/);
  });

  test('applies disabled state', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { disabled: true })
    );
    // Disabled toolbar has opacity 0.5
    assert.match(html, /opacity:\s*0\.5/);
  });

  test('shows clear search button when search value present', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { searchValue: 'test-query' })
    );
    assert.match(html, /list-toolbar-search-clear/);
    assert.match(html, /aria-label="清除搜索"/);
  });

  test('no clear button when search is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { searchValue: '' })
    );
    assert.ok(!html.includes('list-toolbar-search-clear'));
  });

  test('renders active filter count and clear button', () => {
    const activeFilters: ListToolbarFilterOption[] = [
      { key: 'active', label: '启用', active: true },
      { key: 'inactive', label: '禁用', active: true },
      { key: 'pending', label: '待审核', active: false },
    ];
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, {
        filterOptions: activeFilters,
        onClearFilters: () => {},
      })
    );
    assert.match(html, /清除 \(2\)/);
  });

  test('no clear filters when no active filters', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, { filterOptions })
    );
    assert.ok(!html.includes('list-toolbar-clear-filters'));
  });

  test('renders active view mode with highlight', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, {
        viewModes,
        activeViewMode: 'grid',
      })
    );
    // Grid button should have active background
    assert.match(html, /view-mode-grid/);
    assert.match(html, /rgba\(59,\s*130,\s*246/);
  });

  test('renders sort direction asc arrow', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, {
        sortOptions,
        activeSortKey: 'name',
        sortDirection: 'asc',
        onSortDirectionChange: () => {},
      })
    );
    assert.match(html, /↑/);
  });

  test('renders sort direction desc arrow', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, {
        sortOptions,
        activeSortKey: 'name',
        sortDirection: 'desc',
        onSortDirectionChange: () => {},
      })
    );
    assert.match(html, /↓/);
  });

  test('renders disabled batch action', () => {
    const disabledActions: ListToolbarBatchAction[] = [
      { key: 'delete', label: '批量删除', variant: 'danger', disabled: true },
    ];
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, {
        batchActions: disabledActions,
        selectedCount: 3,
        onBatchAction: () => {},
      })
    );
    assert.match(html, /disabled/);
  });

  test('renders full toolbar with all features', () => {
    const html = renderToStaticMarkup(
      React.createElement(ListToolbar, {
        searchPlaceholder: '搜索会员...',
        sortOptions,
        activeSortKey: 'date',
        sortDirection: 'desc',
        onSortDirectionChange: () => {},
        filterOptions,
        viewModes,
        activeViewMode: 'table',
        batchActions,
        selectedCount: 10,
        onBatchAction: () => {},
        createLabel: '添加会员',
        onCreate: () => {},
        totalCount: 128,
        totalLabel: '位会员',
        'data-testid': 'full-toolbar',
      })
    );
    assert.match(html, /full-toolbar/);
    assert.match(html, /搜索会员\.\.\./);
    assert.match(html, /list-toolbar-sort-select/);
    assert.match(html, /list-toolbar-sort-direction/);
    assert.match(html, /list-toolbar-filters/);
    assert.match(html, /list-toolbar-view-modes/);
    assert.match(html, /list-toolbar-batch-bar/);
    assert.match(html, /list-toolbar-create/);
    assert.match(html, /共 128 位会员/);
  });
});
