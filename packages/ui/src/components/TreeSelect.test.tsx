import React from 'react';
import type { TreeSelectNode } from './TreeSelect';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { TreeSelect } = require('./TreeSelect');

const treeData: TreeSelectNode[] = [
  {
    value: 'dept-1',
    label: '总部',
    children: [
      { value: 'dept-1-1', label: '技术部' },
      { value: 'dept-1-2', label: '市场部', disabled: true },
      { value: 'dept-1-3', label: '销售部', children: [{ value: 'dept-1-3-1', label: '华东区' }, { value: 'dept-1-3-2', label: '华南区' }] },
    ],
  },
  {
    value: 'dept-2',
    label: '门店',
    children: [
      { value: 'dept-2-1', label: '北京店' },
      { value: 'dept-2-2', label: '上海店' },
    ],
  },
];

describe('TreeSelect', () => {
  // ========== 基础渲染 ==========
  test('renders placeholder when no value', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
        placeholder: '请选择部门',
      }),
    );
    assert.match(html, /请选择部门/);
  });

  test('renders selected node label when value is set', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        value: 'dept-1-1',
        treeData,
      }),
    );
    assert.match(html, /技术部/);
    assert.doesNotMatch(html, /请选择/);
  });

  test('renders selected deeply nested node label', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        value: 'dept-1-3-1',
        treeData,
      }),
    );
    assert.match(html, /华东区/);
  });

  test('renders with empty treeData gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData: [],
        placeholder: '无数据',
      }),
    );
    assert.match(html, /无数据/);
  });

  test('renders with undefined value', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
      }),
    );
    assert.match(html, /请选择/);
  });

  // ========== ARIA 属性 ==========
  test('has combobox role and aria attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
        'aria-label': '选择部门',
      }),
    );
    assert.match(html, /role="combobox"/);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /aria-haspopup="tree"/);
    assert.match(html, /aria-label="选择部门"/);
  });

  test('trigger button has aria-disabled when disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
        disabled: true,
      }),
    );
    assert.match(html, /aria-disabled="true"/);
  });

  // ========== 禁用状态 ==========
  test('renders disabled state without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        value: 'dept-1',
        treeData,
        disabled: true,
      }),
    );
    assert.match(html, /总部/);
  });

  // ========== 清除按钮 ==========
  test('renders clear button when allowClear and value is set', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        value: 'dept-2-1',
        treeData,
        allowClear: true,
      }),
    );
    assert.match(html, /北京店/);
    assert.match(html, /aria-label="清除选择"/);
    assert.match(html, /✕/);
  });

  test('does not render clear button when allowClear but no value', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
        allowClear: true,
      }),
    );
    assert.doesNotMatch(html, /清除选择/);
  });

  test('does not render clear button when allowClear is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        value: 'dept-1',
        treeData,
      }),
    );
    assert.doesNotMatch(html, /清除选择/);
  });

  // ========== SSR 状态下菜单不渲染 ==========
  test('dropdown tree is not rendered in SSR (open=false)', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
      }),
    );
    assert.doesNotMatch(html, /role="tree"/);
  });

  // ========== 隐藏 input 用于表单 ==========
  test('renders hidden input for form integration', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        name: 'department',
        value: 'dept-2-2',
        treeData,
      }),
    );
    assert.match(html, /type="hidden"/);
    assert.match(html, /name="department"/);
    assert.match(html, /value="dept-2-2"/);
  });

  test('hidden input has empty value when no selection', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        name: 'department',
        treeData,
      }),
    );
    assert.match(html, /type="hidden"/);
    assert.match(html, /value=""/);
  });

  // ========== 空数据 ==========
  test('accepts custom notFoundContent without crash (SSR — dropdown closed)', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData: [],
        notFoundContent: '暂无部门数据',
      }),
    );
    assert.match(html, /请选择/);
    assert.doesNotMatch(html, /role="tree"/);
  });

  // ========== 边界情况 ==========
  test('renders with a single node', () => {
    const singleNode: TreeSelectNode[] = [{ value: 'root', label: '根节点' }];
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        value: 'root',
        treeData: singleNode,
      }),
    );
    assert.match(html, /根节点/);
  });

  test('renders with deep nesting', () => {
    const deep: TreeSelectNode[] = [
      {
        value: 'l1',
        label: 'L1',
        children: [
          {
            value: 'l2',
            label: 'L2',
            children: [
              {
                value: 'l3',
                label: 'L3',
                children: [{ value: 'l4', label: 'L4' }],
              },
            ],
          },
        ],
      },
    ];
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        value: 'l4',
        treeData: deep,
      }),
    );
    assert.match(html, /L4/);
  });

  test('renders with special characters in label', () => {
    const specialData: TreeSelectNode[] = [
      { value: 'xss', label: '<img src=x onerror=alert(1)>' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        value: 'xss',
        treeData: specialData,
      }),
    );
    // React escapes by default
    assert.match(html, /onerror/);
  });

  test('renders with many nodes without crash', () => {
    const many: TreeSelectNode[] = Array.from({ length: 50 }, (_, i) => ({
      value: `node-${i}`,
      label: `节点 ${i}`,
    }));
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        value: 'node-25',
        treeData: many,
      }),
    );
    assert.match(html, /节点 25/);
  });

  // ========== className / style ==========
  test('applies custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
        className: 'my-tree-select',
      }),
    );
    assert.match(html, /my-tree-select/);
  });

  test('applies custom style', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
        style: { width: 320 },
      }),
    );
    assert.match(html, /width/);
  });

  test('accepts dropdownClassName without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
        dropdownClassName: 'custom-dropdown',
      }),
    );
    assert.match(html, /请选择/);
  });

  // ========== tabIndex ==========
  test('not disabled tree select has tabIndex 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
      }),
    );
    assert.match(html, /tabindex="0"/);
  });

  test('disabled tree select has tabIndex -1', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
        disabled: true,
      }),
    );
    assert.match(html, /tabindex="-1"/);
  });

  // ========== 箭头图标 ==========
  test('renders dropdown arrow indicator', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
      }),
    );
    assert.match(html, /▼/);
  });

  // ========== minWidth ==========
  test('accepts minWidth prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(TreeSelect, {
        treeData,
        minWidth: 250,
      }),
    );
    assert.match(html, /250/);
  });

  // ========== 类型导出检查 ==========
  test('TreeSelect component is a function', () => {
    assert.strictEqual(typeof TreeSelect, 'function');
  });

  test('TreeSelect component has display name or is named function', () => {
    assert.strictEqual(TreeSelect.name, 'TreeSelect');
  });
});
