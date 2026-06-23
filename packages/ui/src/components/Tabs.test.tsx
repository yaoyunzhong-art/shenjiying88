import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Tabs } = require('./Tabs');

const defaultItems = [
  { key: 'tab1', label: 'Tab One' },
  { key: 'tab2', label: 'Tab Two' },
  { key: 'tab3', label: 'Tab Three' },
];

describe('Tabs', () => {
  test('renders all tab buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tabs, { items: defaultItems, activeKey: 'tab1', onChange: () => {} }),
    );
    assert.match(html, /Tab One/);
    assert.match(html, /Tab Two/);
    assert.match(html, /Tab Three/);
  });

  test('marks active tab as selected', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tabs, { items: defaultItems, activeKey: 'tab2', onChange: () => {} }),
    );
    assert.match(html, /aria-selected="true"/);
    assert.match(html, /aria-selected="false"/);
  });

  test('returns null for empty items', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tabs, { items: [], activeKey: '', onChange: () => {} }),
    );
    assert.equal(html, '');
  });

  test('renders counts when provided', () => {
    const items = [
      { key: 'a', label: 'All', count: 42 },
      { key: 'b', label: 'Active', count: 5 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Tabs, { items, activeKey: 'a', onChange: () => {} }),
    );
    assert.match(html, /42/);
    assert.match(html, /5/);
  });

  test('renders with underline variant styling', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tabs, { items: defaultItems, activeKey: 'tab1', onChange: () => {}, variant: 'underline' }),
    );
    assert.match(html, /border-bottom/);
  });

  test('renders with segment variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tabs, { items: defaultItems, activeKey: 'tab1', onChange: () => {}, variant: 'segment' }),
    );
    assert.match(html, /border-radius:12px/);
  });

  test('renders with pills variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tabs, { items: defaultItems, activeKey: 'tab1', onChange: () => {}, variant: 'pills' }),
    );
    assert.match(html, /border-radius:999px/);
  });

  test('renders small size', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tabs, { items: defaultItems, activeKey: 'tab1', onChange: () => {}, size: 'sm' }),
    );
    assert.match(html, /font-size:13px/);
  });

  test('applies fill style when fill=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tabs, { items: defaultItems, activeKey: 'tab1', onChange: () => {}, fill: true }),
    );
    assert.match(html, /width:100%/);
  });

  test('has tablist role on container', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tabs, { items: defaultItems, activeKey: 'tab1', onChange: () => {} }),
    );
    assert.match(html, /role="tablist"/);
  });
});
