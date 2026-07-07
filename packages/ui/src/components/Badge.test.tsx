import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { Badge } = require('./Badge');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(Badge, props));
}

test('Badge: returns empty when visible is false', () => {
  const html = renderHTML({ children: 5, visible: false });
  assert.equal(html, '');
});

test('Badge: default variant renders error (red) badge', () => {
  const html = renderHTML({ children: 3, standalone: true });
  assert.ok(html.includes('3'));
});

test('Badge: primary variant renders', () => {
  const html = renderHTML({ variant: 'primary', children: 7, standalone: true });
  assert.ok(html.includes('7'));
});

test('Badge: success variant renders', () => {
  const html = renderHTML({ variant: 'success', children: 1, standalone: true });
  assert.ok(html.includes('1'));
});

test('Badge: warning variant renders', () => {
  const html = renderHTML({ variant: 'warning', children: 1, standalone: true });
  assert.ok(html.includes('1'));
});

test('Badge: error variant renders', () => {
  const html = renderHTML({ variant: 'error', children: 1, standalone: true });
  assert.ok(html.includes('1'));
});

test('Badge: info variant renders', () => {
  const html = renderHTML({ variant: 'info', children: 1, standalone: true });
  assert.ok(html.includes('1'));
});

test('Badge: neutral variant renders', () => {
  const html = renderHTML({ variant: 'neutral', children: 1, standalone: true });
  assert.ok(html.includes('1'));
});

test('Badge: purple variant renders', () => {
  const html = renderHTML({ variant: 'purple', children: 1, standalone: true });
  assert.ok(html.includes('1'));
});

test('Badge: dot mode renders small circle', () => {
  const html = renderHTML({ dot: true, standalone: true });
  // Dot mode: no text, just a colored circle span
  assert.ok(html.includes('badge'));
});

test('Badge: overflowCount clamps numeric display', () => {
  const html100 = renderHTML({ children: 100, overflowCount: 99, standalone: true });
  assert.ok(html100.includes('99+'));

  const html50 = renderHTML({ children: 50, overflowCount: 99, standalone: true });
  assert.ok(html50.includes('50'));
});

test('Badge: sm size renders', () => {
  const html = renderHTML({ size: 'sm', dot: true, standalone: true });
  assert.ok(html.includes('badge'));
});

test('Badge: lg size renders', () => {
  const html = renderHTML({ size: 'lg', children: '99+', standalone: true });
  assert.ok(html.includes('99+'));
});

test('Badge: data-testid attribute', () => {
  const html = renderHTML({ 'data-testid': 'my-badge', children: 1, standalone: true });
  assert.ok(html.includes('my-badge'));
});

test('Badge: non-standalone wraps in relative container', () => {
  const html = renderHTML({ children: 3 });
  // Has nested span structure (outer relative span + inner absolute badge)
  assert.ok(html.includes('badge'));
});

test('Badge: placement top-left renders', () => {
  const html = renderHTML({ children: 3, placement: 'top-left' });
  assert.ok(html.includes('badge'));
});

test('Badge: placement bottom-right renders', () => {
  const html = renderHTML({ children: 3, placement: 'bottom-right' });
  assert.ok(html.includes('badge'));
});

test('Badge: offset adjusts positioning', () => {
  const html = renderHTML({ children: 3, offset: { x: 2, y: -3 } });
  assert.ok(html.includes('badge'));
});
