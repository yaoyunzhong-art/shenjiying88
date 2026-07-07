import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Collapse } = require('./Collapse');

describe('Collapse', () => {
  test('renders title text', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '基本信息' }, '内容区域')
    );
    assert.match(html, /基本信息/);
  });

  test('renders children content', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '详情' }, '可折叠的内容')
    );
    assert.match(html, /可折叠的内容/);
  });

  test('defaultOpen renders content initially expanded', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '详情', defaultOpen: true }, '展开的内容')
    );
    // Should be rendered in the DOM
    assert.match(html, /展开的内容/);
  });

  test('defaultOpen false hides content via max-height: 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '详情', defaultOpen: false }, '隐藏的内容')
    );
    // Content still in SSR DOM but max-height: 0 on wrapper
    assert.match(html, /隐藏的内容/);
    assert.match(html, /max-height:0/);
  });

  test('custom variant applies correct class', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '标题', variant: 'bordered' }, '内容')
    );
    assert.match(html, /rounded-lg/);
  });

  test('custom size applies correct class', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '标题', size: 'sm' }, '内容')
    );
    assert.match(html, /text-xs/);
  });

  test('subtitle is rendered', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '订单', subtitle: '共3条' }, '内容')
    );
    assert.match(html, /共3条/);
  });

  test('disabled attribute prevents interaction', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '系统日志', disabled: true }, '内容')
    );
    assert.match(html, /disabled/);
    assert.match(html, /cursor-not-allowed/);
  });

  test('controlled open false hides content with max-height: 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '受控面板', open: false }, '受控内容')
    );
    assert.match(html, /max-height:0/);
  });

  test('controlled open true renders content expanded', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '受控面板', open: true }, '受控内容展示')
    );
    assert.match(html, /受控内容展示/);
  });

  test('aria-expanded attribute present', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '无障碍', defaultOpen: true }, '内容')
    );
    assert.match(html, /aria-expanded/);
  });

  test('empty children renders ok', () => {
    const html = renderToStaticMarkup(
      React.createElement(Collapse, { title: '空内容' })
    );
    assert.match(html, /空内容/);
  });
});
