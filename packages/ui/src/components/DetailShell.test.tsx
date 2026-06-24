import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DetailShell } = require('./DetailShell');

describe('DetailShell', () => {
  test('renders title', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, { title: 'Order #1001' })
    );
    assert.match(html, /Order #1001/);
  });

  test('renders subtitle when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, { title: 'Page', subtitle: 'Details and actions' })
    );
    assert.match(html, /Details and actions/);
  });

  test('renders back link with backHref', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, { title: 'Detail', backHref: '/list' })
    );
    assert.match(html, /← Back to list/);
    assert.match(html, /href="\/list"/);
  });

  test('renders custom back label', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, {
        title: 'Detail',
        backHref: '/list',
        backLabel: 'Retour',
      })
    );
    assert.match(html, /← Retour/);
  });

  test('renders backLink with href and label', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, {
        title: 'Profile',
        backLink: { label: 'Dashboard', href: '/dashboard' },
      })
    );
    assert.match(html, /← Dashboard/);
    assert.match(html, /\/dashboard/);
  });

  test('backLink overrides backHref', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, {
        title: 'Profile',
        backHref: '/old',
        backLink: { label: 'Dashboard', href: '/new' },
      })
    );
    assert.match(html, /← Dashboard/);
    assert.doesNotMatch(html, /← Back to list/);
  });

  test('renders breadcrumbs', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, {
        title: 'Item',
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Catalog', href: '/catalog' },
          { label: 'Item' },
        ],
      })
    );
    assert.match(html, /Home/);
    assert.match(html, /Catalog/);
    // Breadcrumb separators are rendered as <span>/</span>
    assert.match(html, /\/catalog/);
  });

  test('renders loading state', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, { title: 'Loading Page', loading: true })
    );
    assert.match(html, /Loading\.\.\./);
    assert.doesNotMatch(html, /Loading Page/);
  });

  test('renders error state', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, {
        title: 'Broken',
        error: 'Network unreachable',
      })
    );
    assert.match(html, /Network unreachable/);
    assert.doesNotMatch(html, /Broken/);
  });

  test('renders sections content', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, {
        title: 'User',
        sections: [
          { title: 'Profile', content: React.createElement('span', null, 'John Doe') },
          { title: 'Settings', content: React.createElement('span', null, 'Admin') },
        ],
      })
    );
    assert.match(html, /Profile/);
    assert.match(html, /Settings/);
    assert.match(html, /John Doe/);
    assert.match(html, /Admin/);
  });

  test('renders children instead of sections', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DetailShell,
        { title: 'Custom' },
        React.createElement('div', { 'data-testid': 'custom-child' }, 'Custom content')
      )
    );
    assert.match(html, /data-testid="custom-child"/);
    assert.match(html, /Custom content/);
    // Title should still be rendered with children
    assert.match(html, /Custom/);
  });

  test('renders action buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, {
        title: 'Edit',
        actions: [
          { key: 'save', label: 'Save', variant: 'primary', onClick: () => {} },
          { key: 'cancel', label: 'Cancel', variant: 'secondary' },
          { key: 'delete', label: 'Delete', variant: 'danger' },
        ],
      })
    );
    assert.match(html, /Save/);
    assert.match(html, /Cancel/);
    assert.match(html, /Delete/);
  });

  test('disabled action has not-allowed cursor', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, {
        title: 'Edit',
        actions: [{ key: 'save', label: 'Save', disabled: true }],
      })
    );
    assert.match(html, /not-allowed/);
  });

  test('loading action shows ellipsis', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, {
        title: 'Edit',
        actions: [{ key: 'sync', label: 'Sync', loading: true }],
      })
    );
    assert.match(html, /Sync\.\.\./);
  });

  test('renders no back link when none provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailShell, { title: 'Page' })
    );
    assert.doesNotMatch(html, /←/);
  });
});
