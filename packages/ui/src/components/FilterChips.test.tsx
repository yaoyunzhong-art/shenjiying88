import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { FilterChips } = require('./FilterChips');
import type { FilterChip } from './FilterChips';

function makeChips(overrides: Partial<FilterChip>[] = []): FilterChip[] {
  const base: FilterChip[] = [
    { key: 'status', label: '运营中', tone: 'success', count: 8 },
    { key: 'region', label: '亚太' },
    { key: 'level', label: '高优先', tone: 'danger', count: 3 },
  ];
  if (overrides.length > 0) return overrides as FilterChip[];
  return base;
}

function noop() {}

describe('FilterChips', () => {
  test('renders nothing when chips array is empty (returns null)', () => {
    const result = FilterChips({ chips: [], onRemove: noop });
    assert.strictEqual(result, null);
  });

  test('renders all chip labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, { chips: makeChips(), onRemove: noop })
    );
    assert.match(html, /运营中/);
    assert.match(html, /亚太/);
    assert.match(html, /高优先/);
  });

  test('renders count in parentheses when count is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, { chips: makeChips(), onRemove: noop })
    );
    assert.match(html, /\(8\)/);
    assert.match(html, /\(3\)/);
  });

  test('renders group container with flexWrap', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, { chips: makeChips(), onRemove: noop })
    );
    assert.match(html, /flex-wrap/);
  });

  test('renders hint text when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: makeChips(),
        onRemove: noop,
        hint: '当前筛选:',
      })
    );
    assert.match(html, /当前筛选:/);
  });

  test('does not render hint when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, { chips: makeChips(), onRemove: noop })
    );
    assert.doesNotMatch(html, /当前筛选:/);
  });

  test('renders aria-label on each chip', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, { chips: makeChips(), onRemove: noop })
    );
    assert.match(html, /筛选: 运营中 \(8\)/);
    assert.match(html, /筛选: 亚太/);
    assert.match(html, /筛选: 高优先 \(3\)/);
  });

  test('renders remove button with aria-label on each chip', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, { chips: makeChips(), onRemove: noop })
    );
    assert.match(html, /移除筛选: 运营中/);
    assert.match(html, /移除筛选: 亚太/);
    assert.match(html, /移除筛选: 高优先/);
  });

  test('renders clear-all button when onClearAll provided and chips > 1', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: makeChips(),
        onRemove: noop,
        onClearAll: noop,
      })
    );
    assert.match(html, /清除全部筛选/);
    assert.match(html, /清除全部/);
  });

  test('does not render clear-all when chips length is 1', () => {
    const singleChip: FilterChip[] = [{ key: 'only', label: '唯一' }];
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: singleChip,
        onRemove: noop,
        onClearAll: noop,
      })
    );
    assert.doesNotMatch(html, /清除全部筛选/);
  });

  test('does not render clear-all when onClearAll not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, { chips: makeChips(), onRemove: noop })
    );
    assert.doesNotMatch(html, /清除全部筛选/);
  });

  test('renders SVGs for remove and clear icons', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: makeChips(),
        onRemove: noop,
        onClearAll: noop,
      })
    );
    // Should contain SVG elements
    assert.match(html, /<svg/);
    // Each chip has an X icon, plus a clear icon = 4 SVGs
    const svgCount = (html.match(/<svg/g) || []).length;
    assert.ok(svgCount >= 3, `expected >= 3 SVGs, got ${svgCount}`);
  });

  test('applies neutral tone default styles', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: [{ key: 'n', label: 'neutral' }],
        onRemove: noop,
      })
    );
    // neutral color = #cbd5e1
    assert.match(html, /#cbd5e1/);
  });

  test('applies danger tone color', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: [{ key: 'd', label: 'danger', tone: 'danger' }],
        onRemove: noop,
      })
    );
    assert.match(html, /#f87171/);
  });

  test('applies warning tone color', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: [{ key: 'w', label: 'warning', tone: 'warning' }],
        onRemove: noop,
      })
    );
    assert.match(html, /#fbbf24/);
  });

  test('applies success tone color', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: [{ key: 's', label: 'success', tone: 'success' }],
        onRemove: noop,
      })
    );
    assert.match(html, /#4ade80/);
  });

  test('renders sm size with font-size 12', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: [{ key: 'sm', label: 'small' }],
        onRemove: noop,
        size: 'sm',
      })
    );
    assert.match(html, /font-size:12px/);
  });

  test('renders md size with font-size 13', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: [{ key: 'md', label: 'medium' }],
        onRemove: noop,
        size: 'md',
      })
    );
    assert.match(html, /font-size:13px/);
  });

  test('chip has role="status"', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: [{ key: 'test', label: '测试' }],
        onRemove: noop,
      })
    );
    assert.match(html, /role="status"/);
  });

  test('renders inline-flex for chip spans', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, {
        chips: [{ key: 'flex', label: 'flex-test' }],
        onRemove: noop,
      })
    );
    assert.match(html, /inline-flex/);
  });

  test('renders multiple tones mixed', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterChips, { chips: makeChips(), onRemove: noop })
    );
    // success tone: #4ade80, neutral: #cbd5e1, danger: #f87171
    assert.match(html, /#4ade80/);
    assert.match(html, /#cbd5e1/);
    assert.match(html, /#f87171/);
  });
});
