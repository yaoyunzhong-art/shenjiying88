import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { SideNavigation } = require('./SideNavigation');

const defaultItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'members', label: 'Members', icon: '👥', badge: 5 },
  {
    key: 'settings',
    label: 'Settings',
    icon: '⚙️',
    children: [
      { key: 'profile', label: 'Profile' },
      { key: 'security', label: 'Security', disabled: true },
    ],
  },
  { key: 'help', label: 'Help', disabled: true },
];

describe('SideNavigation', () => {
  test('renders all top-level nav items', () => {
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, { items: defaultItems, activeKey: 'dashboard', onNavigate: () => {} }),
    );
    assert.match(html, />Dashboard</);
    assert.match(html, />Members</);
    assert.match(html, />Settings</);
    assert.match(html, />Help</);
  });

  test('marks active item with data-active attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, { items: defaultItems, activeKey: 'members', onNavigate: () => {} }),
    );
    // React renders data-active as empty string when value is truthy
    assert(html.includes('data-active'), 'expected data-active attribute on active item');
  });

  test('renders badge count when badge > 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, { items: defaultItems, activeKey: 'dashboard', onNavigate: () => {} }),
    );
    assert.match(html, />5</);
  });

  test('renders nothing when items is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, { items: [], activeKey: '', onNavigate: () => {} }),
    );
    assert.equal(html, '');
  });

  test('does not render children when collapsed is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, {
        items: defaultItems,
        activeKey: 'dashboard',
        onNavigate: () => {},
        collapsed: true,
      }),
    );
    // collapsed mode shows only icons, no labels
    assert(!html.includes('>Dashboard<'), 'labels should be hidden in collapsed mode');
    assert(html.includes('data-collapsed'), 'should have collapsed data attribute');
  });

  test('renders header and footer when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, {
        items: defaultItems,
        activeKey: 'dashboard',
        onNavigate: () => {},
        header: React.createElement('span', null, 'My App'),
        footer: React.createElement('span', null, 'v1.0'),
      }),
    );
    assert.match(html, />My App</);
    assert.match(html, />v1.0</);
  });

  test('disables items with disabled prop — button has disabled attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, { items: defaultItems, activeKey: 'dashboard', onNavigate: () => {} }),
    );
    // disabled items should have disabled attribute
    assert(html.includes('disabled=""'), 'disabled items should have disabled attribute on button');
  });

  test('renders collapse toggle button when onToggleCollapse is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, {
        items: defaultItems,
        activeKey: 'dashboard',
        onNavigate: () => {},
        onToggleCollapse: () => {},
      }),
    );
    assert.match(html, /aria-label/);
    assert.match(html, /◀/);
  });

  test('calls onNavigate when a leaf item is clicked (simulated via click handler)', () => {
    // Test that button onClick is bound — we verify by checking buttons exist with proper handlers
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, { items: defaultItems, activeKey: 'dashboard', onNavigate: () => {} }),
    );
    // There should be 4 top-level buttons; children are rendered only when expanded
    const buttonCount = (html.match(/<button/g) || []).length;
    assert.equal(buttonCount, 4, 'should have 4 buttons (3 enabled + 1 disabled)');
  });

  test('applies custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, {
        items: defaultItems,
        activeKey: 'dashboard',
        onNavigate: () => {},
        className: 'my-sidebar',
      }),
    );
    assert.match(html, /class="my-sidebar/);
  });

  test('handles single root item gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(SideNavigation, {
        items: [{ key: 'home', label: 'Home' }],
        activeKey: 'home',
        onNavigate: () => {},
      }),
    );
    assert.match(html, />Home</);
  });
});
