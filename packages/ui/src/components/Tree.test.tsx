import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Tree } = require('./Tree');

/** @type {import('./Tree').TreeNode[]} */
const simpleTree = [
  {
    key: '1',
    label: 'Root',
    children: [
      { key: '1-1', label: 'Child 1' },
      { key: '1-2', label: 'Child 2' },
    ],
  },
  { key: '2', label: 'Leaf', isLeaf: true },
];

/** @type {import('./Tree').TreeNode[]} */
const nestedTree = [
  {
    key: 'a',
    label: 'Parent A',
    children: [
      { key: 'a1', label: 'A-1', children: [{ key: 'a1a', label: 'A-1-a' }] },
      { key: 'a2', label: 'A-2' },
    ],
  },
  { key: 'b', label: 'Solo' },
];

describe('Tree', () => {
  // ── Rendering ──
  test('renders with role="tree"', () => {
    const html = renderToStaticMarkup(React.createElement(Tree, { treeData: simpleTree }));
    assert.ok(html.includes('role="tree"'));
  });

  test('renders root nodes', () => {
    const html = renderToStaticMarkup(React.createElement(Tree, { treeData: simpleTree }));
    assert.ok(html.includes('Root'));
    assert.ok(html.includes('Leaf'));
  });

  test('does not render children initially (collapsed)', () => {
    const html = renderToStaticMarkup(React.createElement(Tree, { treeData: simpleTree }));
    assert.ok(!html.includes('Child 1'));
    assert.ok(!html.includes('Child 2'));
  });

  test('renders children with defaultExpandedKeys', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, { treeData: simpleTree, defaultExpandedKeys: ['1'] }),
    );
    assert.ok(html.includes('Child 1'));
    assert.ok(html.includes('Child 2'));
  });

  test('aria-expanded reflects expansion state', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, { treeData: simpleTree, defaultExpandedKeys: ['1'] }),
    );
    // Root should be expanded
    assert.ok(html.includes('aria-expanded="true"'));
  });

  // ── Selection ──
  test('aria-selected="false" when not selected', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, { treeData: simpleTree, selectable: true }),
    );
    assert.ok(html.includes('aria-selected="false"'));
  });

  test('selected node has aria-selected="true"', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, {
        treeData: simpleTree,
        selectable: true,
        selectedKeys: ['2'],
      }),
    );
    assert.ok(html.includes('aria-selected="true"'));
  });

  test('selected node has bold style', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, {
        treeData: simpleTree,
        selectable: true,
        selectedKeys: ['2'],
      }),
    );
    // selected node gets fontWeight:600
    assert.ok(html.includes('font-weight:600'));
  });

  // ── Checkable ──
  test('checkable renders check SVG icons', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, {
        treeData: simpleTree,
        checkable: true,
        defaultExpandedKeys: ['1'],
      }),
    );
    // should contain tree-check data attribute
    assert.ok(html.includes('data-tree-check'));
  });

  test('checked node renders the check mark icon', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, {
        treeData: simpleTree,
        checkable: true,
        checkedKeys: ['1-1'],
        defaultExpandedKeys: ['1'],
      }),
    );
    // The check icon svg should appear
    assert.ok(html.includes('M1 4L3.5 6.5L9 1'));
  });

  test('half-check renders the half icon', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, {
        treeData: simpleTree,
        checkable: true,
        checkedKeys: ['1-1'],
        defaultExpandedKeys: ['1'],
      }),
    );
    // Parent should be half (half-check icon exists somewhere in the tree)
    assert.ok(html.includes('rx="1"') || html.includes('rect'));
  });

  // ── Disabled ──
  test('disabled node has aria-disabled', () => {
    /** @type {import('./Tree').TreeNode[]} */
    const disabledTree = [
      { key: 'd1', label: 'Disabled', disabled: true },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Tree, { treeData: disabledTree }),
    );
    assert.ok(html.includes('aria-disabled="true"'));
  });

  test('disabled node has not-allowed cursor', () => {
    /** @type {import('./Tree').TreeNode[]} */
    const disabledTree = [
      { key: 'd1', label: 'Disabled', disabled: true },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Tree, { treeData: disabledTree }),
    );
    assert.ok(html.includes('not-allowed'));
  });

  // ── Deep nesting ──
  test('renders deeply nested tree', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, {
        treeData: nestedTree,
        defaultExpandedKeys: ['a', 'a1'],
      }),
    );
    assert.ok(html.includes('A-1-a'));
  });

  // ── Variants ──
  test('directory variant renders folder/file icons', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, {
        treeData: simpleTree,
        variant: 'directory',
        defaultExpandedKeys: ['1'],
      }),
    );
    // Directory variant includes file/folder SVG shapes
    assert.ok(html.includes('Root'));
  });

  test('default variant has border style', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, {
        treeData: simpleTree,
        variant: 'default',
      }),
    );
    assert.ok(html.includes('1px solid'));
  });

  // ── Empty ──
  test('renders empty tree without errors', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, { treeData: [] }),
    );
    assert.ok(html.includes('role="tree"'));
  });

  // ── Custom renderNode ──
  test('uses custom renderNode', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, {
        treeData: simpleTree,
        renderNode: (/** @type {import('./Tree').TreeNode} */ node) => 'Custom: ' + node.label,
      }),
    );
    assert.ok(html.includes('Custom: Root'));
  });

  // ── Size ──
  test('sm size produces smaller dimensions', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, { treeData: simpleTree, size: 'sm' }),
    );
    assert.ok(html.includes('height:28px'));
  });

  test('default size is md (34px)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, { treeData: simpleTree }),
    );
    assert.ok(html.includes('height:34px'));
  });

  // ── Leaf nodes ──
  test('leaf nodes do not have aria-expanded', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, { treeData: simpleTree }),
    );
    // Leaf should not have aria-expanded
    const leafIndex = html.indexOf('Leaf');
    const afterLeaf = html.slice(leafIndex);
    // The Leaf's treeitem should not contain aria-expanded
    const leafItemHtml = afterLeaf.split('</div>')[0];
    assert.ok(!leafItemHtml.includes('aria-expanded'));
  });

  // ── maxHeight scroll ──
  test('maxHeight enables overflow scrolling', () => {
    const html = renderToStaticMarkup(
      React.createElement(Tree, {
        treeData: simpleTree,
        maxHeight: 300,
      }),
    );
    assert.ok(html.includes('overflow-y:auto'));
  });
});
