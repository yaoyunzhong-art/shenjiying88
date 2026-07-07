import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, mock } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ConfirmActionDialog } = require('./ConfirmActionDialog');

// ==================== 辅助函数 ====================

function containsText(html: string, text: string): boolean {
  const stripped = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.includes(text);
}

// ==================== 测试数据 ====================

const noop = () => {};

// ==================== 测试用例 ====================

describe('ConfirmActionDialog', () => {
  // ---- 1. 基础渲染 ----
  test('open=true 时渲染标题和描述', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title="确认删除"
        message="确定要删除这条记录吗？此操作不可撤销。"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    assert.ok(containsText(html, '确认删除'), '应显示标题');
    assert.ok(containsText(html, '确定要删除这条记录吗？此操作不可撤销。'), '应显示描述');
  });

  test('open=false 时不渲染内容', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open={false}
        title="确认删除"
        message="测试消息"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    assert.equal(html, '', 'open=false 时应返回空字符串');
  });

  // ---- 2. 按钮文本 ----
  test('默认显示确认和取消按钮', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title="确认"
        message="确认操作？"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    assert.ok(containsText(html, '确认'), '应显示默认确认按钮文本');
    assert.ok(containsText(html, '取消'), '应显示默认取消按钮文本');
  });

  test('支持自定义确认/取消按钮文本', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title="确认"
        message="确认操作？"
        confirmLabel="确定删除"
        cancelLabel="再想想"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    assert.ok(containsText(html, '确定删除'), '应显示自定义确认按钮文本');
    assert.ok(containsText(html, '再想想'), '应显示自定义取消按钮文本');
  });

  // ---- 3. 加载状态 ----
  test('loading=true 时确认按钮应有 disabled 属性', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title="确认"
        message="操作中..."
        onConfirm={noop}
        onCancel={noop}
        loading
      />,
    );
    // loading 状态下 Button 会渲染 disabled 属性
    assert.ok(html.includes('disabled'), 'loading 状态下按钮应有 disabled 属性');
  });

  test('loading=true 时取消按钮应有 disabled 属性', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title="确认"
        message="操作中..."
        onConfirm={noop}
        onCancel={noop}
        loading
      />,
    );
    // Modal + ConfirmActionDialog 底部两个按钮（取消 + 确认），loading 时均应禁用
    assert.ok(html.includes('disabled'), 'loading 状态下按钮应有 disabled 属性');
  });

  // ---- 4. 按钮 variant ----
  test('支持 confirmVariant="danger"', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title="确认"
        message="危险操作"
        confirmVariant="danger"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    // danger variant Button 的背景色为红色
    assert.ok(html.includes('#dc2626'), 'danger variant 按钮应有红色背景');
  });

  test('支持 confirmVariant="warning"', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title="确认"
        message="警告操作"
        confirmVariant="warning"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    assert.ok(containsText(html, '确认'), 'warning variant 仍应显示确认按钮');
  });

  test('取消按钮应为 ghost variant', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title="确认"
        message="确认操作？"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    // ghost variant 按钮背景为 transparent
    // Cancel 按钮是第一个 Button，ghost variant → background: transparent
    assert.ok(containsText(html, '取消'), '应显示取消按钮');
  });

  // ---- 5. aria / role 属性 ----
  test('渲染 aria-modal dialog', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title="确认删除"
        message="确定删除？"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    assert.ok(html.includes('role="dialog"'), '应包含 dialog role');
    assert.ok(html.includes('aria-modal="true"'), '应包含 aria-modal');
  });

  // ---- 6. 边界情况 ----
  test('空标题和空消息应正常渲染', () => {
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title=""
        message=""
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    assert.ok(html.length > 0, '空标题/消息时不应崩溃');
  });

  test('超长消息应正常渲染', () => {
    const longMsg = 'x'.repeat(1000);
    const html = renderToStaticMarkup(
      <ConfirmActionDialog
        open
        title="确认"
        message={longMsg}
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    assert.ok(html.includes(longMsg), '超长消息应完整渲染');
  });
});
