import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Statistic } = require('./Statistic');

describe('Statistic', () => {
  // ──────────── 正例 — basic rendering ────────────

  test('renders value and label', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 12345, label: '总营收' }),
    );
    assert.match(html, /12345/);
    assert.match(html, /总营收/);
  });

  test('renders with prefix', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 99.9, prefix: '¥' }),
    );
    assert.match(html, /¥/);
    assert.match(html, /99.9/);
  });

  test('renders with suffix', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 88, suffix: '%' }),
    );
    assert.match(html, /88/);
    assert.match(html, /%/);
  });

  test('renders with both prefix and suffix', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 42, prefix: '~', suffix: '次' }),
    );
    assert.match(html, /~/);
    assert.match(html, /42/);
    assert.match(html, /次/);
  });

  test('renders default variant color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 100 }),
    );
    // default color is f8fafc
    assert.match(html, /f8fafc/);
  });

  test('renders with precision', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 3.14159, precision: 2 }),
    );
    assert.match(html, /3\.14/);
    assert.doesNotMatch(html, /3\.14159/);
  });

  test('renders with group separator', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 1234567, groupSeparator: true }),
    );
    assert.match(html, /1,234,567/);
  });

  test('renders with group separator and precision', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 9876543.21, precision: 1, groupSeparator: true }),
    );
    assert.match(html, /9,876,543\.2/);
  });

  test('renders in horizontal layout', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 500, label: '单量', layout: 'horizontal' }),
    );
    assert.match(html, /单量/);
    assert.match(html, /500/);
  });

  test('renders small size', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 10, size: 'sm' }),
    );
    // small value font is 20px
    assert.match(html, /font-size:20/);
  });

  test('renders large size', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 10, size: 'lg' }),
    );
    // large value font is 36px
    assert.match(html, /font-size:36/);
  });

  // ──────────── 反例 — edge cases ────────────

  test('handles string value gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: '42' }),
    );
    assert.match(html, /42/);
  });

  test('handles non-numeric string as 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 'abc', precision: 2 }),
    );
    assert.match(html, /0\.00/);
  });

  test('handles negative value', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: -99, variant: 'danger' }),
    );
    assert.match(html, /-99/);
  });

  test('zero value renders correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 0 }),
    );
    assert.match(html, /0/);
  });

  test('floating point precision displays correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 1.2345, precision: 2 }),
    );
    assert.match(html, /1\.23/);
  });

  test('variant colors render correctly', () => {
    const success = renderToStaticMarkup(
      React.createElement(Statistic, { value: 1, variant: 'success' }),
    );
    assert.match(success, /22c55e/);

    const warning = renderToStaticMarkup(
      React.createElement(Statistic, { value: 1, variant: 'warning' }),
    );
    assert.match(warning, /f59e0b/);

    const info = renderToStaticMarkup(
      React.createElement(Statistic, { value: 1, variant: 'info' }),
    );
    assert.match(info, /38bdf8/);
  });

  // ──────────── loading ────────────

  test('renders loading skeleton when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 999, loading: true, 'data-testid': 'ld' }),
    );
    assert.match(html, /m5-skeleton-shimmer/);
    // skeleton element is present instead of number
    assert.match(html, /data-testid="ld-skeleton"/);
    assert.doesNotMatch(html, /data-testid="ld-number"/);
  });

  test('loading with custom width', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 100, loading: true, loadingWidth: 80 }),
    );
    assert.match(html, /width:80/);
  });

  // ──────────── data-testid ────────────

  test('data-testid propagates to sub-elements', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 42, label: '测试', 'data-testid': 'stats' }),
    );
    assert.match(html, /data-testid="stats"/);
    assert.match(html, /data-testid="stats-label"/);
    assert.match(html, /data-testid="stats-value"/);
    assert.match(html, /data-testid="stats-number"/);
  });

  test('data-testid prefix/suffix work', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, {
        value: 50,
        prefix: '$',
        suffix: 'K',
        'data-testid': 's',
      }),
    );
    assert.match(html, /data-testid="s-prefix"/);
    assert.match(html, /data-testid="s-suffix"/);
  });

  test('data-testid for loading skeleton', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 999, loading: true, 'data-testid': 'ld' }),
    );
    assert.match(html, /data-testid="ld-skeleton"/);
    // numeric value span with data-testid should NOT be present
    assert.doesNotMatch(html, /data-testid="ld-number"/);
  });

  // ──────────── className & style ────────────

  test('className applied to root', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 1, className: 'my-stat' }),
    );
    assert.match(html, /my-stat/);
  });

  test('style applied to root', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 1, style: { marginTop: 12 } }),
    );
    assert.match(html, /margin-top:12px/);
  });

  // ──────────── no label ────────────

  test('no label renders fine', () => {
    const html = renderToStaticMarkup(
      React.createElement(Statistic, { value: 999 }),
    );
    assert.match(html, /999/);
    // no label element rendered
    assert.doesNotMatch(html, /data-testid=".*-label"/);
  });
});

module.exports = { Statistic };
