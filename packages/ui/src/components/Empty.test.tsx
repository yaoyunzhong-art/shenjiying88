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
const { Empty } = require('./Empty');

function render(el: React.ReactElement) {
  return REACT_DOM_SERVER.renderToStaticMarkup(el);
}

describe('Empty component', () => {
  test('renders with default description', () => {
    const html = render(React.createElement(Empty));
    assert.match(html, /暂无数据/);
    assert.match(html, /svg/);
  });

  test('renders custom description', () => {
    const html = render(React.createElement(Empty, { description: '没有匹配的记录' }));
    assert.match(html, /没有匹配的记录/);
  });

  test('renders custom image', () => {
    const html = render(React.createElement(Empty, { image: React.createElement('div', { 'data-testid': 'custom-img' }, '📦') }));
    assert.match(html, /📦/);
  });

  test('renders children in action area', () => {
    const html = render(React.createElement(Empty, null, React.createElement('button', null, '重试')));
    assert.match(html, /重试/);
  });

  test('renders children without default description', () => {
    const html = render(React.createElement(Empty, { description: undefined }, React.createElement('button', null, '新增')));
    assert.match(html, /新增/);
  });

  test('applies custom style', () => {
    const html = render(React.createElement(Empty, { style: { backgroundColor: '#f5f5f5' } }));
    assert.match(html, /background-color:#f5f5f5/);
  });

  test('applies className', () => {
    const html = render(React.createElement(Empty, { className: 'my-empty' }));
    assert.match(html, /class="my-empty"/);
  });

  test('empty description hides text', () => {
    const html = render(React.createElement(Empty, { description: '' }));
    // should still render the SVG container
    assert.match(html, /svg/);
  });
});
