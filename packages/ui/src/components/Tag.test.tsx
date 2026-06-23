import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Tag, TagGroup } = require('./Tag');

describe('Tag', () => {
  test('renders text content', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, null, 'Active'));
    assert.match(html, /Active/);
  });

  test('applies primary variant styles', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { variant: 'primary' }, 'VIP'));
    assert.match(html, /#93c5fd/);
  });

  test('applies success variant styles', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { variant: 'success' }, 'Done'));
    assert.match(html, /#86efac/);
  });

  test('applies warning variant', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { variant: 'warning' }, 'Pending'));
    assert.match(html, /#fcd34d/);
  });

  test('applies error variant', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { variant: 'error' }, 'Failed'));
    assert.match(html, /#fca5a5/);
  });

  test('applies info variant', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { variant: 'info' }, 'Notice'));
    assert.match(html, /#67e8f9/);
  });

  test('applies purple variant', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { variant: 'purple' }, 'Premium'));
    assert.match(html, /#c4b5fd/);
  });

  test('renders small size with smaller font', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { size: 'sm' }, 'Small'));
    assert.match(html, /font-size:11px/);
  });

  test('renders medium as default size', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, null, 'Default'));
    assert.match(html, /font-size:12px/);
  });

  test('renders close button when closable', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { closable: true }, 'Removable'));
    assert.match(html, /Remove tag/);
  });

  test('applies border when bordered', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { bordered: true }, 'Outlined'));
    assert.match(html, /1px solid/);
  });

  test('uses default when unknown variant', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { variant: 'unknown' as any }, 'Fallback'));
    assert.match(html, /#94a3b8/);
  });

  test('accepts className', () => {
    const html = renderToStaticMarkup(React.createElement(Tag, { className: 'custom-class' }, 'Tag'));
    assert.match(html, /custom-class/);
  });
});

describe('TagGroup', () => {
  test('renders multiple tags', () => {
    const html = renderToStaticMarkup(
      React.createElement(TagGroup, null,
        React.createElement(Tag, null, 'A'),
        React.createElement(Tag, null, 'B'),
        React.createElement(Tag, null, 'C'),
      ),
    );
    assert.match(html, /A/);
    assert.match(html, /B/);
    assert.match(html, /C/);
  });

  test('has list role', () => {
    const html = renderToStaticMarkup(
      React.createElement(TagGroup, null, React.createElement(Tag, null, 'Item')),
    );
    assert.match(html, /role="list"/);
  });
});
