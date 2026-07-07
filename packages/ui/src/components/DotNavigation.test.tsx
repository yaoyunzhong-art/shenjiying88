import React from 'react';

const assert = require('node:assert/strict');
const { test, describe } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DotNavigation } = require('./DotNavigation');

describe('DotNavigation component', () => {

  // --- 1. 默认渲染正确数量的圆点 ---
  test('renders correct number of dots', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 5, activeIndex: 0 })
    );
    // Count all buttons (dots are rendered as <button> elements)
    const buttons = html.match(/role="tab"/g);
    assert.equal(buttons ? buttons.length : 0, 5, 'should render 5 dots');
  });

  // --- 2. 只有1个圆点时正常渲染 ---
  test('renders a single dot correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 1, activeIndex: 0 })
    );
    const buttons = html.match(/role="tab"/g);
    assert.equal(buttons ? buttons.length : 0, 1);
    assert.match(html, /aria-selected="?true"?/);
  });

  // --- 3. 0个圆点时渲染空容器 ---
  test('renders no dots when total is 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 0, activeIndex: 0 })
    );
    const buttons = html.match(/role="tab"/g);
    // total=0 → no dots, so buttons should be null
    assert.equal(buttons, null);
    assert.match(html, /role="?tablist"?/);
  });

  // --- 4. activeIndex 超出范围时固定在有效范围 ---
  test('clamps activeIndex when it exceeds total', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 10 })
    );
    // Last dot (index 2) should be active
    const activeDots = html.match(/aria-selected="?true"?/g);
    assert.ok(activeDots);
    assert.equal(activeDots.length, 1);
  });

  // --- 5. activeIndex 为负数时固定在0 ---
  test('clamps activeIndex when negative', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: -5 })
    );
    // First dot should be active
    const activeDots = html.match(/aria-selected="?true"?/g);
    assert.ok(activeDots);
    assert.equal(activeDots.length, 1);
  });

  // --- 6. 默认 variant='filled' 时活跃圆点有背景色 ---
  test('filled variant applies background color to active dot', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 1, variant: 'filled' })
    );
    // active dot should have a background-color (non-transparent)
    assert.ok(html.includes('background-color') || html.includes('backgroundColor'));
    // cursor is 'default' when onChange is not provided
    assert.ok(html.includes('cursor:default') || html.includes('cursor: default'));
  });

  // --- 7. variant='outlined' 时圆点有边框 ---
  test('outlined variant has border on dots', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 0, variant: 'outlined' })
    );
    assert.match(html, /border/);
  });

  // --- 8. variant='minimal' 时非活跃圆点有降低透明度 ---
  test('minimal variant has opacity on inactive dots', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 0, variant: 'minimal' })
    );
    // Should contain opacity styles for non-active dots
    assert.ok(html.includes('opacity'));
  });

  // --- 9. 所有尺寸变体正常渲染 ---
  test('renders all size variants', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const html = renderToStaticMarkup(
        React.createElement(DotNavigation, { total: 2, activeIndex: 0, size })
      );
      assert.ok(html.includes('role="tab"'), `size=${size} renders dots`);
    }
  });

  // --- 10. 自定义颜色 ---
  test('accepts custom activeColor', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 1, activeColor: '#ff0000' })
    );
    // Red color should be present in the rendered output
    assert.ok(html.includes('#ff0000'));
  });

  // --- 11. 自定义 inactiveColor ---
  test('accepts custom inactiveColor', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 0, inactiveColor: '#eeeeee' })
    );
    assert.ok(html.includes('#eeeeee'));
  });

  // --- 12. showCounter 显示当前页码 ---
  test('showCounter renders current index counter', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 5, activeIndex: 2, showCounter: true })
    );
    assert.ok(html.includes('3 / 5'), 'should show "3 / 5" (1-indexed)');
  });

  // --- 13. showCounter=false 时不显示计数器 ---
  test('showCounter false hides counter', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 5, activeIndex: 2, showCounter: false })
    );
    assert.ok(!html.includes('3 / 5'));
  });

  // --- 14. direction='column' 时垂直布局 ---
  test('column direction changes flex direction', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 0, direction: 'column' })
    );
    assert.ok(html.includes('flex-direction:column') || html.includes('flexDirection:column'));
  });

  // --- 15. 自定义 gap 间距 ---
  test('accepts custom gap value', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 0, gap: 20 })
    );
    assert.ok(html.includes('gap:20px') || html.includes('gap: 20px'));
  });

  // --- 16. 自定义 className ---
  test('accepts custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 0, className: 'my-dots' })
    );
    assert.match(html, /class="my-dots"/);
  });

  // --- 17. 自定义 style ---
  test('accepts custom style', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 0, style: { marginTop: 10 } })
    );
    assert.match(html, /margin-top:10px/);
  });

  // --- 18. 默认 ARIA 属性正确 ---
  test('has correct ARIA attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 4, activeIndex: 0 })
    );
    assert.match(html, /role="?tablist"?/);
    assert.match(html, /role="?tab"?/);
    assert.match(html, /aria-selected=/);
    assert.match(html, /aria-label="Dot navigation"/);
  });

  // --- 19. 自定义 ariaLabel ---
  test('accepts custom ariaLabel', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 0, ariaLabel: 'Image gallery' })
    );
    assert.match(html, /aria-label="Image gallery"/);
  });

  // --- 20. data-testid 自定义 ---
  test('renders data-testid attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 0, 'data-testid': 'dot-nav' })
    );
    assert.match(html, /data-testid="dot-nav"/);
  });

  // --- 21. 每个圆点有准确的 tab ARIA label ---
  test('each dot has descriptive aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 3, activeIndex: 1 })
    );
    assert.match(html, /item 1 of 3/);
    assert.match(html, /item 2 of 3/);
    assert.match(html, /item 3 of 3/);
  });

  // --- 22. animated=true 包含动画 keyframes ---
  test('animated=true includes keyframes style', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 2, activeIndex: 0, animated: true })
    );
    assert.ok(html.includes('@keyframes'), 'should include keyframes when animated');
  });

  // --- 23. animated=false 不包含动画 keyframes ---
  test('animated=false removes keyframes style', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 2, activeIndex: 0, animated: false })
    );
    assert.ok(!html.includes('@keyframes'), 'should not include keyframes when animated=false');
  });

  // --- 24. 大数量圆点仍然正常渲染 ---
  test('renders large number of dots', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 50, activeIndex: 25, showCounter: true })
    );
    const buttons = html.match(/role="tab"/g);
    assert.equal(buttons ? buttons.length : 0, 50);
    assert.ok(html.includes('26 / 50'));
  });

  // --- 25. onChange 触发数据属性的存在（渲染验证） ---
  test('renders with onChange callback', () => {
    const html = renderToStaticMarkup(
      React.createElement(DotNavigation, { total: 4, activeIndex: 0, onChange: () => {} })
    );
    // onChange present → dots should have cursor:pointer
    assert.ok(html.includes('cursor:pointer') || html.includes('cursor: pointer'));
  });

});
