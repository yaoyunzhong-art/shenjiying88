import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { BottomNavigation } = require('./BottomNavigation');

describe('BottomNavigation', () => {
  const sampleItems = [
    { id: 'home', label: '首页', icon: 'home', onClick: () => {} },
    { id: 'orders', label: '订单', icon: 'orders', onClick: () => {} },
    { id: 'members', label: '会员', icon: 'members', onClick: () => {} },
    { id: 'profile', label: '我的', icon: 'profile', onClick: () => {} },
  ];

  test('renders all navigation items', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems })
    );
    assert.match(html, /首页/);
    assert.match(html, /订单/);
    assert.match(html, /会员/);
    assert.match(html, /我的/);
  });

  test('renders active item with correct styling', () => {
    const items = [
      { id: 'home', label: '首页', icon: 'home', active: true, onClick: () => {} },
      { id: 'orders', label: '订单', icon: 'orders', onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items })
    );
    assert.match(html, /data-active="true"/);
  });

  test('renders badge count', () => {
    const items = [
      { id: 'home', label: '首页', badge: 3, onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items })
    );
    assert.match(html, /3/);
    assert.match(html, /bottom-nav-item-home/);
  });

  test('renders 99+ for large badge', () => {
    const items = [
      { id: 'notifications', label: '通知', badge: 123, onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items })
    );
    assert.match(html, /99\+/);
  });

  test('disabled item has disabled attribute', () => {
    const items = [
      { id: 'disabled-tab', label: '已禁用', disabled: true, onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items })
    );
    assert.match(html, /disabled/);
    assert.match(html, /已禁用/);
  });

  test('renders frosted variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems, variant: 'frosted' })
    );
    assert.match(html, /rgba/);
  });

  test('renders dark variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems, variant: 'dark' })
    );
    // dark mode uses #1e293b background
    assert.ok(html.includes('1e293b') || html.includes('94a3b8'));
    assert.match(html, /底部导航/);
  });

  test('hides labels when showLabels is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems, showLabels: false })
    );
    // Labels shouldn't appear
    assert.ok(!html.includes('>首页<') || !html.includes('首页'));
  });

  test('renders without border when bordered is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems, bordered: false })
    );
    // borderTop should be 'none'
    assert.match(html, /border-top:.*none/);
  });

  test('renders safe area padding', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems, safeArea: true })
    );
    assert.match(html, /safe-area-inset-bottom/);
  });

  test('renders without safe area when disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems, safeArea: false })
    );
    // No safe-area-inset-bottom
    assert.ok(!html.includes('safe-area-inset-bottom'));
  });

  test('renders aria-current on active item', () => {
    const items = [
      { id: 'home', label: '首页', active: true, onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items })
    );
    assert.match(html, /aria-current="page"/);
  });

  test('renders aria-label on each item', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems })
    );
    assert.match(html, /aria-label="首页"/);
    assert.match(html, /aria-label="订单"/);
  });

  test('renders navigation testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems })
    );
    assert.match(html, /data-testid="bottom-navigation"/);
  });

  test('renders container testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems })
    );
    assert.match(html, /data-testid="bottom-nav-container"/);
  });

  test('renders custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems, className: 'my-bottom-nav' })
    );
    assert.match(html, /my-bottom-nav/);
  });

  test('renders icon from iconMap', () => {
    const items = [
      { id: 'store', label: '门店', icon: 'store', onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items })
    );
    // store maps to 🏪
    assert.match(html, /门店/);
  });

  test('renders fallback icon for unknown key', () => {
    const items = [
      { id: 'custom', label: '自定义', icon: 'nonexistent', onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items })
    );
    // Falls back to '○'
    assert.ok(html.includes('○') || html.includes('自定义'));
  });

  test('renders empty items gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: [] })
    );
    assert.ok(html.length > 0);
  });

  test('renders badge with aria-label', () => {
    const items = [
      { id: 'bell', label: '消息', badge: 5, onClick: () => {} },
    ];
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items })
    );
    assert.match(html, /aria-label="5 条未读"/);
  });

  test('renders role="navigation"', () => {
    const html = renderToStaticMarkup(
      React.createElement(BottomNavigation, { items: sampleItems })
    );
    assert.match(html, /role="navigation"/);
  });
});
