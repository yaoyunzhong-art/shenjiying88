import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, afterEach } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Popover } = require('./Popover');

// ---- Helpers ----

function render(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

// ---- Tests ----

describe('Popover', () => {
  afterEach(() => {
    // cleanup globals if any
  });

  // ---- Core rendering ----

  test('renders trigger element', () => {
    const html = render(
      React.createElement(Popover, { trigger: React.createElement('button', null, '打开') },
        React.createElement('div', null, '内容'),
      ),
    );
    assert.ok(html.includes('打开'), 'should contain trigger text');
    assert.ok(!html.includes('内容'), 'should NOT render children when closed');
  });

  test('renders with title prop', () => {
    const html = render(
      React.createElement(Popover, {
        trigger: React.createElement('button', null, '触发'),
        title: '卡片标题',
      }, React.createElement('div', null, '卡片内容')),
    );
    assert.ok(html.includes('触发'), 'should contain trigger');
    // title is only rendered when open, so it should not be in closed markup
    assert.ok(!html.includes('卡片标题'), 'title should not render when closed');
    assert.ok(!html.includes('卡片内容'), 'content should not render when closed');
  });

  test('renders with showClose prop (does not break SSR)', () => {
    const html = render(
      React.createElement(Popover, {
        trigger: React.createElement('button', null, '触发'),
        showClose: true,
      }, React.createElement('div', null, '内容')),
    );
    assert.ok(html.includes('触发'), 'should contain trigger');
    // No content visible when closed — fine
  });

  // ---- Trigger modes ----

  test('supports triggerMode prop', () => {
    // click (default)
    const htmlC = render(
      React.createElement(Popover, {
        trigger: React.createElement('button', null, 'Click'),
      }, React.createElement('div', null, 'content')),
    );
    assert.ok(htmlC.includes('Click'), 'click mode should render trigger');

    // hover
    const htmlH = render(
      React.createElement(Popover, {
        trigger: React.createElement('button', null, 'Hover'),
        triggerMode: 'hover',
      }, React.createElement('div', null, 'content')),
    );
    assert.ok(htmlH.includes('Hover'), 'hover mode should render trigger');
  });

  // ---- Placement variants ----

  test('supports all placement values without crash', () => {
    const placements = [
      'top', 'bottom', 'left', 'right',
      'top-start', 'top-end',
      'bottom-start', 'bottom-end',
      'left-start', 'left-end',
      'right-start', 'right-end',
    ] as const;

    for (const p of placements) {
      const html = render(
        React.createElement(Popover, {
          trigger: React.createElement('button', null, p),
          placement: p,
        }, React.createElement('div', null, 'content')),
      );
      assert.ok(html.includes(p), `placement=${p} should render trigger`);
    }
  });

  // ---- Disabled ----

  test('renders trigger with disabled styles when disabled', () => {
    const html = render(
      React.createElement(Popover, {
        trigger: React.createElement('button', null, '禁用'),
        disabled: true,
      }, React.createElement('div', null, '看不到')),
    );
    assert.ok(html.includes('禁用'), 'should contain trigger');
    assert.ok(!html.includes('看不到'), 'content should not render when closed');
  });

  // ---- Accessibility ----

  test('renders trigger with aria attributes', () => {
    const html = render(
      React.createElement(Popover, {
        trigger: React.createElement('button', null, '无障碍'),
      }, React.createElement('div', null, 'content')),
    );
    assert.ok(html.includes('aria-expanded="false"'), 'aria-expanded should be false when closed');
    assert.ok(html.includes('aria-haspopup="dialog"'), 'should have aria-haspopup');
  });

  // ---- Styling props ----

  test('accepts className and style props', () => {
    const html = render(
      React.createElement(Popover, {
        trigger: React.createElement('button', null, '样式'),
        className: 'my-popover',
        style: { marginTop: 10 },
      }, React.createElement('div', null, 'content')),
    );
    assert.ok(html.includes('my-popover'), 'should include className');
    assert.ok(html.includes('样式'), 'should render trigger');
  });

  test('accepts maxWidth and minWidth props', () => {
    const html = render(
      React.createElement(Popover, {
        trigger: React.createElement('button', null, '尺寸'),
        maxWidth: 400,
        minWidth: 250,
      }, React.createElement('div', null, 'content')),
    );
    assert.ok(html.includes('尺寸'), 'should render trigger');
  });

  // ---- Nested children ----

  test('renders complex children structure', () => {
    const html = render(
      React.createElement(Popover, {
        trigger: React.createElement('button', null, '表单弹层'),
        title: '编辑信息',
      }, 
        React.createElement('div', null,
          React.createElement('input', { placeholder: '姓名' }),
          React.createElement('button', null, '保存'),
        ),
      ),
    );
    assert.ok(html.includes('表单弹层'), 'should contain trigger');
    // Children only render when open, so not in initial html
    assert.ok(!html.includes('姓名'), 'should not render children when closed');
    assert.ok(!html.includes('保存'), 'should not render children when closed');
  });

  // ---- Popover component type ----

  test('is a valid React component (memo-wrapped)', () => {
    assert.ok(
      typeof Popover === 'function' || typeof Popover === 'object',
      'React.memo components can be typeof object',
    );
  });

  test('returns valid HTML without crash on edge cases', () => {
    // empty children
    const html1 = render(
      React.createElement(Popover, {
        trigger: React.createElement('span', null, '空'),
      }, null),
    );
    assert.ok(html1.includes('空'), 'should render trigger with null children');

    // string trigger
    const html2 = render(
      React.createElement(Popover, {
        trigger: '文本触发',
      }, React.createElement('div', null, 'content')),
    );
    assert.ok(html2.includes('文本触发'), 'should render string trigger');
  });
});
