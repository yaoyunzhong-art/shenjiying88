import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { QRCodeDisplay } = require('./QRCodeDisplay');

// ---------------------------------------------------------------------------
// 测试工厂
// ---------------------------------------------------------------------------

describe('QRCodeDisplay', () => {
  // ---- 渲染基础 ----
  test('renders with default props', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'https://example.com/qr' })
    );
    assert.match(html, /data-testid="qr-code-display"/);
  });

  test('renders with custom title', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', title: '会员二维码' })
    );
    assert.match(html, /会员二维码/);
  });

  // ---- Type badge ----
  test('shows membership type badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', type: 'membership' })
    );
    assert.match(html, /会员码/);
  });

  test('shows payment type badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', type: 'payment' })
    );
    assert.match(html, /付款码/);
  });

  test('shows miniapp type badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', type: 'miniapp' })
    );
    assert.match(html, /小程序码/);
  });

  test('shows coupon type badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', type: 'coupon' })
    );
    assert.match(html, /优惠券码/);
  });

  test('shows generic type badge by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x' })
    );
    assert.match(html, /通用二维码/);
  });

  // ---- 标签 ----
  test('shows label when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', label: '扫此码加入会员' })
    );
    assert.match(html, /扫此码加入会员/);
  });

  test('shows value fingerprint', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'test-value-123' })
    );
    assert.match(html, /test-value-123/);
  });

  // ---- 复制按钮 ----
  test('renders copy button', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x' })
    );
    assert.match(html, /复制/);
  });

  // ---- 刷新按钮 ----
  test('renders refresh button when onRefresh provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', onRefresh: () => {} })
    );
    assert.match(html, /刷新/);
  });

  test('does NOT render refresh button when onRefresh omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x' })
    );
    assert.doesNotMatch(html, /<button[^>]*>刷新/);
  });

  // ---- 过期状态 ----
  test('shows expired overlay when expired is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', expired: true })
    );
    assert.match(html, /已过期/);
    assert.match(html, /请刷新二维码/);
  });

  test('does not show expired overlay when expired is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', expired: false })
    );
    assert.doesNotMatch(html, /已过期/);
  });

  // ---- 自定义图片地址 ----
  test('uses custom src for the image', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', src: 'https://example.com/qr.svg' })
    );
    assert.match(html, /https:\/\/example.com\/qr.svg/);
  });

  // ---- 自定义尺寸 ----
  test('renders image with specified size', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', size: 200 })
    );
    assert.match(html, /width="200"/);
    assert.match(html, /height="200"/);
  });

  test('clamps size to minimum 80', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', size: 40 })
    );
    // Should render with width >= 80
    const match = html.match(/width="(\d+)"/);
    assert.ok(match);
    assert.ok(Number(match[1]) >= 80);
  });

  // ---- data-testid 覆盖 ----
  test('uses custom data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', 'data-testid': 'my-qr' })
    );
    assert.match(html, /data-testid="my-qr"/);
  });

  // ---- 长文本截断 ----
  test('truncates very long value display', () => {
    const longValue = 'a'.repeat(100);
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: longValue })
    );
    // The display value should have ellipsis or be shorter than full 100 chars
    assert.ok(html.includes('…'), 'should contain ellipsis for long values');
  });

  // ---- 边界情况 ----
  test('renders with empty value', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: '' })
    );
    assert.match(html, /data-testid="qr-code-display"/);
  });

  // ---- 无障碍 ----
  test('image has alt text matching type label', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'x', type: 'membership' })
    );
    assert.match(html, /alt="会员码"/);
  });

  // ---- SVG data-uri 占位 ----
  test('renders SVG placeholder when no src provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QRCodeDisplay, { value: 'hello', size: 120 })
    );
    assert.match(html, /data:image\/svg\+xml/);
    assert.match(html, /%3Csvg/);
  });
});
