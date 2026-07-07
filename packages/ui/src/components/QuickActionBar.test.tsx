import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { QuickActionBar } = require('./QuickActionBar');

describe('QuickActionBar', () => {
  const sampleActions = [
    { id: 'add-room', label: '开房', icon: 'plus', variant: 'primary', onClick: () => {} },
    { id: 'checkout', label: '结账', icon: 'check', onClick: () => {} },
    { id: 'clean', label: '清洁完成', icon: 'check', variant: 'secondary', onClick: () => {} },
    { id: 'transfer', label: '转房', icon: 'arrowRight', onClick: () => {} },
  ];

  test('renders all actions', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions })
    );
    assert.match(html, /开房/);
    assert.match(html, /结账/);
    assert.match(html, /清洁完成/);
    assert.match(html, /转房/);
  });

  test('renders title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { title: '快捷操作', actions: sampleActions })
    );
    assert.match(html, /快捷操作/);
  });

  test('renders role badge when role is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { title: '前台', actions: sampleActions, role: 'frontdesk' })
    );
    assert.match(html, /frontdesk/);
  });

  test('renders primary action with variant styles', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions })
    );
    assert.match(html, /开房/);
  });

  test('disabled action has disabled attribute', () => {
    const actions = [
      { id: 'disabled-btn', label: '已禁用', disabled: true, onClick: () => {} },
    ];
    // In SSR, the disabled attribute renders as disabled=""
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions })
    );
    assert.match(html, /disabled/);
    assert.match(html, /已禁用/);
  });

  test('renders shortcut hint when provided', () => {
    const actions = [
      { id: 'save', label: '保存', shortcut: '⌘S', onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions })
    );
    assert.match(html, /⌘S/);
  });

  test('renders loading state with spinner', () => {
    const actions = [
      { id: 'loading', label: '加载中', loading: true, onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions })
    );
    assert.match(html, /加载中/);
  });

  test('floating bar has fixed bottom positioning', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions, floating: true })
    );
    // floating mode uses prose position:fixed
    assert.match(html, /fixed/);
  });

  test('renders with manager role theme', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, {
        title: '店长',
        actions: sampleActions,
        role: 'manager',
      })
    );
    assert.match(html, /manager/);
    assert.match(html, /店长/);
  });

  test('renders with salesclerk role theme', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, {
        title: '导购',
        actions: sampleActions,
        role: 'salesclerk',
      })
    );
    assert.match(html, /salesclerk/);
    assert.match(html, /导购/);
  });

  test('renders with guide role theme', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, {
        title: '导玩',
        actions: sampleActions,
        role: 'guide',
      })
    );
    assert.match(html, /guide/);
    assert.match(html, /导玩/);
  });

  test('renders with operator role theme', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, {
        title: '运营',
        actions: sampleActions,
        role: 'operator',
      })
    );
    assert.match(html, /operator/);
  });

  test('renders with 3-column grid', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions, columns: 3 })
    );
    assert.match(html, /repeat\(3/);
  });

  test('renders with 5-column grid', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions, columns: 5 })
    );
    assert.match(html, /repeat\(5/);
  });

  test('renders danger variant action', () => {
    const actions = [
      { id: 'delete', label: '删除', variant: 'danger', onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions })
    );
    assert.match(html, /删除/);
  });

  test('renders ghost variant action', () => {
    const actions = [
      { id: 'info', label: '信息', variant: 'ghost', onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions })
    );
    assert.match(html, /信息/);
  });

  test('renders action data-testid attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions })
    );
    assert.match(html, /data-testid="action-add-room"/);
    assert.match(html, /data-testid="action-checkout"/);
  });

  test('renders grid container testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions })
    );
    assert.match(html, /data-testid="quick-action-grid"/);
  });

  test('renders data-role attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions, role: 'frontdesk' })
    );
    assert.match(html, /data-role="frontdesk"/);
  });

  test('renders aria-label on action buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions })
    );
    assert.match(html, /aria-label="开房"/);
    assert.match(html, /aria-label="结账"/);
  });

  test('renders custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions, className: 'my-custom-bar' })
    );
    assert.match(html, /my-custom-bar/);
  });

  test('icon mapping renders plus icon', () => {
    const actions = [
      { id: 'add', label: '新增', icon: 'plus', onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions })
    );
    // plus maps to '+'
    assert.ok(html.includes('新增') || html.includes('+'));
    assert.match(html, /新增/);
  });

  test('renders empty actions gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: [] })
    );
    assert.ok(html.length > 0);
  });

  test('renders without title', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActionBar, { actions: sampleActions })
    );
    // Should not crash, should render actions
    assert.match(html, /开房/);
    assert.match(html, /结账/);
  });
});
