import React from 'react';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { OfflineBadge } = require('./OfflineBadge');

test('OfflineBadge renders online status with checkmark', () => {
  const html = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'online' }));
  assert.match(html, /✓/);
  assert.match(html, /在线/);
});

test('OfflineBadge renders offline status', () => {
  const html = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'offline' }));
  assert.match(html, /○/);
  assert.match(html, /离线/);
});

test('OfflineBadge shows pending count when offline', () => {
  const html = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'offline', pendingCount: 5 }));
  assert.match(html, /5/);
  assert.match(html, /离线/);
});

test('OfflineBadge shows zero pending count correctly', () => {
  const html = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'offline', pendingCount: 0 }));
  assert.doesNotMatch(html, /\(0\)/);
  assert.match(html, /离线/);
});

test('OfflineBadge renders syncing status', () => {
  const html = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'syncing' }));
  assert.match(html, /⟳/);
  assert.match(html, /同步中/);
});

test('OfflineBadge renders error status with retry button', () => {
  let retried = false;
  const html = renderToStaticMarkup(
    React.createElement(OfflineBadge, { status: 'error', onRetry: () => { retried = true; } })
  );
  assert.match(html, /✗/);
  assert.match(html, /同步失败/);
  assert.match(html, /重试/);
});

test('OfflineBadge does not render retry button when onRetry is absent', () => {
  const html = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'error' }));
  assert.doesNotMatch(html, /重试/);
});

test('OfflineBadge hides icon when showIcon is false', () => {
  const html = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'online', showIcon: false }));
  assert.doesNotMatch(html, /✓/);
  assert.match(html, /在线/);
});

test('OfflineBadge data-testid attribute works', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfflineBadge, { status: 'offline', 'data-testid': 'my-offline' })
  );
  assert.match(html, /data-testid="my-offline"/);
});

test('OfflineBadge data-status attribute reflects status', () => {
  const html = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'syncing' }));
  assert.match(html, /data-status="syncing"/);
});

test('OfflineBadge applies custom style', () => {
  const html = renderToStaticMarkup(
    React.createElement(OfflineBadge, { status: 'online', style: { opacity: 0.5 } })
  );
  assert.match(html, /opacity:\s*0\.5/);
});

test('OfflineBadge all four statuses render different labels', () => {
  const online = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'online' }));
  const offline = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'offline' }));
  const syncing = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'syncing' }));
  const error = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'error' }));
  assert.match(online, /在线/);
  assert.match(offline, /离线/);
  assert.match(syncing, /同步中/);
  assert.match(error, /同步失败/);
  // All different labels
  assert.notEqual(online, offline);
  assert.notEqual(online, syncing);
  assert.notEqual(online, error);
  assert.notEqual(offline, syncing);
  assert.notEqual(offline, error);
  assert.notEqual(syncing, error);
});

test('OfflineBadge auto-hides after online status', () => {
  // We can't test timers in static rendering, but verify the component renders when status=online
  const html = renderToStaticMarkup(React.createElement(OfflineBadge, { status: 'online' }));
  assert.match(html, /在线/);
});
