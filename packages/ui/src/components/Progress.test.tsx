import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Progress } = require('./Progress');

describe('Progress', () => {
  test('renders with default props', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 50 }),
    );
    assert.match(html, /role="progressbar"/);
    assert.match(html, /aria-valuenow="50"/);
    assert.match(html, /aria-valuemax="100"/);
    assert.match(html, /50%/);
    assert.match(html, /38bdf8/);
  });

  test('clamps value between 0 and max', () => {
    const over = renderToStaticMarkup(
      React.createElement(Progress, { value: 150, max: 100 }),
    );
    assert.match(over, /aria-valuenow="100"/);
    assert.match(over, /100%/);

    const under = renderToStaticMarkup(
      React.createElement(Progress, { value: -10, max: 100 }),
    );
    assert.match(under, /aria-valuenow="0"/);
    assert.match(under, /0%/);
  });

  test('handles max=0 gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 0, max: 0 }),
    );
    assert.match(html, /aria-valuenow="0"/);
    assert.match(html, /0%/);
  });

  test('renders success variant with correct color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 75, variant: 'success' }),
    );
    assert.match(html, /22c55e/);
    assert.match(html, /75%/);
  });

  test('renders warning variant with correct color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 30, variant: 'warning' }),
    );
    assert.match(html, /f59e0b/);
    assert.match(html, /30%/);
  });

  test('renders danger variant with correct color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 10, variant: 'danger' }),
    );
    assert.match(html, /ef4444/);
    assert.match(html, /10%/);
  });

  test('renders info variant with correct color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 60, variant: 'info' }),
    );
    assert.match(html, /818cf8/);
    assert.match(html, /60%/);
  });

  test('hides label when showLabel is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 40, showLabel: false }),
    );
    assert.doesNotMatch(html, /data-testid=".*-label"/);
  });

  test('uses custom formatLabel', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, {
        value: 33,
        formatLabel: (pct: number) => `${pct} 点`,
      }),
    );
    assert.match(html, /33 点/);
  });

  test('renders indeterminate state', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 0, indeterminate: true }),
    );
    assert.match(html, /loading/);
    assert.match(html, /m5-progress-indeterminate-slide/);
  });

  test('custom height applied to track', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 50, height: 12 }),
    );
    assert.match(html, /height:12px/);
    assert.match(html, /border-radius:6px/);
  });

  test('respects custom max value', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 3, max: 10 }),
    );
    assert.match(html, /aria-valuenow="3"/);
    assert.match(html, /aria-valuemax="10"/);
    assert.match(html, /30%/);
  });

  test('data-testid propagated to elements', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 70, 'data-testid': 'my-progress' }),
    );
    assert.match(html, /data-testid="my-progress"/);
    assert.match(html, /data-testid="my-progress-label"/);
    assert.match(html, /data-testid="my-progress-track"/);
    assert.match(html, /data-testid="my-progress-fill"/);
  });

  test('aria-label used when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 25, 'aria-label': 'Storage Usage' }),
    );
    assert.match(html, /aria-label="Storage Usage"/);
  });

  test('animated bar uses transition style', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 50, animated: true }),
    );
    assert.match(html, /transition/);
  });

  test('non-animated bar has no transition', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 50, animated: false }),
    );
    assert.doesNotMatch(html, /transition/);
  });

  test('zero value shows 0%', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 0 }),
    );
    assert.match(html, /0%/);
    assert.match(html, /width:0%/);
  });

  test('full value shows 100%', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 100 }),
    );
    assert.match(html, /100%/);
    assert.match(html, /width:100%/);
  });

  test('className propagated to root element', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 50, className: 'custom-progress' }),
    );
    assert.match(html, /custom-progress/);
  });

  test('style prop merged into root element', () => {
    const html = renderToStaticMarkup(
      React.createElement(Progress, { value: 50, style: { marginTop: 8 } }),
    );
    assert.match(html, /margin-top:8px/);
  });
});

// Re-export for package index
module.exports = { Progress };
