import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Card } = require('./Card');

describe('Card', () => {
  test('renders children content', () => {
    const html = renderToStaticMarkup(React.createElement(Card, null, 'Hello World'));
    assert.match(html, /Hello World/);
  });

  test('renders title and subtitle', () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, { title: 'Dashboard', subtitle: 'Overview' }, 'body'),
    );
    assert.match(html, /Dashboard/);
    assert.match(html, /Overview/);
  });

  test('renders header actions', () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, { title: 'Card', headerActions: React.createElement('button', null, 'Action') }, 'body'),
    );
    assert.match(html, /Action/);
  });

  test('renders footer', () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, { footer: React.createElement('span', null, 'Footer content') }, 'body'),
    );
    assert.match(html, /Footer content/);
  });

  test('applies data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, { 'data-testid': 'my-card' }, 'body'),
    );
    assert.match(html, /data-testid="my-card"/);
  });

  test('renders without header when no title/subtitle/actions', () => {
    const html = renderToStaticMarkup(React.createElement(Card, null, 'body'));
    assert.doesNotMatch(html, /<h2/);
  });

  test('supports elevated variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, { variant: 'elevated' }, 'body'),
    );
    assert.match(html, /box-shadow/);
  });

  test('supports ghost variant with no border', () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, { variant: 'ghost' }, 'body'),
    );
    assert.match(html, /border:none/);
  });

  test('uses default variant when unknown variant passed', () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, { variant: 'unknown' as any }, 'body'),
    );
    assert.match(html, /rgba\(15, 23, 42/);
  });

  test('applies custom padding', () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, { padding: 40 }, 'body'),
    );
    assert.match(html, /padding:40px/);
  });

  test('applies custom style overrides', () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, { style: { marginTop: '10px' } }, 'body'),
    );
    assert.match(html, /margin-top:10px/);
  });
});
