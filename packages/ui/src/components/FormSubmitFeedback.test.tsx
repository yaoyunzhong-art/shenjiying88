import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { FormSubmitFeedback } = require('./FormSubmitFeedback');

// ---- FormSubmitFeedback 组件测试 ----

test('FormSubmitFeedback: returns null when no state, no props', () => {
  const result = FormSubmitFeedback({});
  assert.equal(result, null);
});

test('FormSubmitFeedback: renders submitting spinner', () => {
  const result = FormSubmitFeedback({ submitting: true });
  assert.ok(result !== null);
  const props = result as any;
  assert.equal(props.type, 'div');
  assert.equal(props.props.style.background, 'rgba(59,130,246,0.10)');
  const children = props.props.children;
  const textChild = children.find((c: any) => typeof c === 'string');
  assert.ok(textChild.includes('Submitting'));
});

test('FormSubmitFeedback: resolves submitting from state', () => {
  const result = FormSubmitFeedback({
    state: { isSubmitting: true },
  });
  assert.ok(result !== null);
});

test('FormSubmitFeedback: renders success message', () => {
  const result = FormSubmitFeedback({ success: '保存成功' });
  assert.ok(result !== null);
  const frag = result as any;
  const successChild = frag.props.children[0];
  assert.ok(successChild.props.style.background.includes('rgba(34,197,94'));
  const span = successChild.props.children.find(
    (c: any) => typeof c === 'object' && c.type === 'span',
  );
  assert.ok(span.props.children.includes('保存成功'));
  // No dismiss button without onDismissSuccess
  const dismissBtn = successChild.props.children.find(
    (c: any) => typeof c === 'object' && c.type === 'button',
  );
  assert.equal(dismissBtn, undefined);
});

test('FormSubmitFeedback: success with dismiss button', () => {
  let dismissed = false;
  const result = FormSubmitFeedback({
    success: '操作完成',
    onDismissSuccess: () => {
      dismissed = true;
    },
  });
  assert.ok(result !== null);
  const frag = result as any;
  const successChild = frag.props.children[0];
  const dismissBtn = successChild.props.children.find(
    (c: any) => typeof c === 'object' && c.type === 'button',
  );
  assert.ok(dismissBtn);
  dismissBtn.props.onClick();
  assert.equal(dismissed, true);
});

test('FormSubmitFeedback: renders error message', () => {
  const result = FormSubmitFeedback({ error: '服务器错误' });
  assert.ok(result !== null);
  const frag = result as any;
  const errorChild = frag.props.children[1];
  assert.ok(errorChild.props.style.background.includes('rgba(239,68,68'));
  const span = errorChild.props.children.find(
    (c: any) => typeof c === 'object' && c.type === 'span',
  );
  assert.ok(span.props.children.includes('服务器错误'));
});

test('FormSubmitFeedback: error with retry button', () => {
  let retried = false;
  const result = FormSubmitFeedback({
    error: '网络超时',
    onRetry: () => {
      retried = true;
    },
  });
  assert.ok(result !== null);
  const frag = result as any;
  const errorChild = frag.props.children[1];
  const buttonsContainer = errorChild.props.children.find(
    (c: any) =>
      typeof c === 'object' &&
      c.type === 'div' &&
      c.props.style?.display === 'flex',
  );
  assert.ok(buttonsContainer);
  const retryBtn = buttonsContainer.props.children.find(
    (c: any) =>
      typeof c === 'object' &&
      c.type === 'button' &&
      c.props.children === '重试',
  );
  assert.ok(retryBtn);
  retryBtn.props.onClick();
  assert.equal(retried, true);
});

test('FormSubmitFeedback: error with dismiss button', () => {
  let dismissed = false;
  const result = FormSubmitFeedback({
    error: '请求失败',
    onDismissError: () => {
      dismissed = true;
    },
  });
  assert.ok(result !== null);
  const frag = result as any;
  // Fragment children: [undefined (no success), error div]
  const errorChild = frag.props.children[1];
  assert.equal(errorChild.type, 'div');
  // errorChild children: [span (message), div (buttons)]
  const buttonsDiv = errorChild.props.children[1];
  assert.equal(buttonsDiv.type, 'div');
  assert.equal(buttonsDiv.props.style.display, 'flex');
  // buttonsDiv children: [null (no retry), button(×)]
  const dismissBtn = buttonsDiv.props.children[1];
  assert.equal(dismissBtn.type, 'button');
  assert.equal(dismissBtn.props.children, '×');
  dismissBtn.props.onClick();
  assert.equal(dismissed, true);
});

test('FormSubmitFeedback: both success and error rendered together', () => {
  const result = FormSubmitFeedback({
    success: '部分成功',
    error: '部分失败',
  });
  assert.ok(result !== null);
  const frag = result as any;
  assert.ok(
    frag.props.children[0].props.style.background.includes('rgba(34,197,94'),
  );
  assert.ok(
    frag.props.children[1].props.style.background.includes('rgba(239,68,68'),
  );
});

test('FormSubmitFeedback: resolves success/error from state object', () => {
  const result = FormSubmitFeedback({
    state: {
      isSubmitting: false,
      successMessage: '状态成功',
      errorMessage: '状态错误',
    },
  });
  assert.ok(result !== null);
  const frag = result as any;
  assert.ok(frag.props.children.length >= 2);
});

test('FormSubmitFeedback: custom renderSuccess overrides default', () => {
  const result = FormSubmitFeedback({
    success: '自定义成功',
    renderSuccess: (msg: string) =>
      React.createElement('div', { 'data-testid': 'custom-success' }, `⭐ ${msg}`),
  });
  assert.ok(result !== null);
  const frag = result as any;
  const customChild = frag.props.children[0];
  assert.equal(customChild.props['data-testid'], 'custom-success');
  assert.equal(customChild.props.children, '⭐ 自定义成功');
});

test('FormSubmitFeedback: custom renderError overrides default', () => {
  const result = FormSubmitFeedback({
    error: '自定义错误',
    renderError: (msg: string) =>
      React.createElement('div', { 'data-testid': 'custom-error' }, `🔥 ${msg}`),
  });
  assert.ok(result !== null);
  const frag = result as any;
  const customChild = frag.props.children[1];
  assert.equal(customChild.props['data-testid'], 'custom-error');
  assert.equal(customChild.props.children, '🔥 自定义错误');
});

test('FormSubmitFeedback: submitting takes priority over success/error', () => {
  const result = FormSubmitFeedback({
    submitting: true,
    success: '不应出现',
    error: '不应出现',
  });
  assert.ok(result !== null);
  const props = result as any;
  assert.equal(props.type, 'div');
  const children = props.props.children;
  const textChild = children.find((c: any) => typeof c === 'string');
  assert.ok(textChild.includes('Submitting'));
});

test('FormSubmitFeedback: no retry button when onRetry not provided', () => {
  const result = FormSubmitFeedback({ error: '无重试' });
  assert.ok(result !== null);
  const frag = result as any;
  const errorChild = frag.props.children[1];
  assert.equal(errorChild.type, 'div');
  // When no onDismissError, there are only 2 children (span, and buttons div)
  // But buttons div has only null children
  const buttonsDiv = errorChild.props.children[1];
  // buttonsDiv children: [null (no retry), null (no dismiss)] — both unconditionally null
  // when both callbacks are missing
  const retrySlot = buttonsDiv.props.children[0];
  assert.equal(retrySlot, null);
});

test('FormSubmitFeedback: useFormSubmit is exported', () => {
  const { useFormSubmit } = require('./FormSubmitFeedback');
  assert.equal(typeof useFormSubmit, 'function');
});
