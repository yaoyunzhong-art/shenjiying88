import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { QuickStats } = require('./QuickStats');

describe('QuickStats', () => {
  test('renders all items', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [
          { label: '总数', value: 15, helper: '5 个区域' },
          { label: '运营中', value: 8, valueColor: '#4ade80', helper: '53%' },
          { label: '已过期', value: 32, valueColor: '#ef4444' },
        ],
      })
    );
    assert.match(html, /总数/);
    assert.match(html, /15/);
    assert.match(html, /5 个区域/);
    assert.match(html, /运营中/);
    assert.match(html, /8/);
    assert.match(html, /53%/);
    assert.match(html, /已过期/);
    assert.match(html, /32/);
  });

  test('returns null for empty items', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, { items: [] })
    );
    assert.strictEqual(html, '');
  });

  test('renders numeric values', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [{ label: 'Orders', value: 256 }],
      })
    );
    assert.match(html, /256/);
  });

  test('renders string values', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [{ label: 'Status', value: 'Active' }],
      })
    );
    assert.match(html, /Active/);
  });

  test('applies custom value colors', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [
          { label: 'Good', value: '100%', valueColor: '#22c55e' },
          { label: 'Bad', value: '0%', valueColor: '#ef4444' },
        ],
      })
    );
    assert.match(html, /#22c55e/);
    assert.match(html, /#ef4444/);
  });

  test('renders without helper text', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [{ label: 'Total', value: 99 }],
      })
    );
    assert.match(html, /Total/);
    assert.match(html, /99/);
    assert.doesNotMatch(html, /helper/);
  });

  test('renders with custom columns', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [
          { label: 'A', value: 1 },
          { label: 'B', value: 2 },
        ],
        columns: 2,
      })
    );
    assert.match(html, /repeat\(2/);
  });

  test('renders with default 4 columns', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [{ label: 'X', value: 1 }],
      })
    );
    assert.match(html, /repeat\(4/);
  });

  test('renders with custom gap', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [{ label: 'Gap', value: 1 }],
        gap: 20,
      })
    );
    assert.match(html, /20/);
  });

  test('renders with custom padding', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [{ label: 'Pad', value: 1 }],
        padding: 24,
      })
    );
    assert.match(html, /24/);
  });

  test('renders single item correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [{ label: '唯一指标', value: 42, helper: '仅一项' }],
      })
    );
    assert.match(html, /唯一指标/);
    assert.match(html, /42/);
    assert.match(html, /仅一项/);
  });

  test('renders large number of items', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      label: `Metric ${i}`,
      value: i * 10,
    }));
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, { items })
    );
    for (let i = 0; i < 10; i++) {
      assert.match(html, new RegExp(`Metric ${i}`));
      assert.match(html, new RegExp(String(i * 10)));
    }
  });

  test('renders value 0 correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickStats, {
        items: [{ label: 'Zero', value: 0 }],
      })
    );
    assert.match(html, /0/);
  });
});
