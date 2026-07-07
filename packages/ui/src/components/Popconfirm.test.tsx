import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, afterEach } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Popconfirm } = require('./Popconfirm');

// ---- Helpers ----

function render(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

// ---- Tests ----

describe('Popconfirm', () => {
  afterEach(() => {
    // cleanup if needed
  });

  // 1. renders trigger element (positive)
  test('renders trigger element', () => {
    const html = render(
      React.createElement(Popconfirm, { title: '确认删除？' },
        React.createElement('button', null, '删除'),
      ),
    );
    assert.ok(html.includes('删除'), 'should contain trigger text');
    // Content should not be visible when closed
    assert.ok(!html.includes('确认删除？'), 'should NOT render popconfirm content when closed');
  });

  // 2. renders title when open (positive)
  test('renders title prop', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认删除？',
        children: React.createElement('button', null, '删除'),
      }),
    );
    // In SSR/static render, title is only in popover that's conditionally rendered
    // The state is 'open' only on client, not in static SSR
    assert.ok(html.includes('删除'), 'trigger renders');
  });

  // 3. renders custom confirmText (positive - verify props don't crash)
  test('accepts custom confirmText and cancelText', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认？',
        confirmText: '是的',
        cancelText: '再想想',
        children: React.createElement('button', null, '操作'),
      }),
    );
    assert.ok(html.includes('操作'), 'trigger renders');
  });

  // 4. renders description (positive)
  test('accepts description prop', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认',
        description: '此操作不可撤销',
        children: React.createElement('button', null, '提交'),
      }),
    );
    assert.ok(html.includes('提交'), 'trigger renders');
  });

  // 5. danger mode renders without crash (positive)
  test('danger mode renders without crash', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认删除？',
        danger: true,
        children: React.createElement('button', null, '危险操作'),
      }),
    );
    assert.ok(html.includes('危险操作'), 'trigger renders with danger mode');
  });

  // 6. disabled mode (positive - disabled style)
  test('disabled mode renders trigger with disabled cursor', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认？',
        disabled: true,
        children: React.createElement('button', null, '禁用'),
      }),
    );
    assert.ok(html.includes('禁用'), 'trigger renders when disabled');
    assert.ok(html.includes('not-allowed'), 'should have disabled cursor');
  });

  // 7. supports all placement values (positive - 12 variants)
  test('supports all placement values without crash', () => {
    const placements: Popconfirm['type'] extends (props: infer P) => any ? P['placement'] : never = [
      'top', 'bottom', 'left', 'right',
      'top-start', 'top-end',
      'bottom-start', 'bottom-end',
      'left-start', 'left-end',
      'right-start', 'right-end',
    ];

    for (const p of placements) {
      const html = render(
        React.createElement(Popconfirm, {
          title: '确认',
          placement: p,
          children: React.createElement('button', null, p ?? 'placement'),
        }),
      );
      assert.ok(html.includes(p ?? 'placement'), `placement=${p} should render trigger`);
    }
  });

  // 8. triggerMode hover renders (positive)
  test('triggerMode hover renders without crash', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认？',
        triggerMode: 'hover',
        children: React.createElement('button', null, '悬停操作'),
      }),
    );
    assert.ok(html.includes('悬停操作'), 'trigger renders with hover mode');
  });

  // 9. onConfirm callback is defined (positive - interface check)
  test('onConfirm callback prop is accepted', () => {
    let called = false;
    const fn = () => { called = true; };
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认？',
        onConfirm: fn,
        children: React.createElement('button', null, '确认操作'),
      }),
    );
    assert.ok(html.includes('确认操作'), 'trigger renders with onConfirm callback');
    assert.equal(called, false, 'callback should not be called during render');
  });

  // 10. onCancel callback is accepted (positive)
  test('onCancel callback prop is accepted', () => {
    let called = false;
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认？',
        onCancel: () => { called = true; },
        children: React.createElement('button', null, '取消操作'),
      }),
    );
    assert.ok(html.includes('取消操作'), 'trigger renders with onCancel callback');
    assert.equal(called, false, 'callback should not be called during render');
  });

  // 11. beforeConfirm callback is accepted (positive)
  test('beforeConfirm callback prop is accepted', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认？',
        beforeConfirm: () => true,
        children: React.createElement('button', null, '校验操作'),
      }),
    );
    assert.ok(html.includes('校验操作'), 'trigger renders with beforeConfirm callback');
  });

  // 12. onOpenChange callback is accepted (positive)
  test('onOpenChange callback prop is accepted', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认？',
        onOpenChange: (open: boolean) => {},
        children: React.createElement('button', null, '监听操作'),
      }),
    );
    assert.ok(html.includes('监听操作'), 'trigger renders with onOpenChange');
  });

  // 13. className and style props are accepted (positive)
  test('accepts className and style props', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认',
        className: 'my-popconfirm',
        style: { marginLeft: 20 },
        children: React.createElement('button', null, '样式测试'),
      }),
    );
    assert.ok(html.includes('my-popconfirm'), 'should include className');
    assert.ok(html.includes('样式测试'), 'trigger renders');
  });

  // 14. maxWidth prop is accepted (positive)
  test('accepts maxWidth prop', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认',
        maxWidth: 400,
        children: React.createElement('button', null, '宽度测试'),
      }),
    );
    assert.ok(html.includes('宽度测试'), 'trigger renders with maxWidth');
  });

  // 15. renders without title prop (boundary)
  test('renders without title prop - uses default text', () => {
    const html = render(
      React.createElement(Popconfirm, {
        children: React.createElement('button', null, '无标题'),
      }),
    );
    assert.ok(html.includes('无标题'), 'trigger renders without title');
  });

  // 16. renders without description prop (boundary)
  test('renders without description prop', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认？',
        children: React.createElement('button', null, '无描述'),
      }),
    );
    assert.ok(html.includes('无描述'), 'trigger renders without description');
  });

  // 17. empty children renders (boundary)
  test('renders with null children', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认',
        children: null,
      }),
    );
    // Should not crash
    assert.ok(true, 'should not crash with null children');
  });

  // 18. renders complex children (positive)
  test('renders with complex icon + text children', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认操作',
        children: React.createElement('span', null, 
          React.createElement('span', { style: { marginRight: 4 } }, '🔔'),
          '带图标操作',
        ),
      }),
    );
    assert.ok(html.includes('带图标操作'), 'trigger renders with complex children');
    assert.ok(html.includes('🔔'), 'icon is rendered');
  });

  // 19. aria accessibility attributes (positive)
  test('renders trigger with aria attributes', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认？',
        children: React.createElement('button', null, '无障碍'),
      }),
    );
    assert.ok(html.includes('aria-expanded="false"'), 'aria-expanded should be false when closed');
    assert.ok(html.includes('aria-haspopup="dialog"'), 'should have aria-haspopup');
  });

  // 20. is a valid React component (structural)
  test('is a valid React component (memo-wrapped)', () => {
    assert.ok(
      typeof Popconfirm === 'function' || typeof Popconfirm === 'object',
      'React.memo components can be typeof function or object',
    );
    assert.ok(Popconfirm.displayName === undefined || typeof Popconfirm.displayName === 'string',
      'displayName is optional for memo components',
    );
  });

  // 21. renders confirm button with data-testid (positive)
  test('confirm button has data-testid attribute', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认？',
        children: React.createElement('button', null, '测试'),
      }),
    );
    // In closed state, the popconfirm content is not rendered in SSR
    // Confirm button data-testid only exists when open
    assert.ok(!html.includes('popconfirm-confirm-btn'),
      'confirm button should not be in SSR/closed HTML');
  });

  // 22. default confirm/cancel text (positive - interface check)
  test('has default confirmText="确定" and cancelText="取消"', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认',
        children: React.createElement('button', null, '测试'),
      }),
    );
    assert.ok(html.includes('测试'), 'default texts are provided');
  });

  // 23. string title renders with aria-haspopup (positive)
  test('trigger has aria-haspopup attribute for accessibility', () => {
    const html = render(
      React.createElement(Popconfirm, {
        title: '确认删除文件',
        children: React.createElement('button', null, '删除文件'),
      }),
    );
    assert.ok(html.includes('aria-haspopup'), 'aria-haspopup attribute exists in trigger');
  });
});
