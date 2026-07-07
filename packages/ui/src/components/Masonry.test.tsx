import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { Masonry, WaterfallMasonry } = require('./Masonry');

function renderMasonry(props: Record<string, unknown> = {}) {
  return typeof Masonry.render === 'function' ? Masonry.render(props, null) : Masonry(props);
}

function renderWaterfall(props: Record<string, unknown> = {}) {
  return typeof WaterfallMasonry.render === 'function'
    ? WaterfallMasonry.render(props, null)
    : WaterfallMasonry(props);
}

test('Masonry: renders with data-testid', () => {
  const el = renderMasonry({ 'data-testid': 'test-masonry', children: React.createElement('div') });
  assert.equal(el.props['data-testid'], 'test-masonry');
});

test('Masonry: applies columnCount from numeric columns prop', () => {
  const el = renderMasonry({ columns: 4, gap: 8, children: React.createElement('div') });
  assert.equal(el.props.style.columnCount, 4);
  assert.equal(el.props.style.columnGap, 8);
});

test('Masonry: uses default data-testid when not provided', () => {
  const el = renderMasonry({ children: React.createElement('div') });
  assert.equal(el.props['data-testid'], 'masonry');
});

test('Masonry: defaults to 3 columns', () => {
  const el = renderMasonry({ children: React.createElement('div') });
  assert.equal(el.props.style.columnCount, 3);
});

test('Masonry: accepts className and style props', () => {
  const el = renderMasonry({
    className: 'my-custom-class',
    style: { background: 'red' },
    children: React.createElement('span'),
  });
  assert.equal(el.props.className, 'my-custom-class');
  assert.equal(el.props.style.background, 'red');
});

test('Masonry: renders multiple children as React nodes', () => {
  const child1 = React.createElement('article', { key: 1 }, 'Article 1');
  const child2 = React.createElement('article', { key: 2 }, 'Article 2');
  const el = renderMasonry({ columns: 2, children: [child1, child2] });
  // Children should be wrapped in individual column divs
  assert.ok(el.props.children.length >= 2);
});

test('Masonry: renders with gap', () => {
  const el = renderMasonry({ gap: 16, children: React.createElement('div') });
  assert.equal(el.props.style.columnGap, 16);
});

test('Masonry: renders without children', () => {
  const el = renderMasonry({});
  // No children means empty children or none
  assert.ok(el.props.children === undefined || (Array.isArray(el.props.children) && el.props.children.length === 0));
});

// WaterfallMasonry tests

test('WaterfallMasonry: renders with data-testid', () => {
  const el = renderWaterfall({ 'data-testid': 'test-waterfall', children: React.createElement('div') });
  assert.equal(el.props['data-testid'], 'test-waterfall');
});

test('WaterfallMasonry: uses default data-testid when not provided', () => {
  const el = renderWaterfall({ children: React.createElement('div') });
  assert.equal(el.props['data-testid'], 'waterfall-masonry');
});

test('WaterfallMasonry: renders with flex layout style', () => {
  const el = renderWaterfall({ columns: 2, gap: 12, children: React.createElement('div') });
  assert.equal(el.props.style.display, 'flex');
  assert.equal(el.props.style.flexDirection, 'row');
  assert.equal(el.props.style.gap, 12);
});

test('WaterfallMasonry: defaults to 3 columns', () => {
  const el = renderWaterfall({ children: [React.createElement('span', { key: 1 }), React.createElement('span', { key: 2 })] });
  // 3 column arrays inside
  assert.equal(el.props.children.length, 3);
});

test('WaterfallMasonry: distributes items across columns', () => {
  const items = Array.from({ length: 6 }, (_, i) =>
    React.createElement('div', { key: i }, `Item ${i + 1}`),
  );
  const el = renderWaterfall({ columns: 3, children: items });
  // Should have 3 column divs
  assert.equal(el.props.children.length, 3);
});

test('WaterfallMasonry: handles empty children gracefully', () => {
  const el = renderWaterfall({ columns: 3 });
  assert.equal(el.props.children.length, 3);
});

test('WaterfallMasonry: applies animated prop', () => {
  const el = renderWaterfall({ columns: 2, animated: true, children: React.createElement('div') });
  const firstCol = el.props.children[0];
  assert.ok(firstCol.props.style.transition.includes('all 0.3s ease'));
});

test('WaterfallMasonry: applies custom className and style', () => {
  const el = renderWaterfall({
    className: 'my-waterfall',
    style: { maxWidth: 1200 },
    children: React.createElement('span'),
  });
  assert.equal(el.props.className, 'my-waterfall');
  assert.equal(el.props.style.maxWidth, 1200);
});

test('WaterfallMasonry: renders column gap correctly', () => {
  const el = renderWaterfall({ gap: 16, children: React.createElement('div') });
  assert.equal(el.props.style.gap, 16);
});
