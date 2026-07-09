import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, before, after } = require('node:test');
const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { FloatingActionButton } = require('./FloatingActionButton');

describe('FloatingActionButton', () => {
  test('renders with default props (bottom-right, md size)', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, { icon: React.createElement('span', null, '+') }),
    );
    assert.ok(html.includes('position:fixed'));
    assert.ok(html.includes('bottom:24px'));
    assert.ok(html.includes('right:24px'));
    assert.ok(html.includes('width:48px'));
    assert.ok(html.includes('height:48px'));
    assert.ok(html.includes('<span>+</span>'));
  });

  test('renders with custom position', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        position: 'top-left',
      }),
    );
    assert.ok(html.includes('top:24px'));
    assert.ok(html.includes('left:24px'));
  });

  test('renders with label', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        label: 'Add Item',
        position: 'bottom-right',
      }),
    );
    assert.ok(html.includes('Add Item'));
    assert.ok(html.includes('border-radius:24px'));
  });

  test('renders with badge number', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '🔔'),
        badge: 3,
      }),
    );
    assert.ok(html.includes('3'));
    assert.ok(html.includes('background-color:#ef4444'));
  });

  test('badge exceeds max shows max+', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '🔔'),
        badge: 150,
        badgeMax: 99,
      }),
    );
    assert.ok(html.includes('99+'));
  });

  test('badge zero does not render badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '🔔'),
        badge: 0,
      }),
    );
    assert.ok(!html.includes('background-color:#ef4444'));
  });

  test('renders with sm size', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        size: 'sm',
      }),
    );
    assert.ok(html.includes('width:36px'));
    assert.ok(html.includes('height:36px'));
  });

  test('renders with lg size', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        size: 'lg',
      }),
    );
    assert.ok(html.includes('width:60px'));
    assert.ok(html.includes('height:60px'));
  });

  test('custom background and color', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        backgroundColor: '#10b981',
        color: '#ffffff',
      }),
    );
    assert.ok(html.includes('#10b981'));
  });

  test('disabled state', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        disabled: true,
      }),
    );
    assert.ok(html.includes('disabled=""'));
    assert.ok(html.includes('cursor:not-allowed'));
    assert.ok(html.includes('background-color:#9ca3af'));
  });

  test('tooltip sets title attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        tooltip: 'Create new item',
      }),
    );
    assert.ok(html.includes('title="Create new item"'));
  });

  test('custom aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        'aria-label': 'Add Product',
      }),
    );
    assert.ok(html.includes('aria-label="Add Product"'));
  });

  test('default aria-label uses label', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        label: 'Create',
      }),
    );
    assert.ok(html.includes('aria-label="Create"'));
  });

  test('data-testid propagated', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        'data-testid': 'fab-add',
      }),
    );
    assert.ok(html.includes('data-testid="fab-add"'));
  });

  test('className propagated', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        className: 'my-fab',
      }),
    );
    assert.ok(html.includes('class="my-fab"'));
  });

  test('style override merges', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        style: { zIndex: 9999 },
      }),
    );
    assert.ok(html.includes('z-index:9999') || html.includes('zIndex:9999'));
  });

  test('bottom-center position centers horizontally', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        position: 'bottom-center',
      }),
    );
    assert.ok(html.includes('bottom:24px'));
    assert.ok(html.includes('left:50%'));
  });

  test('top-center position centers horizontally', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        position: 'top-center',
      }),
    );
    assert.ok(html.includes('top:24px'));
    assert.ok(html.includes('left:50%'));
  });

  test('hoverBackgroundColor accepted', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '+'),
        hoverBackgroundColor: '#7c3aed',
      }),
    );
    assert.ok(html.includes('+'));
  });

  test('labelPosition right orders label after icon', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        icon: React.createElement('span', null, '★'),
        label: 'Star',
        labelPosition: 'right',
      }),
    );
    assert.ok(html.includes('★'));
    assert.ok(html.includes('Star'));
  });
});

module.exports = { FloatingActionButton };
