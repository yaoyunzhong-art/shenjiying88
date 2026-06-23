import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { PageShell } = require('./PageShell');

describe('PageShell', () => {
  test('renders title as h1', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { title: 'Dashboard' }, 'content')
    );
    assert.match(html, /<h1/);
    assert.match(html, /Dashboard/);
  });

  test('renders description when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { title: 'Dashboard', description: 'Overview page' }, 'content')
    );
    assert.match(html, /Overview page/);
  });

  test('renders subtitle as description fallback', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { title: 'Dashboard', subtitle: 'Subtitle fallback' }, 'content')
    );
    assert.match(html, /Subtitle fallback/);
  });

  test('prefers description over subtitle', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, {
        title: 'Dashboard',
        description: 'Primary',
        subtitle: 'Fallback',
      }, 'content')
    );
    assert.match(html, /Primary/);
    assert.doesNotMatch(html, /Fallback/);
  });

  test('does not render description paragraph when neither provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { title: 'Dashboard' }, 'content')
    );
    // There should be only one <p> if no description — or none at all
    // Actually children "content" would be a text node so no <p> at all
    assert.doesNotMatch(html, /<p/);
  });

  test('renders children', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { title: 'Dashboard' },
        React.createElement('div', { 'data-testid': 'child' }, 'Hello')
      )
    );
    assert.match(html, /data-testid="child"/);
    assert.match(html, /Hello/);
  });

  test('renders action buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, {
        title: 'Dashboard',
        actions: React.createElement('button', { 'data-testid': 'action' }, 'Create'),
      }, 'content')
    );
    assert.match(html, /data-testid="action"/);
    assert.match(html, />Create</);
  });

  test('renders multiple actions', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, {
        title: 'Dashboard',
        actions: React.createElement(React.Fragment, null,
          React.createElement('button', { key: '1', 'data-testid': 'btn-1' }, 'Save'),
          React.createElement('button', { key: '2', 'data-testid': 'btn-2' }, 'Cancel'),
        ),
      }, 'content')
    );
    assert.match(html, /Save/);
    assert.match(html, /Cancel/);
  });

  test('applies default dark styling to title', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { title: 'Dashboard' }, 'content')
    );
    assert.match(html, /font-size:24px/);
    assert.match(html, /font-weight:700/);
    assert.match(html, /color:#f8fafc/);
  });

  test('has max-width container', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { title: 'Dashboard' }, 'content')
    );
    assert.match(html, /max-width:1280px/);
    assert.match(html, /margin:0 auto/);
  });

  test('has flex layout for header + actions', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { title: 'Dashboard' }, 'content')
    );
    assert.match(html, /justify-content:space-between/);
  });

  test('renders with only title and no children', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { title: 'Minimal' })
    );
    assert.match(html, /Minimal/);
    assert.match(html, /<h1/);
  });

  test('description text has muted color', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageShell, { title: 'T', description: 'desc' }, 'body')
    );
    assert.match(html, /color:#94a3b8/);
  });
});
