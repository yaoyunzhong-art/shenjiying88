import React from 'react';

const assert = require('node:assert/strict');
const { test, describe } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { CountUp } = require('./CountUp');

describe('CountUp', () => {
  // SSR 渲染时动画未触发，值始终为 start
  test('ssr renders start value when autoStart is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, { start: 0, end: 100, autoStart: false })
    );
    assert.match(html, />0</);
  });

  test('ssr renders start value with prefix and suffix', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, { start: 500, end: 1024, prefix: '¥', suffix: '元', autoStart: false })
    );
    assert.match(html, />¥/);
    assert.match(html, /元</);
    assert.match(html, />¥500/);
  });

  test('ssr renders start value with thousand separator', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, { start: 1000000, end: 1234567, autoStart: false })
    );
    assert.match(html, />1,000,000</);
  });

  test('ssr renders start value with decimals', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, { start: 0, end: 99.99, decimals: 2, autoStart: false })
    );
    assert.match(html, />0.00</);
  });

  test('uses custom formatter when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, {
        start: 0,
        end: 100,
        autoStart: false,
        formatter: (v: number) => `${(v / 10000).toFixed(1)}万`,
      })
    );
    assert.match(html, />0.0万</);
  });

  test('aria-label reflects end value even in ssr', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, { start: 0, end: 5000, autoStart: false })
    );
    assert.match(html, /role="status"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /aria-label="5000"/);
  });

  test('has tabular-nums font variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, { start: 0, end: 100, autoStart: false })
    );
    assert.match(html, /tabular-nums/);
  });

  test('accepts custom data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, {
        start: 0,
        end: 500,
        autoStart: false,
        'data-testid': 'revenue-count',
      })
    );
    assert.match(html, /data-testid="revenue-count"/);
  });

  test('accepts custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, {
        start: 0,
        end: 100,
        autoStart: false,
        className: 'text-2xl font-bold',
      })
    );
    assert.match(html, /class="text-2xl font-bold"/);
  });

  test('ssr renders large number start with separator', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, { start: 0, end: 2147483647, autoStart: false })
    );
    assert.match(html, />0</);
    assert.match(html, /aria-label="2147483647"/);
  });

  test('ssr renders correct value for negative start number', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, { start: -100, end: -50, autoStart: false })
    );
    assert.match(html, /-100/);
  });

  test('ssr renders custom start value without autoStart', () => {
    const html = renderToStaticMarkup(
      React.createElement(CountUp, { start: 888, end: 999, autoStart: false })
    );
    assert.match(html, />888</);
  });

  test('component is a named function', () => {
    assert.equal(typeof CountUp, 'function');
  });
});
