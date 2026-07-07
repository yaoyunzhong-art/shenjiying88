import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Divider } = require('./Divider');

describe('Divider', () => {
  test('renders default horizontal divider', () => {
    const html = renderToStaticMarkup(React.createElement(Divider, {}));
    assert.match(html, /role="separator"/);
    assert.match(html, /aria-orientation="horizontal"/);
    assert.match(html, /width:100%/);
    assert.match(html, /border-top:1px solid #d1d5db/);
    assert.doesNotMatch(html, /data-testid=/);
  });

  test('renders vertical divider with correct orientation', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { orientation: 'vertical' }),
    );
    assert.match(html, /aria-orientation="vertical"/);
    assert.match(html, /height:1em/);
    assert.match(html, /border-left:1px solid #d1d5db/);
    assert.match(html, /margin-left:8px/);
    assert.match(html, /margin-right:8px/);
  });

  test('renders dashed variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { variant: 'dashed' }),
    );
    assert.match(html, /border-top:1px dashed #d1d5db/);
  });

  test('renders dotted variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { variant: 'dotted' }),
    );
    assert.match(html, /border-top:1px dotted #d1d5db/);
  });

  test('custom color applied', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { color: '#ef4444' }),
    );
    assert.match(html, /#ef4444/);
  });

  test('custom thickness applied', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { thickness: 3 }),
    );
    assert.match(html, /border-top:3px solid #d1d5db/);
  });

  test('custom width for horizontal divider', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { width: '80%' }),
    );
    assert.match(html, /width:80%/);
  });

  test('custom height for vertical divider', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { orientation: 'vertical', height: '200px' }),
    );
    assert.match(html, /height:200px/);
  });

  test('custom spacing eliminates default margins', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { spacing: '16px 0' }),
    );
    assert.match(html, /margin:16px 0/);
    assert.doesNotMatch(html, /margin-top:8px/);
  });

  test('data-testid propagated', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { 'data-testid': 'my-divider' }),
    );
    assert.match(html, /data-testid="my-divider"/);
  });

  test('aria-label overridden', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { 'aria-label': 'Section Separator' }),
    );
    assert.match(html, /aria-label="Section Separator"/);
  });

  test('className propagated', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { className: 'custom-divider' }),
    );
    assert.match(html, /custom-divider/);
  });

  test('style prop merged', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { style: { opacity: 0.5 } }),
    );
    assert.match(html, /opacity:0.5/);
  });

  test('flexShrink zero applied', () => {
    const html = renderToStaticMarkup(React.createElement(Divider, {}));
    assert.match(html, /flex-shrink:0/);
  });

  test('vertical with custom spacing', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { orientation: 'vertical', spacing: '0 4px' }),
    );
    assert.match(html, /margin:0 4px/);
    assert.match(html, /aria-orientation="vertical"/);
  });

  test('dashed vertical divider', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { orientation: 'vertical', variant: 'dashed' }),
    );
    assert.match(html, /border-left:1px dashed #d1d5db/);
  });

  test('custom thickness vertical', () => {
    const html = renderToStaticMarkup(
      React.createElement(Divider, { orientation: 'vertical', thickness: 2, color: '#3b82f6' }),
    );
    assert.match(html, /border-left:2px solid #3b82f6/);
  });
});

// Re-export for package index
module.exports = { Divider };
