import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ActionPanel } = require('./ActionPanel');

describe('ActionPanel', () => {
  test('renders title and subtitle', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, { title: '订单管理', subtitle: '查看订单' },
        React.createElement('div', null, 'content'),
      ),
    );
    assert.match(html, /订单管理/);
    assert.match(html, /查看订单/);
    assert.match(html, /data-testid="action-panel-订单管理"/);
  });

  test('renders action buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        title: '操作',
        actions: [
          { key: 'edit', label: '编辑', primary: true, onClick: () => {} },
          { key: 'delete', label: '删除', danger: true },
          { key: 'view', label: '查看' },
        ],
      },
        React.createElement('div', null, 'body'),
      ),
    );
    assert.match(html, /编辑/);
    assert.match(html, /删除/);
    assert.match(html, /查看/);
    assert.match(html, /data-testid="action-panel-btn-edit"/);
    assert.match(html, /data-testid="action-panel-btn-delete"/);
    assert.match(html, /data-testid="action-panel-btn-view"/);
    // primary button should have blue bg
    assert.match(html, /background-color:#3b82f6/);
    // danger button should have red bg
    assert.match(html, /background-color:#ef4444/);
  });

  test('disabled action button', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        title: '测试',
        actions: [
          { key: 'save', label: '保存', disabled: true },
        ],
      },
        React.createElement('div', null, 'body'),
      ),
    );
    assert.match(html, /cursor:not-allowed/);
    assert.match(html, /disabled/);
  });

  test('collapsed state hides body', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        title: '折叠面板',
        collapsed: true,
      },
        React.createElement('div', null, '应该被隐藏的内容'),
      ),
    );
    assert.doesNotMatch(html, /应该被隐藏的内容/);
  });

  test('not collapsed shows body', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        title: '展开面板',
        collapsed: false,
      },
        React.createElement('div', null, '可见内容'),
      ),
    );
    assert.match(html, /可见内容/);
  });

  test('loading state shows loading text', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        title: '加载面板',
        loading: true,
      },
        React.createElement('div', null, '隐藏内容'),
      ),
    );
    assert.match(html, /加载中/);
  });

  test('empty children with emptyContent shows empty state', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        title: '空面板',
        emptyContent: React.createElement('span', null, '暂无数据'),
      }),
    );
    assert.match(html, /暂无数据/);
  });

  test('collapse toggle button renders when onToggleCollapse provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        title: '可折叠',
        onToggleCollapse: () => {},
      },
        React.createElement('div', null, '内容'),
      ),
    );
    assert.match(html, /aria-label="折叠"/);
  });

  test('expanded collapse shows down arrow', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        title: '展开',
        collapsed: false,
        onToggleCollapse: () => {},
      },
        React.createElement('div', null, '内容'),
      ),
    );
    assert.match(html, /aria-label="折叠"/);
    assert.match(html, /▶|▼/);
  });

  test('headerExtra renders additional content in header', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        title: '标题',
        headerExtra: React.createElement('span', { 'data-testid': 'extra' }, '额外'),
      },
        React.createElement('div', null, '内容'),
      ),
    );
    assert.match(html, /额外/);
  });

  test('loading action button shows loading indicator', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        title: '加载按钮',
        actions: [
          { key: 'submit', label: '提交', loading: true },
        ],
      },
        React.createElement('div', null, '内容'),
      ),
    );
    assert.match(html, /⏳/);
  });
});
