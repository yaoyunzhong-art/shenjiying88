import React from 'react';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { LoadingSkeleton } = require('./LoadingSkeleton');

/** Count skeleton line bars in HTML by counting style width attributes within the skeleton block */
function countLineBars(html: string): number {
  // Each line bar has style containing "width:XX%"
  // We count them by matching the distinctive pattern of skeleton line bars:
  // style="height:16px;border-radius:4px;background:...
  return (html.match(/height:\s*16px/g) || []).length;
}

/** Count skeleton row bars in HTML */
function countRowBars(html: string): number {
  // Each table row bar has style containing "height:40px;border-radius:6px;background:..."
  return (html.match(/height:\s*40px/g) || []).length;
}

test('LoadingSkeleton renders default number of line blocks (3)', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, {}));
  assert.strictEqual(countLineBars(html), 3, 'default variant should render 3 line blocks');
});

test('LoadingSkeleton renders default number of row blocks (5)', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, {}));
  assert.strictEqual(countRowBars(html), 5, 'default variant should render 5 table rows');
});

test('LoadingSkeleton card variant renders 2 lines and 2 rows', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, { variant: 'card' }));
  assert.strictEqual(countLineBars(html), 2);
  assert.strictEqual(countRowBars(html), 2);
});

test('LoadingSkeleton renders custom lines count', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, { lines: 7 }));
  assert.strictEqual(countLineBars(html), 7);
});

test('LoadingSkeleton renders custom rows count', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, { rows: 3 }));
  assert.strictEqual(countRowBars(html), 3);
});

test('LoadingSkeleton renders label when provided', () => {
  const html = renderToStaticMarkup(
    React.createElement(LoadingSkeleton, { label: '加载中...' })
  );
  assert.match(html, /加载中\.\.\./);
});

test('LoadingSkeleton does not render label when omitted', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, {}));
  assert.doesNotMatch(html, /加载中\.\.\./);
});

test('LoadingSkeleton includes @keyframes pulse animation', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, {}));
  assert.match(html, /@keyframes\s+pulse/);
});

test('LoadingSkeleton table variant falls back to default (3 lines, 5 rows)', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, { variant: 'table' }));
  assert.strictEqual(countLineBars(html), 3);
  assert.strictEqual(countRowBars(html), 5);
});

test('LoadingSkeleton skeleton bars have pulse animation class', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, {}));
  assert.match(html, /animation:\s*pulse/);
  // Should appear on both line bars and row bars
  const pulseCount = (html.match(/animation:\s*pulse/g) || []).length;
  assert.ok(pulseCount >= 8, `expected at least 8 pulse animations, got ${pulseCount}`);
});

test('LoadingSkeleton line widths decrease progressively', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, { lines: 3 }));
  assert.match(html, /width:\s*100%/);
  assert.match(html, /width:\s*85%/);
  assert.match(html, /width:\s*70%/);
});

test('LoadingSkeleton renders container with padding', () => {
  const html = renderToStaticMarkup(React.createElement(LoadingSkeleton, {}));
  assert.match(html, /padding:\s*24px/);
});
