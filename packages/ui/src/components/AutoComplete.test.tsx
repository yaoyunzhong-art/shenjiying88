/**
 * AutoComplete 自动补全组件测试
 *
 * 使用 node:test runner (node --test), 统一 node:test / node:assert 语法.
 * 使用 renderToStaticMarkup 避免 jsdom 依赖.
 *
 * 注意: SSR 渲染时 isOpen 为 false, 下拉面板不出现.
 * 测试聚焦于静态渲染的结构而不是交互状态.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT +
    '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);

import { AutoComplete, type AutoCompleteOption } from './AutoComplete';

// ============ Mock Data ============

const fruitOptions: AutoCompleteOption<string>[] = [
  { value: 'apple', label: '苹果', subtitle: 'Apple' },
  { value: 'banana', label: '香蕉', subtitle: 'Banana' },
  { value: 'orange', label: '橙子', subtitle: 'Orange' },
  { value: 'grape', label: '葡萄', subtitle: 'Grape' },
  { value: 'watermelon', label: '西瓜', subtitle: 'Watermelon' },
  { value: 'strawberry', label: '草莓', subtitle: 'Strawberry' },
];

const defaultProps = {
  options: fruitOptions,
  placeholder: '搜索水果',
};

const staticRender = (overrides: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    React.createElement(AutoComplete, { ...defaultProps, ...overrides }),
  );

// ============ Tests ============

test('AutoComplete: component is a function', () => {
  assert.equal(typeof AutoComplete, 'function');
});

test('AutoComplete: renders input with placeholder', () => {
  const html = staticRender();
  assert.ok(html.includes('搜索水果'), '应渲染占位文字');
});

test('AutoComplete: renders with data-testid on root', () => {
  const html = staticRender();
  assert.ok(html.includes('data-testid="auto-complete"'));
});

test('AutoComplete: renders custom data-testid', () => {
  const html = staticRender({ 'data-testid': 'my-ac' });
  assert.ok(html.includes('data-testid="my-ac"'));
});

test('AutoComplete: renders search icon by default', () => {
  const html = staticRender();
  assert.ok(html.includes('data-testid="auto-complete-search-icon"'), '默认显示搜索图标');
});

test('AutoComplete: hides search icon when showSearchIcon=false', () => {
  const html = staticRender({ showSearchIcon: false });
  assert.ok(!html.includes('data-testid="auto-complete-search-icon"'), '隐藏搜索图标');
});

test('AutoComplete: renders disabled state', () => {
  const html = staticRender({ disabled: true });
  assert.ok(html.includes('disabled'), '禁用状态下 input 应有 disabled 属性');
});

test('AutoComplete: rendered input element type is text', () => {
  const html = staticRender();
  assert.ok(html.includes('type="text"'), '输入框类型为 text');
});

test('AutoComplete: renders with custom width', () => {
  const html = staticRender({ width: 320 });
  // SSR: style should include width:320 somewhere
  const hasWidth = html.includes('width:320') || html.includes('width:320px');
  assert.ok(hasWidth, '自定义宽度应渲染');
});

test('AutoComplete: renders with custom className', () => {
  const html = staticRender({ className: 'my-custom-ac' });
  assert.ok(html.includes('my-custom-ac'), '自定义类名应渲染');
});

test('AutoComplete: disabled input has not-allowed cursor', () => {
  const html = staticRender({ disabled: true });
  assert.ok(html.includes('not-allowed'), '禁用时 cursor 应为 not-allowed');
});

test('AutoComplete: handles single option', () => {
  const singleOpt: AutoCompleteOption<string>[] = [
    { value: 'only', label: '唯一选项' },
  ];
  const html = staticRender({ options: singleOpt });
  assert.ok(html.includes('m5-auto-complete'), '单选项不崩溃');
});

test('AutoComplete: handles empty array options', () => {
  const html = staticRender({ options: [] });
  assert.ok(html.length > 0, '空数组不崩溃');
});

test('AutoComplete: default placeholder text', () => {
  const html = staticRender({ placeholder: undefined });
  assert.ok(html.includes('请输入搜索关键词'), '默认占位文字应渲染');
});

test('AutoComplete: input ref exists as text input', () => {
  const html = staticRender();
  assert.ok(html.includes('<input'), '应渲染 input 元素');
  assert.ok(html.includes('type="text"'), 'input 类型为 text');
});

test('AutoComplete: root div has correct class', () => {
  const html = staticRender();
  assert.ok(html.includes('class="m5-auto-complete'), '根元素应有 class');
});

test('AutoComplete: input has correct data-testid', () => {
  const html = staticRender();
  assert.ok(html.includes('data-testid="auto-complete-input"'), 'input 应有 data-testid');
});

test('AutoComplete: renders without crash with icon options', () => {
  const iconOpts: AutoCompleteOption<string>[] = [
    { value: 'a', label: '选项 A', icon: React.createElement('span', null, '★') },
  ];
  const html = staticRender({ options: iconOpts });
  assert.ok(html.includes('m5-auto-complete'), '图标选项不应崩溃');
});

test('AutoComplete: renders loading prop without crash', () => {
  const html = staticRender({ loading: true });
  assert.ok(html.includes('m5-auto-complete'), 'loading 状态不应崩溃');
});

test('AutoComplete: renders with disabled=true and value', () => {
  const html = staticRender({ disabled: true });
  const disabledCount = (html.match(/disabled/g) || []).length;
  assert.ok(disabledCount >= 1, 'disabled 属性应在 HTML 中出现');
});

test('AutoComplete: renders with subtitle options', () => {
  const subOptions: AutoCompleteOption<string>[] = [
    { value: 'x', label: '选项 X', subtitle: 'Subtitle X' },
    { value: 'y', label: '选项 Y', subtitle: 'Subtitle Y' },
  ];
  const html = staticRender({ options: subOptions });
  assert.ok(html.includes('m5-auto-complete'), '副标题选项不应崩溃');
});

test('AutoComplete: input has placeholder attribute', () => {
  const html = staticRender({ placeholder: 'Type to search' });
  assert.ok(html.includes('placeholder="Type to search"'), 'placeholder 属性应渲染');
});

test('AutoComplete: renders with clearable=true and no crash', () => {
  const html = staticRender({ clearable: true });
  assert.ok(html.includes('m5-auto-complete'), 'clearable 不应崩溃');
});
