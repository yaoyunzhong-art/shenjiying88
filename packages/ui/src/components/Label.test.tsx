import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Label } = require('./Label');

describe('Label', () => {
  test('renders text content', () => {
    const html = renderToStaticMarkup(
      React.createElement(Label, null, '用户名')
    );
    assert.match(html, /用户名/);
  });

  test('renders htmlFor attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(Label, { htmlFor: 'username' }, '用户名')
    );
    // React SSR renders htmlFor as native 'for' attribute
    assert.match(html, /for="username"/);
  });

  test('renders required asterisk', () => {
    const html = renderToStaticMarkup(
      React.createElement(Label, { required: true }, '邮箱')
    );
    assert.match(html, /\*/);
    assert.match(html, /aria-label="必填"/);
  });

  test('renders hint text when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Label, { hint: '提示信息' }, '密码')
    );
    assert.match(html, /提示信息/);
  });

  test('does not render hint when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Label, null, '姓名')
    );
    assert.doesNotMatch(html, /提示信息/);
  });

  test('applies size prop correctly', () => {
    const htmlSm = renderToStaticMarkup(
      React.createElement(Label, { size: 'sm' }, '小号')
    );
    const htmlLg = renderToStaticMarkup(
      React.createElement(Label, { size: 'lg' }, '大号')
    );
    // lg should have larger fontSize style
    const smSize = htmlSm.match(/font-size:(\d+)/)?.[1];
    const lgSize = htmlLg.match(/font-size:(\d+)/)?.[1];
    assert.ok(Number(lgSize) > Number(smSize), 'lg fontSize should be larger than sm');
  });

  test('applies color prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Label, { color: 'error' }, '错误提示')
    );
    assert.match(html, /f87171/);
  });

  test('applies weight prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Label, { weight: 'bold' }, '加粗标签')
    );
    assert.match(html, /font-weight:700/);
  });

  test('accepts custom style', () => {
    const html = renderToStaticMarkup(
      React.createElement(Label, { style: { marginBottom: 20 } }, '自定义')
    );
    assert.match(html, /margin-bottom:20/);
  });
});
