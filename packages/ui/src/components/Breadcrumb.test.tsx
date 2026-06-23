import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Breadcrumb } = require('./Breadcrumb');

describe('Breadcrumb', () => {
  // ---------- basic rendering ----------
  test('renders nothing when items is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, { items: [] })
    );
    assert.doesNotMatch(html, /<nav/);
  });

  test('renders a single item as current page', () => {
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, { items: [{ label: 'Home' }] })
    );
    assert.match(html, /Home/);
    assert.match(html, /aria-current="page"/);
  });

  test('renders two items with separator', () => {
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, {
        items: [{ label: 'Home', href: '/' }, { label: 'Dashboard' }],
      })
    );
    assert.match(html, /Home/);
    assert.match(html, /Dashboard/);
    assert.match(html, /data-testid="breadcrumb-sep-0"/);
  });

  // ---------- links ----------
  test('renders middle items as links when href is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: 'Detail' },
        ],
      })
    );
    assert.match(html, /Home/);
    assert.match(html, /Products/);
    assert.match(html, /Detail/);
    assert.match(html, /href="\/"/);
    assert.match(html, /href="\/products"/);
  });

  // ---------- button item (no href) ----------
  test('renders button for item with onClick but no href', () => {
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, {
        items: [
          { label: 'Back', onClick: () => {} },
          { label: 'Current' },
        ],
      })
    );
    assert.match(html, /Back/);
    assert.match(html, /<button/);
    assert.match(html, /Current/);
  });

  // ---------- custom separator ----------
  test('renders custom separator', () => {
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, {
        items: [
          { label: 'A', href: '/a' },
          { label: 'B', href: '/b' },
          { label: 'C' },
        ],
        separator: '>',
      })
    );
    assert.match(html, /breadcrumb-sep-0/);
    // React may encode > as &gt; in static markup
    assert.ok(html.includes('&gt;') || html.includes('>'));
    assert.match(html, /breadcrumb-sep-1/);
  });

  // ---------- maxItems / collapse ----------
  test('collapses when items exceed maxItems', () => {
    const items = [
      { label: 'Home' },
      { label: 'Category' },
      { label: 'Subcategory' },
      { label: 'Product' },
      { label: 'Edit' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, { items, maxItems: 3 })
    );
    // should show: Home, …, Edit
    assert.match(html, /Home/);
    assert.match(html, /Edit/);
    assert.match(html, /data-testid="breadcrumb-ellipsis"/);
    assert.doesNotMatch(html, /Category/);
    assert.doesNotMatch(html, /Subcategory/);
    assert.doesNotMatch(html, /Product/);
  });

  test('does not collapse when items length equals maxItems', () => {
    const items = [
      { label: 'Home' },
      { label: 'Category' },
      { label: 'Product' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, { items, maxItems: 3 })
    );
    assert.match(html, /Home/);
    assert.match(html, /Category/);
    assert.match(html, /Product/);
  });

  // ---------- accessibility ----------
  test('has aria-label on nav', () => {
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, {
        items: [{ label: 'Home' }, { label: 'Page' }],
      })
    );
    assert.match(html, /aria-label="Breadcrumb"/);
  });

  test('last item has aria-current="page"', () => {
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, {
        items: [
          { label: 'A', href: '/a' },
          { label: 'B', href: '/b' },
          { label: 'Current' },
        ],
      })
    );
    assert.match(html, /Current/);
    assert.match(html, /aria-current="page"/);
  });

  // ---------- data-testid override ----------
  test('accepts custom data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, {
        items: [{ label: 'Test' }],
        'data-testid': 'custom-breadcrumb',
      })
    );
    assert.match(html, /data-testid="custom-breadcrumb"/);
  });

  // ---------- many items ----------
  test('renders many items with separators between each', () => {
    const items = [
      { label: 'Step 1', href: '/step-1' },
      { label: 'Step 2', href: '/step-2' },
      { label: 'Step 3', href: '/step-3' },
      { label: 'Step 4', href: '/step-4' },
      { label: 'End' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Breadcrumb, { items })
    );
    assert.match(html, /Step 1/);
    assert.match(html, /End/);
    // separators: 4 separators for 5 items
    assert.match(html, /breadcrumb-sep-0/);
    assert.match(html, /breadcrumb-sep-1/);
    assert.match(html, /breadcrumb-sep-2/);
    assert.match(html, /breadcrumb-sep-3/);
    assert.doesNotMatch(html, /breadcrumb-sep-4/);
  });
});
