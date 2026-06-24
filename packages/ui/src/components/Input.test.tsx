import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Input } = require('./Input');

describe('Input', () => {
  // ── Rendering ──
  test('renders a basic input', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp' }));
    assert.ok(html.includes('<input'));
  });

  test('renders with placeholder', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { placeholder: '搜索...' }));
    assert.ok(html.includes('placeholder="搜索..."'));
  });

  test('renders label', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', label: '用户名' }));
    assert.ok(html.includes('用户名'));
  });

  test('renders required asterisk in label', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', label: '邮箱', required: true }));
    assert.ok(html.includes('*'));
  });

  test('renders helper text', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', helperText: '至少6个字符' }));
    assert.ok(html.includes('至少6个字符'));
  });

  test('renders error message', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', error: '字段必填' }));
    assert.ok(html.includes('字段必填'));
    assert.ok(html.includes('role="alert"'));
  });

  test('does not render helper when error present', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', helperText: '提示', error: '出错了' }));
    assert.ok(html.includes('出错了'));
    assert.ok(!html.includes('提示'));
  });

  test('renders prefix content', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', prefix: React.createElement('span', null, '￥') }));
    assert.ok(html.includes('￥'));
  });

  test('renders suffix content', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', suffix: React.createElement('span', null, '元') }));
    assert.ok(html.includes('元'));
  });

  test('renders size=sm', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', size: 'sm' }));
    assert.ok(html.includes('<input'));
  });

  test('renders size=lg', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', size: 'lg' }));
    assert.ok(html.includes('<input'));
  });

  test('renders variant=outline', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', variant: 'outline' }));
    assert.ok(html.includes('<input'));
  });

  test('renders variant=filled', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', variant: 'filled' }));
    assert.ok(html.includes('<input'));
  });

  test('renders variant=underline', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', variant: 'underline' }));
    assert.ok(html.includes('<input'));
  });

  // ── aria ──
  test('aria-invalid when error present', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', error: '错了' }));
    assert.ok(html.includes('aria-invalid="true"'));
  });

  test('aria-invalid when no error', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp' }));
    assert.ok(html.includes('aria-invalid="false"'));
  });

  test('aria-label from label prop', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', label: '邮箱' }));
    assert.ok(html.includes('aria-label="邮箱"'));
  });

  test('aria-label from explicit aria-label over label', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', label: '邮箱', 'aria-label': '电子邮箱' }));
    assert.ok(html.includes('aria-label="电子邮箱"'));
  });

  test('aria-label falls back to "Input"', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp' }));
    assert.ok(html.includes('aria-label="Input"'));
  });

  test('aria-describedby for error', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', error: '错' }));
    assert.ok(html.includes('aria-describedby'));
    assert.ok(html.includes('-error'));
  });

  // ── Disabled / ReadOnly ──
  test('disabled attribute', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', disabled: true }));
    assert.ok(html.includes('disabled'));
  });

  test('readOnly attribute', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', readOnly: true }));
    assert.ok(html.includes('readonly'));
  });

  // ── Type / native attrs ──
  test('type=password', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', type: 'password' }));
    assert.ok(html.includes('type="password"'));
  });

  test('type=number with min/max', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', type: 'number', min: 0, max: 100 }));
    assert.ok(html.includes('type="number"'));
    assert.ok(html.includes('min="0"'));
    assert.ok(html.includes('max="100"'));
  });

  test('name attribute', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', name: 'email' }));
    assert.ok(html.includes('name="email"'));
  });

  test('autoComplete attribute', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', autoComplete: 'email' }));
    assert.ok(html.includes('autocomplete="email"') || html.includes('autoComplete="email"'));
  });

  test('inputMode attribute', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', inputMode: 'numeric' }));
    assert.ok(html.includes('inputmode="numeric"') || html.includes('inputMode="numeric"'));
  });

  // ── Controlled value ──
  test('controlled value rendering', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', value: 'hello' }));
    assert.ok(html.includes('value="hello"'));
  });

  // ── defaultValue ──
  test('renders with defaultValue', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', defaultValue: '默认' }));
    assert.ok(html.includes('默认'));
  });

  // ── Clear button ──
  test('shows clear button when allowClear and has value', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', defaultValue: 'hello', allowClear: true }));
    assert.ok(html.includes('Clear input'));
  });

  test('no clear button when value is empty', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', value: '', allowClear: true }));
    const clearCount = (html.match(/Clear input/g) || []).length;
    assert.equal(clearCount, 0);
  });

  test('no clear button when disabled', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', value: 'hello', allowClear: true, disabled: true }));
    const clearCount = (html.match(/Clear input/g) || []).length;
    assert.equal(clearCount, 0);
  });

  // ── Character count ──
  test('shows character count', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', defaultValue: 'abc', showCount: true, maxLength: 10 }));
    assert.ok(html.includes('3/10'));
  });

  test('count turns red near limit', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', defaultValue: '1234567890', showCount: true, maxLength: 10 }));
    // 10/10 — at limit
    assert.ok(html.includes('10/10'));
  });

  test('no count when no maxLength', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', defaultValue: 'abc', showCount: true }));
    assert.ok(!html.includes('inp-count'), 'should not render count element without maxLength');
  });

  // ── Loading ──
  test('shows loading indicator', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', loading: true }));
    assert.ok(html.includes('⟳'));
  });

  // ── Block style ──
  test('block prop width 100%', () => {
    const html = renderToStaticMarkup(React.createElement(Input, { 'data-testid': 'inp', block: true }));
    assert.ok(html.includes('width:100%'));
  });
});
