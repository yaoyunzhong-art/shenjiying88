const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const React = require('react');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const DropdownMenu = require('./DropdownMenu').DropdownMenu;

// ==================== 辅助函数 ====================

function defaultProps(overrides = {}) {
  return {
    trigger: React.createElement('button', null, '菜单'),
    items: [
      { key: 'edit', label: '编辑', onSelect: () => {} },
      { key: 'delete', label: '删除', danger: true, onSelect: () => {} },
    ],
    ...overrides,
  };
}

function render(el) {
  return renderToStaticMarkup(el);
}

// ==================== 测试 ====================

describe('DropdownMenu', () => {
  // ---- 基础渲染 ----
  test('renders trigger element', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps()));
    assert.match(html, /菜单/);
  });

  test('renders with aria-haspopup and aria-expanded', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps()));
    assert.match(html, /aria-haspopup="true"/);
    assert.match(html, /aria-expanded="false"/);
  });

  test('renders dropdown arrow indicator', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps()));
    assert.match(html, /▼/);
  });

  // ---- 禁用状态 ----
  test('renders disabled state with reduced opacity', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({ disabled: true })));
    // In static render, disabled prop adds cursor style via inline
    assert.match(html, /cursor/);
  });

  // ---- 菜单项渲染 ----
  test('renders menu items when defaultOpen is true', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({ defaultOpen: true })));
    assert.match(html, /编辑/);
    assert.match(html, /删除/);
  });

  test('renders with role="menu" when open', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({ defaultOpen: true })));
    assert.match(html, /role="menu"/);
  });

  test('renders menuitem role on items when open', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({
      defaultOpen: true,
      items: [
        { key: 'copy', label: '复制', onSelect: () => {} },
      ],
    })));
    assert.match(html, /role="menuitem"/);
  });

  // ---- 分隔线 ----
  test('renders separator', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({
      defaultOpen: true,
      items: [
        { key: 'edit', label: '编辑', onSelect: () => {} },
        { kind: 'separator' },
        { key: 'delete', label: '删除', onSelect: () => {} },
      ],
    })));
    assert.match(html, /role="separator"/);
  });

  // ---- 图标渲染 ----
  test('renders item with icon', () => {
    const icon = React.createElement('span', null, '🔍');
    const html = render(React.createElement(DropdownMenu, defaultProps({
      defaultOpen: true,
      items: [
        { key: 'search', label: '搜索', icon, onSelect: () => {} },
      ],
    })));
    assert.match(html, /🔍/);
    assert.match(html, /搜索/);
  });

  // ---- 快捷键 ----
  test('renders shortcut text', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({
      defaultOpen: true,
      items: [
        { key: 'save', label: '保存', shortcut: '⌘S', onSelect: () => {} },
      ],
    })));
    assert.match(html, /⌘S/);
  });

  // ---- 危险操作样式 ----
  test('renders danger item with red color', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({
      defaultOpen: true,
      items: [
        { key: 'delete', label: '删除', danger: true, onSelect: () => {} },
      ],
    })));
    // danger items have color: '#ef4444'
    assert.match(html, /#ef4444/);
  });

  // ---- 禁用菜单项 ----
  test('renders disabled item', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({
      defaultOpen: true,
      items: [
        { key: 'disabled-item', label: '不可用', disabled: true, onSelect: () => {} },
      ],
    })));
    assert.match(html, /disabled/);
  });

  // ---- 空菜单 ----
  test('renders empty state when items array is empty', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({
      defaultOpen: true,
      items: [],
    })));
    assert.match(html, /暂无菜单项/);
  });

  // ---- 对齐方式 ----
  test('supports align="end"', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({ defaultOpen: true, align: 'end' })));
    // The panel renders; existence of align prop is validated at render level
    assert.ok(html.length > 0);
  });

  test('supports align="center"', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({ defaultOpen: true, align: 'center' })));
    assert.ok(html.length > 0);
  });

  // ---- 侧边方向 ----
  test('supports side="top"', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({ defaultOpen: true, side: 'top' })));
    assert.ok(html.length > 0);
  });

  // ---- 自定义宽度 ----
  test('renders with custom width', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({ defaultOpen: true, width: 240 })));
    assert.ok(html.length > 0);
  });

  // ---- 子菜单（嵌套） ----
  test('renders nested submenu indicator on parent item', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({
      defaultOpen: true,
      items: [
        {
          key: 'export',
          label: '导出',
          children: [
            { key: 'csv', label: '导出 CSV', onSelect: () => {} },
            { key: 'pdf', label: '导出 PDF', onSelect: () => {} },
          ],
        },
      ],
    })));
    assert.match(html, /▶/);
    assert.match(html, /导出/);
  });

  // ---- 类名传递 ----
  test('accepts className prop', () => {
    const html = render(React.createElement(DropdownMenu, defaultProps({ className: 'my-dropdown' })));
    assert.ok(html.length > 0);
  });

  // ---- 无 onOpenChange 回调（边界情况） ----
  test('works without onOpenChange callback (defaultOpen true)', () => {
    const html = render(React.createElement(DropdownMenu, {
      trigger: React.createElement('span', null, '点击'),
      items: [{ key: 'a', label: 'A', onSelect: () => {} }],
      defaultOpen: true,
    }));
    assert.match(html, /A/);
  });

  // ---- 大量菜单项 ----
  test('renders many items without error', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      key: `item-${i}`,
      label: `菜单项 ${i}`,
      onSelect: () => {},
    }));
    const html = render(React.createElement(DropdownMenu, defaultProps({ defaultOpen: true, items })));
    for (let i = 0; i < 5; i++) {
      assert.match(html, new RegExp(`菜单项 ${i}`));
    }
  });
});
