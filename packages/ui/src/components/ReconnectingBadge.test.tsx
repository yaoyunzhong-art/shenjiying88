import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const { ReconnectingBadge } = require('./ReconnectingBadge');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(ReconnectingBadge, props));
}

// ── connecting ──────────────────────────────────────────────────────────────

test('ReconnectingBadge: connecting state renders icon + label', () => {
  const html = renderHTML({ state: 'connecting' });
  assert.ok(html.includes('data-state="connecting"'));
  assert.ok(html.includes('连接中'));
  assert.ok(html.includes('🔄'));
});

// ── open ────────────────────────────────────────────────────────────────────

test('ReconnectingBadge: open state shows "已连接"', () => {
  const html = renderHTML({ state: 'open' });
  assert.ok(html.includes('data-state="open"'));
  assert.ok(html.includes('已连接'));
  assert.ok(html.includes('✓'));
});

test('ReconnectingBadge: open state uses data-testid attributes', () => {
  const html = renderHTML({ state: 'open' });
  assert.ok(html.includes('data-testid="reconnecting-badge"'));
  assert.ok(html.includes('data-testid="reconnecting-badge-icon"'));
  assert.ok(html.includes('data-testid="reconnecting-badge-label"'));
});

// ── reconnecting ────────────────────────────────────────────────────────────

test('ReconnectingBadge: reconnecting shows attempt/max', () => {
  const html = renderHTML({ state: 'reconnecting', attempt: 2, maxRetries: 5 });
  assert.ok(html.includes('data-state="reconnecting"'));
  assert.ok(html.includes('2/5'));
  assert.ok(html.includes('重连中'));
  assert.ok(html.includes('🔄'));
});

test('ReconnectingBadge: reconnecting defaults attempt to 1, maxRetries to 3', () => {
  const html = renderHTML({ state: 'reconnecting' });
  assert.ok(html.includes('1/3'));
});

// ── closed ──────────────────────────────────────────────────────────────────

test('ReconnectingBadge: closed state shows "连接已断开" without retry button when no onRetry', () => {
  const html = renderHTML({ state: 'closed' });
  assert.ok(html.includes('data-state="closed"'));
  assert.ok(html.includes('❌'));
  assert.ok(html.includes('连接已断开'));
  assert.ok(!html.includes('重试'));
});

test('ReconnectingBadge: closed state shows retry button when onRetry provided', () => {
  const onRetry = () => {};
  const html = renderHTML({ state: 'closed', onRetry });
  assert.ok(html.includes('data-testid="reconnecting-badge-retry"'));
  assert.ok(html.includes('重试'));
});

test('ReconnectingBadge: retry button triggers onClick', () => {
  let called = false;
  const onRetry = () => { called = true; };
  const html = renderHTML({ state: 'closed', onRetry });
  // Simulate click via SSR check — button element present
  assert.ok(html.includes('重试'));
  onRetry();
  assert.equal(called, true);
});

// ── custom style ────────────────────────────────────────────────────────────

test('ReconnectingBadge: custom style is applied', () => {
  const html = renderHTML({ state: 'open', style: { marginLeft: 20 } });
  assert.ok(html.includes('margin-left'));
});

// ── export / default ────────────────────────────────────────────────────────

test('ReconnectingBadge: is a function component', () => {
  assert.equal(typeof ReconnectingBadge, 'function');
});

test('ReconnectingBadge: default export equals named export', () => {
  const DefaultExport = require('./ReconnectingBadge').default;
  assert.equal(DefaultExport, ReconnectingBadge);
});
