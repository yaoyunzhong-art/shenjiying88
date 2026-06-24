import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ErrorBoundary } = require('./ErrorBoundary');

// A component that throws on render — used to trigger the boundary
function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('模拟渲染异常');
  }
  return React.createElement('span', null, '正常内容');
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join(' ');
  }
  if (React.isValidElement(node)) {
    return extractText(node.props.children);
  }
  return '';
}

// Note: The following tests use renderToStaticMarkup which, when a component
// throws, will NOT render the ErrorBoundary fallback in SSR (React 18 SSR
// does not invoke getDerivedStateFromError client-only lifecycle).
//
// We instead test:
// 1. Component is exported and instantiable (no throw in normal render)
// 2. The state management logic (getDerivedStateFromError returns correct state)
// 3. No error state renders children normally
// 4. With error state, fallback render output is correct

describe('ErrorBoundary', () => {
  // ── Export & type validation ──
  test('is exported as a class constructor', () => {
    assert.equal(typeof ErrorBoundary, 'function');
    assert.ok(ErrorBoundary.prototype instanceof React.Component);
  });

  test('static getDerivedStateFromError returns error state', () => {
    const err = new Error('test-error');
    const state = ErrorBoundary.getDerivedStateFromError(err);
    assert.deepEqual(state, { error: err });
  });

  // ── Happy path (no error) ──
  test('renders children when no error', () => {
    // Manually construct with no error state
    const instance = new ErrorBoundary({ children: React.createElement('div', { key: 'x' }, 'hello') });
    // Force no error (default state)
    instance.state = { error: null };
    const result = instance.render();
    const text = extractText(result);
    assert.match(text, /hello/);
  });

  test('returns null when no children and no error', () => {
    const instance = new ErrorBoundary({});
    instance.state = { error: null };
    const result = instance.render();
    assert.equal(result, null);
  });

  // ── Block severity fallback ──
  test('renders block fallback when error state is set (default severity)', () => {
    const instance = new ErrorBoundary({
      'data-testid': 'eb',
    });
    instance.state = { error: new Error('数据加载失败') };
    const result = instance.render();
    if (!React.isValidElement(result)) {
      assert.fail('expected a React element');
    }
    const text = extractText(result);
    assert.match(text, /数据加载失败/);
    assert.match(text, /重试/);
  });

  test('block fallback includes description when provided', () => {
    const instance = new ErrorBoundary({
      description: '请检查网络连接后重试',
      'data-testid': 'eb',
    });
    instance.state = { error: new Error('网络异常') };
    const result = instance.render();
    const text = extractText(result);
    assert.match(text, /网络异常/);
    assert.match(text, /请检查网络连接后重试/);
  });

  test('block fallback uses default message when error has no message', () => {
    const instance = new ErrorBoundary({ 'data-testid': 'eb' });
    instance.state = { error: new Error() };
    const result = instance.render();
    const text = extractText(result);
    assert.match(text, /组件加载异常/);
  });

  test('block fallback uses aria-label from name prop', () => {
    const instance = new ErrorBoundary({ name: '仪表盘区域', 'data-testid': 'eb' });
    instance.state = { error: new Error('加载失败') };
    const result = React.createElement('div', null, instance.render());
    const html = renderToStaticMarkup(result);
    assert.ok(html.includes('aria-label="仪表盘区域"'));
  });

  test('block fallback uses default aria-label', () => {
    const instance = new ErrorBoundary({ 'data-testid': 'eb' });
    instance.state = { error: new Error('加载失败') };
    const result = React.createElement('div', null, instance.render());
    const html = renderToStaticMarkup(result);
    assert.ok(html.includes('aria-label="ErrorBoundary"'));
  });

  test('block fallback uses role="alert"', () => {
    const instance = new ErrorBoundary({ 'data-testid': 'eb' });
    instance.state = { error: new Error('加载失败') };
    const result = React.createElement('div', null, instance.render());
    const html = renderToStaticMarkup(result);
    assert.ok(html.includes('role="alert"'));
  });

  // ── Inline severity ──
  test('renders inline fallback when severity=inline', () => {
    const instance = new ErrorBoundary({
      severity: 'inline',
      'data-testid': 'eb',
    });
    instance.state = { error: new Error('单元格异常') };
    const result = instance.render();
    const text = extractText(result);
    assert.match(text, /单元格异常/);
    assert.match(text, /重试/);
  });

  test('inline fallback has role="alert"', () => {
    const instance = new ErrorBoundary({
      severity: 'inline',
      'data-testid': 'eb',
    });
    instance.state = { error: new Error('x') };
    const result = React.createElement('div', null, instance.render());
    const html = renderToStaticMarkup(result);
    assert.ok(html.includes('role="alert"'));
  });

  test('inline fallback renders retry button with data-testid', () => {
    const instance = new ErrorBoundary({
      severity: 'inline',
      'data-testid': 'my-boundary',
    });
    instance.state = { error: new Error('x') };
    const result = React.createElement('div', null, instance.render());
    const html = renderToStaticMarkup(result);
    assert.ok(html.includes('data-testid="my-boundary-retry"'));
  });

  // ── Toast severity ──
  test('returns null when severity=toast (log-only)', () => {
    const instance = new ErrorBoundary({ severity: 'toast' });
    instance.state = { error: new Error('静默错误') };
    const result = instance.render();
    assert.equal(result, null);
  });

  // ── Custom fallback ──
  test('uses custom fallback renderer when provided', () => {
    const instance = new ErrorBoundary({
      fallback: ({ error, resetError }) =>
        React.createElement('div', { key: 'fb' }, `[自定义] ${error.message}`),
    });
    instance.state = { error: new Error('自定义异常') };
    const result = instance.render();
    const text = extractText(result);
    assert.match(text, /\[自定义\] 自定义异常/);
  });

  test('custom fallback receives resetError callback', () => {
    let capturedReset: (() => void) | null = null;
    const instance = new ErrorBoundary({
      fallback: ({ error, resetError }) => {
        capturedReset = resetError;
        return React.createElement('div', { key: 'fb' }, error.message);
      },
    });
    instance.state = { error: new Error('可恢复') };
    instance.render();
    assert.equal(typeof capturedReset, 'function');
    // Calling resetError should clear state
    capturedReset!();
    assert.equal(instance.state.error, null);
  });

  // ── Custom retry label ──
  test('uses custom retryLabel in block mode', () => {
    const instance = new ErrorBoundary({
      retryLabel: '重新加载',
      'data-testid': 'eb',
    });
    instance.state = { error: new Error('失败') };
    const result = instance.render();
    const text = extractText(result);
    assert.match(text, /重新加载/);
  });

  test('uses custom retryLabel in inline mode', () => {
    const instance = new ErrorBoundary({
      severity: 'inline',
      retryLabel: '再试一次',
      'data-testid': 'eb',
    });
    instance.state = { error: new Error('失败') };
    const result = instance.render();
    const text = extractText(result);
    assert.match(text, /再试一次/);
  });

  // ── resetError behavior ──
  test('resetError clears error state and calls onReset', () => {
    let resetCalled = false;
    const instance = new ErrorBoundary({
      onReset: () => { resetCalled = true; },
    });
    instance.state = { error: new Error('test') };
    instance.resetError();
    assert.equal(instance.state.error, null);
    assert.equal(resetCalled, true);
  });

  test('resetError works without onReset callback', () => {
    const instance = new ErrorBoundary({});
    instance.state = { error: new Error('test') };
    instance.resetError();
    assert.equal(instance.state.error, null);
  });

  // ── onError callback ──
  test('componentDidCatch calls onError with error and errorInfo', () => {
    let capturedError: Error | null = null;
    let capturedInfo: React.ErrorInfo | null = null;
    const instance = new ErrorBoundary({
      onError: (err, info) => {
        capturedError = err;
        capturedInfo = info;
      },
    });
    const testError = new Error('捕捉测试');
    const testInfo: React.ErrorInfo = { componentStack: 'at BuggyComponent' };
    instance.componentDidCatch(testError, testInfo);
    assert.equal(capturedError, testError);
    assert.equal(capturedInfo, testInfo);
  });

  test('componentDidCatch is noop when onError is not provided', () => {
    const instance = new ErrorBoundary({});
    instance.componentDidCatch(new Error('noop'), { componentStack: '' });
    // No throw = pass
    assert.ok(true);
  });

  // ── className and style passthrough ──
  test('passes className to error container', () => {
    const instance = new ErrorBoundary({
      className: 'my-error-boundary',
      'data-testid': 'eb',
    });
    instance.state = { error: new Error('x') };
    const result = React.createElement('div', null, instance.render());
    const html = renderToStaticMarkup(result);
    assert.ok(html.includes('my-error-boundary'));
  });

  test('passes style to error container', () => {
    const instance = new ErrorBoundary({
      style: { marginTop: '16px' },
      'data-testid': 'eb',
    });
    instance.state = { error: new Error('x') };
    const result = React.createElement('div', null, instance.render());
    const html = renderToStaticMarkup(result);
    assert.ok(html.includes('margin-top:16px'));
  });

  // ── data-testid passthrough ──
  test('passes data-testid to error container', () => {
    const instance = new ErrorBoundary({ 'data-testid': 'custom-eb' });
    instance.state = { error: new Error('x') };
    const result = React.createElement('div', null, instance.render());
    const html = renderToStaticMarkup(result);
    assert.ok(html.includes('data-testid="custom-eb"'));
  });

  test('renders retry button with suffixed data-testid', () => {
    const instance = new ErrorBoundary({ 'data-testid': 'eb-main' });
    instance.state = { error: new Error('x') };
    const result = React.createElement('div', null, instance.render());
    const html = renderToStaticMarkup(result);
    assert.ok(html.includes('data-testid="eb-main-retry"'));
  });
});
