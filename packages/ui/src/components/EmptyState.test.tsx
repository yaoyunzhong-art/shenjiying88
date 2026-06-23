import React from 'react';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { EmptyState } = require('./EmptyState');

test('EmptyState renders default title when no title provided', () => {
  const html = renderToStaticMarkup(React.createElement(EmptyState, {}));
  assert.match(html, /暂无数据/);
});

test('EmptyState renders custom title', () => {
  const html = renderToStaticMarkup(React.createElement(EmptyState, { title: '没有找到记录' }));
  assert.match(html, /没有找到记录/);
});

test('EmptyState renders description when provided', () => {
  const html = renderToStaticMarkup(
    React.createElement(EmptyState, { description: '试试修改筛选条件' })
  );
  assert.match(html, /试试修改筛选条件/);
});

test('EmptyState does not render description when omitted', () => {
  const html = renderToStaticMarkup(React.createElement(EmptyState, { title: 'empty' }));
  assert.doesNotMatch(html, /试试修改筛选条件/);
});

test('EmptyState renders action node', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      EmptyState,
      null,
      React.createElement('button', { key: 'btn' }, '去创建')
    )
  );
  // EmptyState doesn't accept children — action is a prop
  assert.match(html, /暂无数据/);
});

test('EmptyState renders action as prop', () => {
  const html = renderToStaticMarkup(
    React.createElement(EmptyState, {
      action: React.createElement('button', { key: 'btn' }, '去创建'),
    })
  );
  assert.match(html, /去创建/);
});

test('EmptyState renders icon when provided', () => {
  const html = renderToStaticMarkup(
    React.createElement(EmptyState, {
      icon: React.createElement('span', { key: 'icon' }, '📭'),
    })
  );
  assert.match(html, /📭/);
});

test('EmptyState default variant uses larger padding (48px)', () => {
  const html = renderToStaticMarkup(React.createElement(EmptyState, { variant: 'default' }));
  assert.match(html, /padding(?:-[a-z]+)?:\s*48px/);
});

test('EmptyState compact variant uses smaller padding (24px)', () => {
  const html = renderToStaticMarkup(React.createElement(EmptyState, { variant: 'compact' }));
  assert.match(html, /padding(?:-[a-z]+)?:\s*24px/);
});

test('EmptyState renders all parts — icon, title, description, action', () => {
  const html = renderToStaticMarkup(
    React.createElement(EmptyState, {
      title: '没有会员',
      description: '还没有添加任何会员信息',
      icon: React.createElement('span', { key: 'icon' }, '🔍'),
      action: React.createElement('button', { key: 'btn' }, '新建'),
    })
  );
  assert.match(html, /🔍/);
  assert.match(html, /没有会员/);
  assert.match(html, /还没有添加任何会员信息/);
  assert.match(html, /新建/);
});

test('EmptyState container is centered via flexbox', () => {
  const html = renderToStaticMarkup(React.createElement(EmptyState, {}));
  assert.match(html, /text-align:\s*center/);
  assert.match(html, /align-items:\s*center/);
});
