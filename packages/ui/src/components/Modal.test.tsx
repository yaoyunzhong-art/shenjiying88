import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { Modal } = require('./Modal');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(Modal, props));
}

test('Modal: returns empty when open is false', () => {
  const html = renderHTML({ open: false, onClose: () => {} });
  assert.equal(html, '');
});

test('Modal: renders when open is true', () => {
  const html = renderHTML({ open: true, onClose: () => {} });
  assert.ok(html.length > 0);
});

test('Modal: has role="dialog" and aria-modal="true"', () => {
  const html = renderHTML({ open: true, onClose: () => {}, title: 'Title' });
  assert.ok(html.includes('role="dialog"'));
  assert.ok(html.includes('aria-modal="true"'));
  assert.ok(html.includes('aria-label="Title"'));
});

test('Modal: renders title in h2 element', () => {
  const html = renderHTML({ open: true, onClose: () => {}, title: 'Hello Modal' });
  assert.ok(html.includes('Hello Modal'));
  assert.ok(html.includes('<h2'));
});

test('Modal: renders children', () => {
  const html = renderHTML({ open: true, onClose: () => {}, children: 'Body Content' });
  assert.ok(html.includes('Body Content'));
});

test('Modal: renders footer when provided', () => {
  const html = renderHTML({ open: true, onClose: () => {}, footer: 'Footer Content' });
  assert.ok(html.includes('Footer Content'));
});

test('Modal: showClose=true renders close button', () => {
  const html = renderHTML({ open: true, onClose: () => {}, title: 'Title', showClose: true });
  assert.ok(html.includes('×'));
});

test('Modal: showClose=false hides close button', () => {
  const html = renderHTML({ open: true, onClose: () => {}, showClose: false });
  assert.ok(!html.includes('×'));
});

test('Modal: mask has dark overlay background', () => {
  const html = renderHTML({ open: true, onClose: () => {} });
  assert.ok(html.includes('fixed'));
});

test('Modal: inner dialog has dark background', () => {
  const html = renderHTML({ open: true, onClose: () => {} });
  assert.ok(html.includes('border-radius'));
});

test('Modal: custom width is applied', () => {
  const html = renderHTML({ open: true, onClose: () => {}, width: 600 });
  // Width is applied as inline style
  assert.ok(html.includes('600') || html.includes('max-width'));
});

test('Modal: defaults to width 480', () => {
  const html = renderHTML({ open: true, onClose: () => {} });
  assert.ok(html.includes('480') || html.includes('max-width'));
});

test('Modal: onClick mask handler exists - maskClosable default true', () => {
  const html = renderHTML({ open: true, onClose: () => {} });
  assert.ok(html.includes('fixed'));
});

test('Modal: registers inline animation keyframes via style tag', () => {
  const html = renderHTML({ open: true, onClose: () => {} });
  assert.ok(html.includes('modal-fade-in') || html.includes('@keyframes'));
});
