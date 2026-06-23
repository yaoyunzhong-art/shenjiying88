const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const React = require('react');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { PasswordInput } = require('./PasswordInput');

describe('PasswordInput', () => {
  // ---- 基础渲染 ----
  test('renders a password input by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, { placeholder: '输入密码' })
    );
    assert.match(html, /type="password"/);
    assert.match(html, /placeholder="输入密码"/);
  });

  test('renders with label via Input props', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, { label: '登录密码', placeholder: '请输入' })
    );
    assert.match(html, /登录密码/);
    assert.match(html, /type="password"/);
  });

  // ---- 显示隐藏切换按钮 ----
  test('renders toggle button', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, { placeholder: '密码' })
    );
    // 应该有一个 button 元素
    assert.match(html, /<button/);
    // 默认 aria-label 为"显示密码"（密码当前隐藏中）
    assert.match(html, /aria-label="显示密码"/);
  });

  // ---- defaultVisible 属性 ----
  test('renders as text when defaultVisible is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, { defaultVisible: true, placeholder: '密码' })
    );
    assert.match(html, /type="text"/);
    // 密码可见时 aria-label 为"隐藏密码"
    assert.match(html, /aria-label="隐藏密码"/);
  });

  // ---- 自定义 toggleLabel ----
  test('uses custom toggleLabel', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, {
        placeholder: '密码',
        toggleLabel: 'Toggle visibility',
      })
    );
    assert.match(html, /aria-label="Toggle visibility"/);
  });

  // ---- inputProps 透传 ----
  test('passes through disabled prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, { placeholder: '密码', disabled: true })
    );
    assert.match(html, /disabled/);
  });

  test('passes through value prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, { placeholder: '密码', value: 'secret123' })
    );
    assert.match(html, /value="secret123"/);
  });

  test('passes through name prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, { placeholder: '密码', name: 'password' })
    );
    assert.match(html, /name="password"/);
  });

  test('passes through required prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, { placeholder: '密码', required: true })
    );
    assert.match(html, /required/);
  });

  // ---- SVG 图标 ----
  test('renders SVG eye icon', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, { placeholder: '密码' })
    );
    // 密码隐藏时渲染 eye 图标（含 circle 表示眼球）
    assert.match(html, /<svg/);
    assert.match(html, /circle/);
  });

  test('renders eye-off SVG when visible', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, { defaultVisible: true, placeholder: '密码' })
    );
    // 密码可见时渲染 eye-off 图标（含 line 表示斜线）
    assert.match(html, /<svg/);
    assert.match(html, /<line/);
  });

  // ---- 综合 ----
  test('renders with multiple Input props combined', () => {
    const html = renderToStaticMarkup(
      React.createElement(PasswordInput, {
        label: '新密码',
        placeholder: '至少8位',
        name: 'newPassword',
        required: true,
        disabled: false,
      })
    );
    assert.match(html, /新密码/);
    assert.match(html, /placeholder="至少8位"/);
    assert.match(html, /name="newPassword"/);
    assert.match(html, /required/);
    assert.match(html, /type="password"/);
  });
});
