import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { WorkbenchHeader } = require('./WorkbenchHeader');

const BASE_PROPS = {
  channel: 'Platform',
  title: '运营管理工作台',
  description: '管理门店运营',
  breadcrumbs: [
    { label: '首页', href: '/' },
    { label: '工作台' },
  ],
  navItems: [
    { key: 'ops', label: '运营管理', href: '/operations', description: '门店运营概览' },
    { key: 'alerts', label: '告警中心', href: '/alerts', badge: 3 },
    { key: 'members', label: '会员管理', href: '/members', badge: 0 },
  ],
};

describe('WorkbenchHeader', () => {
  test('renders channel, title and description', () => {
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, BASE_PROPS));
    assert.match(html, /Platform/);
    assert.match(html, /运营管理工作台/);
    assert.match(html, /管理门店运营/);
  });

  test('renders breadcrumbs with home and current page', () => {
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, BASE_PROPS));
    assert.match(html, /首页/);
    assert.match(html, /工作台/);
    assert.match(html, /data-testid="workbench-breadcrumbs"/);
  });

  test('renders nav items', () => {
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, BASE_PROPS));
    assert.match(html, /data-testid="workbench-nav-ops"/);
    assert.match(html, /data-testid="workbench-nav-alerts"/);
    assert.match(html, /运营管理/);
    assert.match(html, /告警中心/);
  });

  test('shows badge when badge > 0', () => {
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, BASE_PROPS));
    // alerts has badge=3 — should be visible
    assert.match(html, /3/);
  });

  test('does not show badge element when badge is 0', () => {
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, BASE_PROPS));
    // members has badge=0 — the nav-item wrapper exists but no inline badge with number 0
    assert.match(html, /data-testid="workbench-nav-members"/);
    // The members entry should NOT have a background:#ef4444 badge span
    const membersMatch = html.match(/workbench-nav-members[^<]*<[^>]*>[\s\S]*?会员管理[\s\S]*?<\/div><\/div>/);
    assert.ok(membersMatch, 'members nav item should exist');
    // Confirm there's no red badge span inside the members item
    assert.doesNotMatch(membersMatch![0], /background:#ef4444/);
  });

  test('renders loading skeleton when loading is true', () => {
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, {
      channel: 'Admin',
      title: 'Test',
      loading: true,
    }));
    assert.match(html, /data-testid="workbench-header-loading"/);
    // loading state should not show title
    assert.doesNotMatch(html, /workbench-title/);
  });

  test('renders action buttons when provided', () => {
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, {
      channel: 'Admin',
      title: 'Test',
      actions: React.createElement('button', { type: 'button' }, '新建'),
    }));
    assert.match(html, /data-testid="workbench-actions"/);
    assert.match(html, /新建/);
  });

  test('renders without navItems when not provided', () => {
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, {
      channel: 'Admin',
      title: 'Simple',
    }));
    assert.doesNotMatch(html, /workbench-nav-items/);
  });

  test('renders without breadcrumbs when not provided', () => {
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, {
      channel: 'Admin',
      title: 'Simple',
    }));
    assert.doesNotMatch(html, /workbench-breadcrumbs/);
  });

  test('accepts custom data-testid', () => {
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, {
      channel: 'X',
      title: 'Y',
      'data-testid': 'custom-header',
    }));
    assert.match(html, /custom-header/);
    assert.doesNotMatch(html, /data-testid="workbench-header"/);
  });

  test('renders nav item icon when provided', () => {
    const Icon = () => React.createElement('span', { 'data-testid': 'custom-icon' }, '🔧');
    const html = renderToStaticMarkup(React.createElement(WorkbenchHeader, {
      channel: 'Test',
      title: 'Test',
      navItems: [
        { key: 'test', label: 'Test', href: '/test', icon: React.createElement(Icon) },
      ],
    }));
    assert.match(html, /data-testid="custom-icon"/);
  });
});
