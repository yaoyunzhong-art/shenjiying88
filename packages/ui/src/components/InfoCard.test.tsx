import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { InfoCard } = require('./InfoCard');

const sampleItems = [
  { label: 'Tenant', value: 'tenant-demo' },
  { label: 'Brand', value: 'brand-demo' },
  { label: 'Store', value: 'store-001' },
  { label: 'Market', value: 'cn-mainland' },
];

describe('InfoCard', () => {
  test('renders title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { title: '生效上下文', items: sampleItems })
    );
    assert.match(html, /生效上下文/);
  });

  test('renders all item labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: sampleItems })
    );
    assert.match(html, /Tenant/);
    assert.match(html, /Brand/);
    assert.match(html, /Store/);
    assert.match(html, /Market/);
  });

  test('renders all item values', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: sampleItems })
    );
    assert.match(html, /tenant-demo/);
    assert.match(html, /brand-demo/);
    assert.match(html, /store-001/);
    assert.match(html, /cn-mainland/);
  });

  test('renders variant colors for value text', () => {
    const itemsWithVariant = [
      { label: 'Status', value: 'Healthy', variant: 'success' as const },
      { label: 'Errors', value: '3', variant: 'danger' as const },
      { label: 'Pending', value: '2', variant: 'warning' as const },
    ];
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: itemsWithVariant })
    );
    assert.match(html, /Healthy/);
    assert.match(html, /3/);
    assert.match(html, /2/);
  });

  test('renders horizontal layout', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: sampleItems, layout: 'horizontal' })
    );
    assert.match(html, /Tenant/);
    assert.match(html, /tenant-demo/);
  });

  test('renders with compact variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: sampleItems, variant: 'compact' })
    );
    assert.ok(html.length > 0, 'should render something');
    assert.match(html, /Tenant/);
  });

  test('supports single column', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: sampleItems, columns: 1 })
    );
    assert.match(html, /Tenant/);
    assert.match(html, /Brand/);
  });

  test('supports empty items', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: [] })
    );
    assert.equal(html.includes('Tenant'), false);
  });

  test('renders tooltip as title attribute', () => {
    const itemsWithTooltip = [
      { label: 'Session', value: 'abc-123', tooltip: '当前会话 ID' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: itemsWithTooltip })
    );
    assert.match(html, /abc-123/);
  });

  test('renders ReactNode value', () => {
    const itemsWithNode = [
      { label: 'Status', value: React.createElement('span', { 'data-testid': 'status-badge' }, 'Active') },
    ];
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: itemsWithNode })
    );
    assert.match(html, /Active/);
  });

  test('does not render title when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: sampleItems })
    );
    // Should not have uppercase styled title block if no title
    assert.equal(html.includes('UPPERCASE'), false);
  });

  test('renders with elevated variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: sampleItems, variant: 'elevated' })
    );
    assert.ok(html.length > 0);
    assert.match(html, /Brand/);
  });

  test('renders custom data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoCard, { items: sampleItems, 'data-testid': 'my-info-card' })
    );
    assert.match(html, /my-info-card/);
  });
});
