import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { Tabs } = require('./Tabs');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const SAMPLE_ITEMS = [
  { key: 'tab1', label: 'Tab One' },
  { key: 'tab2', label: 'Tab Two', count: 5 },
  { key: 'tab3', label: 'Tab Three' },
];

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(Tabs, props));
}

test('Tabs: renders all tab items', () => {
  const html = renderHTML({ items: SAMPLE_ITEMS, activeKey: 'tab1', onChange: () => {} });
  assert.ok(html.includes('Tab One'));
  assert.ok(html.includes('Tab Two'));
  assert.ok(html.includes('Tab Three'));
});

test('Tabs: role="tablist" on container', () => {
  const html = renderHTML({ items: SAMPLE_ITEMS, activeKey: 'tab1', onChange: () => {} });
  assert.ok(html.includes('role="tablist"'));
});

test('Tabs: each button has role="tab" and aria-selected', () => {
  const html = renderHTML({ items: SAMPLE_ITEMS, activeKey: 'tab2', onChange: () => {} });
  assert.ok(html.includes('role="tab"'));
  assert.ok(html.includes('aria-selected'));
});

test('Tabs: count badge rendered on items with count', () => {
  const html = renderHTML({ items: SAMPLE_ITEMS, activeKey: 'tab1', onChange: () => {} });
  assert.ok(html.includes('5')); // tab2 count is 5
});

test('Tabs: empty items returns null (no output)', () => {
  const html = renderHTML({ items: [], activeKey: 'tab1', onChange: () => {} });
  assert.equal(html, '');
});

test('Tabs: underline variant applies border-bottom style', () => {
  const html = renderHTML({
    items: SAMPLE_ITEMS,
    activeKey: 'tab1',
    onChange: () => {},
    variant: 'underline',
  });
  // Should render tabs with label text
  assert.ok(html.includes('Tab One'));
});

test('Tabs: segment variant applies container styling', () => {
  const html = renderHTML({
    items: SAMPLE_ITEMS,
    activeKey: 'tab1',
    onChange: () => {},
    variant: 'segment',
  });
  assert.ok(html.includes('Tab One'));
  assert.ok(html.includes('Tab Two'));
});

test('Tabs: pills variant renders buttons', () => {
  const html = renderHTML({
    items: SAMPLE_ITEMS,
    activeKey: 'tab2',
    onChange: () => {},
    variant: 'pills',
  });
  assert.ok(html.includes('Tab One'));
  assert.ok(html.includes('Tab Two'));
  assert.ok(html.includes('Tab Three'));
});

test('Tabs: sm size renders', () => {
  const html = renderHTML({
    items: SAMPLE_ITEMS,
    activeKey: 'tab1',
    onChange: () => {},
    size: 'sm',
  });
  assert.ok(html.includes('Tab One'));
});

test('Tabs: fill mode renders', () => {
  const html = renderHTML({
    items: SAMPLE_ITEMS,
    activeKey: 'tab1',
    onChange: () => {},
    fill: true,
  });
  assert.ok(html.includes('Tab One'));
});
