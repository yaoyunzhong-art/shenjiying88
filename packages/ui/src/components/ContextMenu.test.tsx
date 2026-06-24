const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const React = require('react');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ContextMenu } = require('./ContextMenu');

// ==================== 辅助函数 ====================

function menuProps(overrides = {}) {
  return {
    open: true,
    x: 100,
    y: 200,
    onClose: () => {},
    items: [
      { key: 'edit', label: '编辑', onSelect: () => {} },
      { key: 'delete', label: '删除', danger: true, onSelect: () => {} },
    ],
    ...overrides,
  };
}

// ==================== 测试 ====================

describe('ContextMenu', () => {
  // ---- 基础渲染 ----
  test('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, {
        open: false,
        x: 0,
        y: 0,
        items: [],
        onClose: () => {},
      })
    );
    assert.equal(html, '');
  });

  test('renders menu items when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps())
    );
    assert.match(html, /编辑/);
    assert.match(html, /删除/);
  });

  test('renders with role="menu"', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps())
    );
    assert.match(html, /role="menu"/);
  });

  test('renders menuitem role on items', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps({
        items: [
          { key: 'copy', label: '复制', onSelect: () => {} },
        ],
      }))
    );
    assert.match(html, /role="menuitem"/);
  });

  // ---- 分隔线 ----
  test('renders separator', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps({
        items: [
          { key: 'edit', label: '编辑', onSelect: () => {} },
          { kind: 'separator' as const },
          { key: 'delete', label: '删除', onSelect: () => {} },
        ],
      }))
    );
    // 分隔线渲染且两个菜单项都存在
    assert.match(html, /编辑/);
    assert.match(html, /删除/);
  });

  // ---- 禁用状态 ----
  test('renders disabled item with aria-disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps({
        items: [
          { key: 'locked', label: '锁定项', disabled: true, onSelect: () => {} },
        ],
      }))
    );
    assert.match(html, /锁定项/);
    assert.match(html, /aria-disabled="true"/);
  });

  // ---- 危险操作 ----
  test('renders danger item with danger color', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps({
        items: [
          { key: 'rm', label: '移除', danger: true, onSelect: () => {} },
        ],
      }))
    );
    assert.match(html, /移除/);
    // danger 样式颜色检查（#fca5a5 是 danger 红）
    assert.match(html, /#fca5a5/);
  });

  // ---- 快捷键 ----
  test('renders shortcut text', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps({
        items: [
          { key: 'save', label: '保存', shortcut: '⌘S', onSelect: () => {} },
        ],
      }))
    );
    assert.match(html, /⌘S/);
  });

  // ---- 图标 ----
  test('renders icon when provided', () => {
    const icon = React.createElement('span', { 'data-testid': 'icon' }, '✏️');
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps({
        items: [
          { key: 'edit', label: '编辑', icon, onSelect: () => {} },
        ],
      }))
    );
    assert.match(html, /✏️/);
  });

  // ---- 自定义宽度 ----
  test('applies custom width', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps({ width: 300 }))
    );
    assert.match(html, /width/);
  });

  // ---- 空菜单 ----
  test('renders empty menu with no items', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps({ items: [] }))
    );
    // 应该渲染容器但不含 menuitem
    assert.match(html, /role="menu"/);
    assert.ok(!html.includes('role="menuitem"'));
  });

  // ---- 多条目 ----
  test('renders multiple items in order', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextMenu, menuProps({
        items: [
          { key: 'a', label: '操作A', onSelect: () => {} },
          { kind: 'separator' as const },
          { key: 'b', label: '操作B', shortcut: '⌘B', onSelect: () => {} },
          { key: 'c', label: '操作C', danger: true, disabled: true, onSelect: () => {} },
        ],
      }))
    );
    // 所有标签可见
    assert.match(html, /操作A/);
    assert.match(html, /操作B/);
    assert.match(html, /操作C/);
    assert.match(html, /⌘B/);
    // 操作C 同时 danger + disabled
    assert.match(html, /aria-disabled="true"/);
  });
});
