import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT +
    '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { BranchSelector, findNodeById, collectLeafIds } = require('./BranchSelector');

const mockNodes = [
  {
    id: 'region-east',
    label: '华东区',
    type: 'region',
    children: [
      {
        id: 'brand-sh',
        label: '上海品牌',
        type: 'brand',
        children: [
          { id: 'store-pudong', label: '浦东店', type: 'store' },
          { id: 'store-jingan', label: '静安店', type: 'store' },
        ],
      },
    ],
  },
  {
    id: 'region-west',
    label: '华西区',
    type: 'region',
    children: [
      {
        id: 'brand-cd',
        label: '成都品牌',
        type: 'brand',
        children: [{ id: 'store-wuhou', label: '武侯店', type: 'store' }],
      },
    ],
  },
  { id: 'store-direct', label: '独立门店', type: 'store' },
];

describe('BranchSelector', () => {
  test('renders all root nodes', () => {
    const html = renderToStaticMarkup(
      React.createElement(BranchSelector, { nodes: mockNodes }),
    );
    assert.ok(html.includes('华东区'));
    assert.ok(html.includes('华西区'));
    assert.ok(html.includes('独立门店'));
  });

  test('shows empty state when no nodes', () => {
    const html = renderToStaticMarkup(
      React.createElement(BranchSelector, { nodes: [], emptyLabel: '暂无架构' }),
    );
    assert.ok(html.includes('暂无架构'));
  });

  test('has aria-tree role', () => {
    const html = renderToStaticMarkup(
      React.createElement(BranchSelector, { nodes: mockNodes }),
    );
    assert.ok(html.includes('role="tree"'));
  });

  test('has aria-label for accessibility', () => {
    const html = renderToStaticMarkup(
      React.createElement(BranchSelector, { nodes: mockNodes }),
    );
    assert.ok(html.includes('aria-label'));
  });

  test('marks selected node with aria-selected', () => {
    const html = renderToStaticMarkup(
      React.createElement(BranchSelector, { nodes: mockNodes, value: 'store-direct' }),
    );
    assert.ok(html.includes('aria-selected'));
  });

  test('has aria-disabled on the button for disabled node', () => {
    const disabledNodes = [
      { id: 'store-closed', label: '已关店', type: 'store', disabled: true },
    ];
    const html = renderToStaticMarkup(
      React.createElement(BranchSelector, { nodes: disabledNodes }),
    );
    assert.ok(html.includes('aria-disabled="true"'));
  });

  test('renders type icons', () => {
    const html = renderToStaticMarkup(
      React.createElement(BranchSelector, { nodes: mockNodes }),
    );
    assert.ok(html.includes('🏢') || html.includes('🏬') || html.includes('🏪'));
  });

  test('includes branch-node-row class', () => {
    const html = renderToStaticMarkup(
      React.createElement(BranchSelector, { nodes: mockNodes }),
    );
    assert.ok(html.includes('branch-node-row'));
  });
});

describe('findNodeById', () => {
  test('finds a nested node', () => {
    const node = findNodeById(mockNodes, 'store-pudong');
    assert.notEqual(node, null);
    assert.equal(node.id, 'store-pudong');
    assert.equal(node.label, '浦东店');
  });

  test('returns null when not found', () => {
    assert.equal(findNodeById(mockNodes, 'nonexistent'), null);
  });

  test('finds root node', () => {
    const node = findNodeById(mockNodes, 'store-direct');
    assert.notEqual(node, null);
    assert.equal(node.id, 'store-direct');
  });
});

describe('collectLeafIds', () => {
  test('collects all leaf ids', () => {
    const ids = collectLeafIds(mockNodes);
    assert.ok(ids.includes('store-pudong'));
    assert.ok(ids.includes('store-jingan'));
    assert.ok(ids.includes('store-wuhou'));
    assert.ok(ids.includes('store-direct'));
    assert.equal(ids.includes('region-east'), false);
  });

  test('returns empty for empty input', () => {
    assert.deepEqual(collectLeafIds([]), []);
  });
});
