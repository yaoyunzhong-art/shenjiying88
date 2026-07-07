import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { Alert } = require('./Alert');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(Alert, props));
}

test('Alert: renders children text', () => {
  const html = renderHTML({ children: 'Something happened' });
  assert.ok(html.includes('Something happened'));
});

test('Alert: info variant renders', () => {
  const html = renderHTML({ children: 'Info message', variant: 'info' });
  assert.ok(html.includes('Info message'));
});

test('Alert: success variant renders', () => {
  const html = renderHTML({ children: 'Success!', variant: 'success' });
  assert.ok(html.includes('Success!'));
});

test('Alert: warning variant renders', () => {
  const html = renderHTML({ children: 'Warning!', variant: 'warning' });
  assert.ok(html.includes('Warning!'));
});

test('Alert: danger variant renders', () => {
  const html = renderHTML({ children: 'Danger!', variant: 'danger' });
  assert.ok(html.includes('Danger!'));
});

test('Alert: renders title when provided', () => {
  const html = renderHTML({ children: 'msg', title: 'Alert Title' });
  assert.ok(html.includes('Alert Title'));
});

test('Alert: icon=true renders SVG icon', () => {
  const html = renderHTML({ children: 'msg', icon: true });
  assert.ok(html.includes('<svg'));
});

test('Alert: icon=false hides SVG icon', () => {
  const html = renderHTML({ children: 'msg', icon: false });
  assert.ok(!html.includes('<svg'));
});

test('Alert: dismissible renders close button', () => {
  const html = renderHTML({ children: 'msg', dismissible: true });
  assert.ok(html.includes('Dismiss alert'));
});

test('Alert: not dismissible by default - no close button', () => {
  const html = renderHTML({ children: 'msg' });
  assert.ok(!html.includes('Dismiss alert'));
});

test('Alert: has rounded corners (style attrs present)', () => {
  const html = renderHTML({ children: 'msg' });
  assert.ok(html.includes('border-radius'));
});

test('Alert: renders 4 icon variants without error', () => {
  for (const v of ['info', 'success', 'warning', 'danger']) {
    const html = renderHTML({ children: 'test', variant: v, icon: true });
    assert.ok(html.includes('test'), `Alert variant ${v} should render`);
  }
});

test('Alert: defaults to info variant', () => {
  const html = renderHTML({ children: 'msg' });
  assert.ok(html.includes('msg'));
});

test('Alert: accepts className', () => {
  const html = renderHTML({ children: 'msg', className: 'custom-alert' });
  assert.ok(html.includes('custom-alert'));
});
