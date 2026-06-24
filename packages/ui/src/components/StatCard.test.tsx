import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { StatCard } = require('./StatCard');

describe('StatCard', () => {
  test('renders label and value', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, { label: 'Revenue', value: '¥12,345' })
    );
    assert.match(html, /Revenue/);
    assert.match(html, /¥12,345/);
  });

  test('renders numeric value', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, { label: 'Orders', value: 256 })
    );
    assert.match(html, /256/);
  });

  test('renders positive trend with up arrow and green', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, {
        label: 'Growth',
        value: '15%',
        trend: { value: '+3.2%', positive: true },
      })
    );
    assert.match(html, /↑/);
    assert.match(html, /\+3\.2%/);
    assert.match(html, /#22c55e/);
  });

  test('renders negative trend with down arrow and red', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, {
        label: 'Churn',
        value: '8%',
        trend: { value: '-1.5%', positive: false },
      })
    );
    assert.match(html, /↓/);
    assert.match(html, /-1\.5%/);
    assert.match(html, /#ef4444/);
  });

  test('renders icon when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, {
        label: 'Members',
        value: '890',
        icon: React.createElement('span', { 'data-testid': 'icon' }, '📊'),
      })
    );
    assert.match(html, /data-testid="icon"/);
    assert.match(html, /📊/);
  });

  test('renders helper content', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, {
        label: 'Visits',
        value: '1.2k',
        helper: React.createElement('span', null, 'Last 30 days'),
      })
    );
    assert.match(html, /Last 30 days/);
  });

  test('renders default variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, { label: 'Sales', value: '500', variant: 'default' })
    );
    assert.match(html, /Sales/);
    assert.match(html, /500/);
  });

  test('renders info variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, { label: 'Pending', value: '12', variant: 'info' })
    );
    assert.match(html, /12/);
  });

  test('renders warning variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, { label: 'Alerts', value: '3', variant: 'warning' })
    );
    assert.match(html, /3/);
  });

  test('renders error variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, { label: 'Failures', value: '7', variant: 'error' })
    );
    assert.match(html, /7/);
  });

  test('renders success variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, { label: 'Completed', value: '100', variant: 'success' })
    );
    assert.match(html, /100/);
  });

  test('renders without trend gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, { label: 'Total', value: '999' })
    );
    assert.doesNotMatch(html, /↑/);
    assert.doesNotMatch(html, /↓/);
  });

  test('renders with default accent icon color', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, {
        label: 'DefaultAccent',
        value: '1',
        icon: React.createElement('span', null, '★'),
      })
    );
    assert.match(html, /★/);
    assert.match(html, /#3b82f6/);
  });

  test('renders success variant with green accent icon', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCard, {
        label: 'Ok',
        value: 'ok',
        variant: 'success',
        icon: React.createElement('span', null, '✓'),
      })
    );
    assert.match(html, /✓/);
    assert.match(html, /#22c55e/);
  });
});
