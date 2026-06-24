import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Alert, useAlert } = require('./Alert');

describe('Alert', () => {
  test('renders info variant with blue icon color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, null, '这是一条消息')
    );
    assert.match(html, /这是一条消息/);
    // Info uses blue palette for icon and text
    assert.match(html, /#60a5fa/);
    assert.match(html, /#93c5fd/);
    assert.match(html, /rgba\(59, 130, 246/);
  });

  test('renders success variant with green icon color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'success' }, '操作成功')
    );
    assert.match(html, /操作成功/);
    assert.match(html, /#4ade80/);
    assert.match(html, /#86efac/);
    assert.match(html, /rgba\(34, 197, 94/);
  });

  test('renders warning variant with yellow icon color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'warning' }, '请注意')
    );
    assert.match(html, /请注意/);
    assert.match(html, /#facc15/);
    assert.match(html, /#fcd34d/);
    assert.match(html, /rgba\(251, 191, 36/);
  });

  test('renders danger variant with red icon color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'danger' }, '发生错误')
    );
    assert.match(html, /发生错误/);
    assert.match(html, /#f87171/);
    assert.match(html, /#fca5a5/);
    assert.match(html, /rgba\(239, 68, 68/);
  });

  test('renders title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { title: '标题' }, '内容')
    );
    assert.match(html, /标题/);
    assert.match(html, /内容/);
    // Title should have higher font-weight
    assert.match(html, /font-weight:600/);
  });

  test('does not render title element when title is not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, null, '纯内容')
    );
    assert.match(html, /纯内容/);
    // No font-weight:600 element means no title div
    assert.doesNotMatch(html, /font-weight:600/);
  });

  test('renders SVG icon by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'warning' }, '有图标的警告')
    );
    assert.match(html, /<svg/);
    assert.match(html, /有图标的警告/);
  });

  test('hides icon when icon=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { icon: false }, '无图标')
    );
    assert.match(html, /无图标/);
    assert.doesNotMatch(html, /<svg/);
  });

  test('renders dismiss button when dismissible=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { dismissible: true }, '可关闭')
    );
    assert.match(html, /可关闭/);
    assert.match(html, /aria-label="Dismiss alert"/);
  });

  test('does not render dismiss button when dismissible=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { dismissible: false }, '不可关闭')
    );
    assert.match(html, /不可关闭/);
    assert.doesNotMatch(html, /aria-label="Dismiss alert"/);
  });

  test('applies custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { className: 'my-custom-alert' }, '自定义样式')
    );
    assert.match(html, /my-custom-alert/);
    assert.match(html, /自定义样式/);
  });

  test('applies custom style', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { style: { marginBottom: '20px' } }, '有额外样式')
    );
    assert.match(html, /margin-bottom:20px/);
  });

  test('renders border with variant color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'danger' }, '红色边框')
    );
    assert.match(html, /border:1px solid/);
    assert.match(html, /#fca5a5/);
  });

  test('renders with flex layout', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, null, 'flex布局')
    );
    assert.match(html, /display:flex/);
    assert.match(html, /align-items:flex-start/);
    assert.match(html, /gap:12/);
  });

  test('renders children as text content', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Alert,
        { variant: 'info' },
        React.createElement('span', null, '嵌套内容')
      )
    );
    assert.match(html, /嵌套内容/);
  });

  test('each variant has distinct SVG path', () => {
    const infoHtml = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'info' }, 'info')
    );
    const successHtml = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'success' }, 'success')
    );
    const warningHtml = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'warning' }, 'warning')
    );
    const dangerHtml = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'danger' }, 'danger')
    );

    // All different SVG content
    const extractSvg = (html: string) => html.match(/<svg[\s\S]*?<\/svg>/)![0];
    const svgs = [infoHtml, successHtml, warningHtml, dangerHtml].map(extractSvg);
    const unique = new Set(svgs);
    assert.equal(unique.size, 4);
  });

  test('danger icon has X shape', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'danger' }, 'error')
    );
    assert.match(html, /<svg/);
    // Contains the cross path
    assert.match(html, /M10 1\.25a8\.75/);
  });

  test('success icon has checkmark shape', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, { variant: 'success' }, 'ok')
    );
    assert.match(html, /M10 1\.25a8\.75 8\.75 0 1 0 0 17\.5/);
  });

  test('renders with border-radius 12', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, null, '圆角')
    );
    assert.match(html, /border-radius:12/);
  });

  test('renders with padding 14px 16px', () => {
    const html = renderToStaticMarkup(
      React.createElement(Alert, null, '内边距')
    );
    assert.match(html, /padding:14px 16px/);
  });
});

describe('useAlert', () => {
  test('is a function', () => {
    assert.equal(typeof useAlert, 'function');
  });

  test('has correct function name', () => {
    assert.ok(useAlert);
    assert.equal(useAlert.name, 'useAlert');
  });

  test('throws when called outside React context (SSR)', () => {
    assert.throws(
      () => useAlert(),
      /useState/
    );
  });
});
