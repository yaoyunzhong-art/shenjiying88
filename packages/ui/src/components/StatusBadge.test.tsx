import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { StatusBadge, StatusBadgeGroup } = require('./StatusBadge');

describe('StatusBadge', () => {
  test('renders label text', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'Active' }));
    assert.match(html, /Active/);
  });

  test('renders with success variant', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'OK', variant: 'success' }));
    assert.match(html, /#86efac/);
  });

  test('renders with error variant', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'Fail', variant: 'error' }));
    assert.match(html, /#fca5a5/);
  });

  test('renders with warning variant', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'Warn', variant: 'warning' }));
    assert.match(html, /#fcd34d/);
  });

  test('renders with info variant', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'Info', variant: 'info' }));
    assert.match(html, /#93c5fd/);
  });

  test('renders with neutral variant', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'N', variant: 'neutral' }));
    assert.match(html, /#94a3b8/);
  });

  test('renders with pending variant', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'P', variant: 'pending' }));
    assert.match(html, /#c4b5fd/);
  });

  test('renders with danger variant', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'D', variant: 'danger' }));
    assert.match(html, /#fca5a5/);
  });

  test('renders small size', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'S', size: 'sm' }));
    assert.match(html, /font-size:11px/);
  });

  test('renders medium size by default', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'M' }));
    assert.match(html, /font-size:12px/);
  });

  test('shows dot by default', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'Dot' }));
    assert.match(html, /border-radius:50%/);
  });

  test('hides dot when dot=false', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { label: 'NoDot', dot: false }));
    // With dot=false, there should be no border-radius:50% inside
    // The outer span does not have border-radius:50% when dot is absent
    // Actually both the outer span (999) and dot (50%) have border-radius
    // Check the count: with dot, we see 50% twice (one for outer=999, one for dot=50%)
    const matches = html.match(/border-radius:50%/g);
    assert.equal(matches, null);
  });
});

describe('StatusBadgeGroup', () => {
  test('renders multiple badges from items', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatusBadgeGroup, {
        items: [
          { label: 'A', variant: 'success' },
          { label: 'B', variant: 'error' },
        ],
      }),
    );
    assert.match(html, /A/);
    assert.match(html, /B/);
  });

  test('renders children', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatusBadgeGroup, null,
        React.createElement(StatusBadge, { label: 'Child', variant: 'info' }),
      ),
    );
    assert.match(html, /Child/);
  });

  test('returns null for empty items array', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatusBadgeGroup, { items: [] }),
    );
    assert.equal(html, '');
  });
});
