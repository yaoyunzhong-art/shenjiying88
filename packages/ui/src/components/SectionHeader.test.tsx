import React from 'react';

const assert = require('node:assert/strict');
const { test, describe } = require('node:test');
const REACT_DOM_SERVER = (() => {
  try {
    return require('react-dom/server.node.js');
  } catch {
    return require(
      '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
    );
  }
})();
const { SectionHeader } = require('./SectionHeader');

function render(el: React.ReactElement) {
  return REACT_DOM_SERVER.renderToStaticMarkup(el);
}

describe('SectionHeader component', () => {
  test('renders title', () => {
    const html = render(React.createElement(SectionHeader, { title: '运营概览' }));
    assert.match(html, /运营概览/);
  });

  test('renders subtitle when provided', () => {
    const html = render(React.createElement(SectionHeader, { title: '运营概览', subtitle: '今日核心指标' }));
    assert.match(html, /今日核心指标/);
  });

  test('hides subtitle when not provided', () => {
    const html = render(React.createElement(SectionHeader, { title: '运营概览' }));
    assert.doesNotMatch(html, /今日核心指标/);
  });

  test('renders actions as buttons', () => {
    const actions = [
      { key: 'add', label: '新增', onClick: () => {} },
      { key: 'export', label: '导出', onClick: () => {} },
    ];
    const html = render(React.createElement(SectionHeader, { title: '会员列表', actions }));
    assert.match(html, /新增/);
    assert.match(html, /导出/);
    assert.match(html, /<button/);
  });

  test('renders primary variant action', () => {
    const actions = [
      { key: 'create', label: '创建', onClick: () => {}, variant: 'primary' as const },
    ];
    const html = render(React.createElement(SectionHeader, { title: '创建任务', actions }));
    assert.match(html, /创建/);
  });

  test('renders disabled action', () => {
    const actions = [
      { key: 'save', label: '保存', onClick: () => {}, disabled: true },
    ];
    const html = render(React.createElement(SectionHeader, { title: '保存', actions }));
    assert.match(html, /disabled/);
  });

  test('renders extra instead of actions', () => {
    const extra = React.createElement('span', { 'data-testid': 'custom-extra' }, '💡');
    const html = render(React.createElement(SectionHeader, { title: '提示', extra }));
    assert.match(html, /💡/);
  });

  test('without border when bordered=false', () => {
    const html = render(React.createElement(SectionHeader, { title: '无边框', bordered: false }));
    // border-bottom is set to 'none' - assert no visible border
    assert.match(html, /border-bottom:none/);
  });

  test('renders loading skeleton when loading=true', () => {
    const html = render(React.createElement(SectionHeader, { title: '加载中', loading: true }));
    assert.match(html, /shimmer/);
  });

  test('applies data-testid', () => {
    const html = render(React.createElement(SectionHeader, { title: '测试', 'data-testid': 'section-header-test' }));
    assert.match(html, /data-testid="section-header-test"/);
  });

  test('applies custom className', () => {
    const html = render(React.createElement(SectionHeader, { title: '类名', className: 'my-custom-class' }));
    assert.match(html, /class="my-custom-class"/);
  });

  test('applies custom style', () => {
    const html = render(React.createElement(SectionHeader, { title: '样式', style: { marginTop: 20 } }));
    assert.match(html, /margin-top:20/);
  });
});
