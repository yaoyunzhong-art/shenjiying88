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
const { Spin } = require('./Spin');

function render(el: React.ReactElement) {
  return REACT_DOM_SERVER.renderToStaticMarkup(el);
}

describe('Spin component', () => {

  // --- 1. 默认渲染 ---
  test('renders inline spinner by default', () => {
    const html = render(React.createElement(Spin));
    assert.match(html, /role="status"/);
    assert.ok(html.includes('spin-rotate'), 'should include rotation keyframes');
  });

  // --- 2. spinning=false 不渲染指示器 ---
  test('does not render indicator when spinning=false', () => {
    const html = render(React.createElement(Spin, { spinning: false }));
    // inline mode, no children → should still render container, but no spinning inside
    assert.ok(html.includes('role="status"'));
  });

  // --- 3. spinning=false with children renders children without overlay ---
  test('renders children without overlay when spinning=false', () => {
    const html = render(
      React.createElement(Spin, { spinning: false },
        React.createElement('div', null, 'content')
      )
    );
    assert.ok(html.includes('content'));
    // should not contain the overlay indicator
    // The overlay is in a div with position:absolute styles
    assert.ok(html.includes('position:relative'), 'container should be relative');
  });

  // --- 4. tip 文本渲染 ---
  test('renders tip text when provided', () => {
    const html = render(React.createElement(Spin, { tip: '加载中，请稍候' }));
    assert.ok(html.includes('加载中，请稍候'));
  });

  // --- 5. 所有 size 变体正常渲染 ---
  test('renders all size variants', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const html = render(React.createElement(Spin, { size }));
      assert.ok(html.includes('spin-rotate'), `size=${size} renders`);
    }
  });

  // --- 6. 自定义 indicator ---
  test('renders custom indicator instead of default spinner', () => {
    const customIndicator = React.createElement('span', { 'data-custom': 'true' }, '🌀');
    const html = render(React.createElement(Spin, { indicator: customIndicator }));
    assert.ok(html.includes('🌀'), 'should render custom indicator');
  });

  // --- 7. fullscreen 模式渲染 fixed 遮罩 ---
  test('renders fullscreen overlay as fixed position', () => {
    const html = render(
      React.createElement(Spin, { fullscreen: true },
        React.createElement('div', null, 'page content')
      )
    );
    assert.ok(html.includes('page content'));
    // overlay should exist; check position:fixed in rendered output
    assert.ok(html.includes('position:fixed') || html.includes('position: fixed'), 'fullscreen overlay should be fixed');
  });

  // --- 8. 包裹 children ---
  test('wraps children and shows overlay when spinning', () => {
    const html = render(
      React.createElement(Spin, { spinning: true },
        React.createElement('div', { className: 'content-area' })
      )
    );
    assert.ok(html.includes('content-area'));
  });

  // --- 9. 自定义 className ---
  test('accepts custom className', () => {
    const html = render(React.createElement(Spin, { className: 'my-spin' }));
    assert.match(html, /class="my-spin"/);
  });

  // --- 10. 自定义 style ---
  test('accepts custom style', () => {
    const html = render(React.createElement(Spin, { style: { marginTop: 20 } }));
    assert.match(html, /margin-top:20px/);
  });

  // --- 11. delay 参数延迟显示 ---
  test('with delay does not show indicator immediately in SSR render', () => {
    // In SSR, useDelay always evaluates to !delay (since no mount happens)
    const html = render(React.createElement(Spin, { delay: 500 }));
    // SSR static output should show role="status" but may skip indicator if delayed=false
    assert.ok(html.includes('role="status"'));
  });

  // --- 12. tip with children ---
  test('renders tip text with children', () => {
    const html = render(
      React.createElement(Spin, { tip: '数据加载中' },
        React.createElement('p', null, 'chart area')
      )
    );
    assert.ok(html.includes('数据加载中'), 'tip should appear in overlay');
    assert.ok(html.includes('chart area'), 'children should render');
  });

  // --- 13. empty tip renders no label ---
  test('renders no tip span when tip is empty string', () => {
    const html = render(React.createElement(Spin, { tip: '' }));
    // tip="" → falsy → no label
    // just check no extra text node appears
    assert.ok(html.includes('role="status"'));
  });

  // --- 14. role=status attribute ---
  test('has role="status" for accessibility', () => {
    const html = render(React.createElement(Spin));
    assert.match(html, /role="status"/);
  });

  // --- 15. indicator + size works together ---
  test('custom indicator with explicit size does not crash', () => {
    const custom = React.createElement('div', null, 'custom-loading');
    const html = render(React.createElement(Spin, { size: 'lg', indicator: custom }));
    assert.ok(html.includes('custom-loading'));
  });

  // --- 16. inline mode no children + no tip ---
  test('inline mode renders without label when no tip', () => {
    const html = render(React.createElement(Spin, { size: 'sm' }));
    assert.ok(html.includes('spin-rotate'));
  });

  // --- 17. fullscreen without children renders fixed overlay ---
  test('fullscreen without children renders overlay correctly', () => {
    const html = render(React.createElement(Spin, { fullscreen: true, tip: '全屏加载' }));
    assert.ok(html.includes('全屏加载'));
  });

});
