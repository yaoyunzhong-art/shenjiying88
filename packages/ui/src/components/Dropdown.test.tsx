import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { Dropdown } = require('./Dropdown');

describe('Dropdown', () => {
  const basicItems = [
    { key: 'edit', label: '编辑', onClick: () => {} },
    { key: 'delete', label: '删除', danger: true, onClick: () => {} },
  ];

  // ── 触发器渲染 ──
  test('renders trigger element', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '操作'),
        items: basicItems,
      })
    );
    assert.match(html, /<button>操作<\/button>/);
  });

  test('menu is not rendered by default (open=false in SSR)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '操作'),
        items: basicItems,
      })
    );
    assert.doesNotMatch(html, /role="menu"/);
  });

  test('trigger has aria-expanded=false and aria-haspopup initially', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '操作'),
        items: basicItems,
      })
    );
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /aria-haspopup="menu"/);
  });

  test('trigger div has role button and tabindex 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('span', null, '菜单'),
        items: basicItems,
      })
    );
    assert.match(html, /role="button"/);
    assert.match(html, /tabindex="0"/);
  });

  // ── 禁用状态 ──
  test('disabled state adds not-allowed cursor and reduced opacity', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '操作'),
        items: basicItems,
        disabled: true,
      })
    );
    assert.match(html, /not-allowed/);
    assert.doesNotMatch(html, /pointer/); // default is 'pointer', disabled should override
  });

  test('disabled trigger still renders trigger content', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '禁用菜单'),
        items: basicItems,
        disabled: true,
      })
    );
    assert.match(html, /禁用菜单/);
  });

  // ── 对齐方式 ──
  test('align left is default and outer div has relative positioning', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '左对齐'),
        items: basicItems,
      })
    );
    assert.match(html, /relative/);
    assert.match(html, /inline-block/);
  });

  test('align = right renders trigger normally', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '右对齐'),
        items: basicItems,
        align: 'right',
      })
    );
    assert.match(html, /右对齐/);
  });

  // ── minWidth ──
  test('minWidth prop does not crash rendering', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '宽菜单'),
        items: basicItems,
        minWidth: 200,
      })
    );
    assert.match(html, /宽菜单/);
  });

  // ── triggerMode ──
  test('triggerMode hover does not affect SSR output', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '悬浮'),
        items: basicItems,
        triggerMode: 'hover',
      })
    );
    assert.match(html, /悬浮/);
  });

  // ── 自定义 className / style ──
  test('className is applied to outermost div', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '自定义类'),
        items: basicItems,
        className: 'my-custom-dropdown',
      })
    );
    assert.match(html, /class="my-custom-dropdown"/);
  });

  test('custom style is merged with default style', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '样式'),
        items: basicItems,
        style: { margin: '10px', zIndex: 999 },
      })
    );
    // The outer div style string should contain both default and custom
    assert.match(html, /margin/);
    assert.match(html, /inline-block/);
  });

  // ── 动画样式 ──
  test('renders @keyframes dropdown-slide-in style block', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '动画'),
        items: basicItems,
      })
    );
    assert.match(html, /dropdown-slide-in/);
    assert.match(html, /@keyframes/);
  });

  // ── 空 items ──
  test('empty items array renders trigger without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '空'),
        items: [],
      })
    );
    assert.match(html, />空</);
    assert.doesNotMatch(html, /role="menu"/);
  });

  // ── items 含分隔线和危险项 (仅验证结构不崩溃) ──
  test('items with divider, danger, disabled render without SSR crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '完整菜单'),
        items: [
          { key: 'view', label: '查看' },
          { key: 'div', label: '', divider: true },
          { key: 'delete', label: '删除', danger: true },
          { key: 'disabled-item', label: '禁用项', disabled: true },
        ],
      })
    );
    assert.match(html, /完整菜单/);
  });

  // ── items 含 icon ──
  test('items with icon render trigger without SSR crash', () => {
    const icon = React.createElement('span', null, '🔔');
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '有图标'),
        items: [
          { key: 'notif', label: '通知', icon },
        ],
      })
    );
    assert.match(html, /有图标/);
  });

  // ── onItemClick callback (SSR shows trigger only) ──
  test('trigger renders correctly with onClick items defined', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '点击'),
        items: [
          { key: 'act', label: '执行', onClick: () => {} },
        ],
      })
    );
    assert.match(html, /点击/);
    // Items are only visible in client-side state, verify trigger renders
    assert.ok(html.includes('aria-expanded="false"'));
  });

  // ── 键盘事件 handler ──
  test('trigger has onKeyDown handler (Enter/Space via onKeyDown attr not in SSR but structure is valid)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '键盘'),
        items: basicItems,
      })
    );
    assert.match(html, /键盘/);
  });

  // ── 结构完整 ──
  test('outer wrapper div closes properly', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '结构'),
        items: basicItems,
      })
    );
    assert.ok(html.endsWith('</div>'));
  });

  test('trigger wraps the custom node in a div with cursor styles', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '包装'),
        items: basicItems,
      })
    );
    // The outer trigger container has inline-flex display
    assert.match(html, /inline-flex/);
  });

  // ── 多 children 不崩溃 ──
  test('works with complex trigger (fragment)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement(React.Fragment, null,
          React.createElement('span', null, '🔽'),
          React.createElement('span', null, '菜单')
        ),
        items: basicItems,
      })
    );
    assert.match(html, /🔽/);
    assert.match(html, /菜单/);
  });

  // ── 普通 / 危险 / 禁用 标签在 SSR 中不可见但结构正确 ──
  test('simple structure snapshot minima', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, 'Go'),
        items: basicItems,
      })
    );
    assert.ok(html.includes('relative'));
    assert.ok(html.includes('cursor:pointer'));
    assert.ok(html.includes('tabindex="0"'));
    assert.ok(html.includes('aria-haspopup="menu"'));
  });

  // ── disabled + style + className combo ──
  test('disabled + custom className + custom style works together', () => {
    const html = renderToStaticMarkup(
      React.createElement(Dropdown, {
        trigger: React.createElement('button', null, '复合'),
        items: basicItems,
        disabled: true,
        className: 'combo',
        style: { margin: 5 },
      })
    );
    assert.match(html, /class="combo"/);
    assert.match(html, /not-allowed/);
    assert.match(html, /margin/);
  });
});
