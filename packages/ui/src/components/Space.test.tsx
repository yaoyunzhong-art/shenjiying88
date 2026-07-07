import React from 'react';

const assert = require('node:assert/strict');
const { test, describe } = require('node:test');
const REACT_DOM_SERVER = (() => {
  try {
    return require('react-dom/server.node.js');
  } catch {
    return require(
      '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
    );
  }
})();
const { Space } = require('./Space');

function render(el: React.ReactElement) {
  return REACT_DOM_SERVER.renderToStaticMarkup(el);
}

describe('Space component', () => {
  test('renders default horizontal space', () => {
    const html = render(React.createElement(Space, null, React.createElement('span', null, 'A'), React.createElement('span', null, 'B')));
    assert.match(html, /display:flex/);
    assert.match(html, /flex-direction:row/);
    assert.match(html, /gap:8px/);
  });

  test('renders vertical direction', () => {
    const html = render(React.createElement(Space, { direction: 'vertical' }, React.createElement('span', null, 'A')));
    assert.match(html, /flex-direction:column/);
  });

  test('applies custom numeric size', () => {
    const html = render(React.createElement(Space, { size: 32 }, React.createElement('span', null, 'A')));
    assert.match(html, /gap:32px/);
  });

  test('applies named size middle', () => {
    const html = render(React.createElement(Space, { size: 'middle' }, React.createElement('span', null, 'A')));
    assert.match(html, /gap:16px/);
  });

  test('applies named size large', () => {
    const html = render(React.createElement(Space, { size: 'large' }, React.createElement('span', null, 'A')));
    assert.match(html, /gap:24px/);
  });

  test('supports wrap prop', () => {
    const html = render(React.createElement(Space, { wrap: true }, React.createElement('span', null, 'A')));
    assert.match(html, /flex-wrap:wrap/);
  });

  test('supports align prop', () => {
    const html = render(React.createElement(Space, { align: 'end' }, React.createElement('span', null, 'A')));
    assert.match(html, /align-items:flex-end/);
  });

  test('supports justify prop', () => {
    const html = render(React.createElement(Space, { justify: 'between' }, React.createElement('span', null, 'A')));
    assert.match(html, /justify-content:space-between/);
  });

  test('merges custom style', () => {
    const html = render(React.createElement(Space, { style: { backgroundColor: 'red' } }, React.createElement('span', null, 'A')));
    assert.match(html, /background-color:red/);
  });

  test('applies className', () => {
    const html = render(React.createElement(Space, { className: 'my-space' }, React.createElement('span', null, 'A')));
    assert.match(html, /class="my-space"/);
  });
});
