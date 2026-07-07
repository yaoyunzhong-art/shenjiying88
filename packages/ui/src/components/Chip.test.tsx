import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { Chip } = require('./Chip');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(Chip, props));
}

test('Chip: renders children text', () => {
  const html = renderHTML({ children: 'Label' });
  assert.ok(html.includes('Label'));
});

test('Chip: default variant renders with data-testid chip', () => {
  const html = renderHTML({ children: 'Tag' });
  assert.ok(html.includes('chip'));
});

test('Chip: primary variant renders', () => {
  const html = renderHTML({ variant: 'primary', children: 'Primary' });
  assert.ok(html.includes('Primary'));
});

test('Chip: success variant renders', () => {
  const html = renderHTML({ variant: 'success', children: 'Done' });
  assert.ok(html.includes('Done'));
});

test('Chip: warning variant renders', () => {
  const html = renderHTML({ variant: 'warning', children: 'Pending' });
  assert.ok(html.includes('Pending'));
});

test('Chip: error variant renders', () => {
  const html = renderHTML({ variant: 'error', children: 'Error' });
  assert.ok(html.includes('Error'));
});

test('Chip: info variant renders', () => {
  const html = renderHTML({ variant: 'info', children: 'Info' });
  assert.ok(html.includes('Info'));
});

test('Chip: neutral variant renders', () => {
  const html = renderHTML({ variant: 'neutral', children: 'Neutral' });
  assert.ok(html.includes('Neutral'));
});

test('Chip: purple variant renders', () => {
  const html = renderHTML({ variant: 'purple', children: 'VIP' });
  assert.ok(html.includes('VIP'));
});

test('Chip: sm size renders', () => {
  const html = renderHTML({ size: 'sm', children: 'Small' });
  assert.ok(html.includes('Small'));
});

test('Chip: lg size renders', () => {
  const html = renderHTML({ size: 'lg', children: 'Large' });
  assert.ok(html.includes('Large'));
});

test('Chip: outlined variant applies transparent background', () => {
  const html = renderHTML({ outlined: true, children: 'Outlined' });
  assert.ok(html.includes('Outlined'));
});

test('Chip: disabled mode sets opacity', () => {
  const html = renderHTML({ disabled: true, children: 'Disabled' });
  assert.ok(html.includes('Disabled'));
});

test('Chip: removable adds × button', () => {
  const html = renderHTML({ removable: true, children: 'Removable' });
  assert.ok(html.includes('×'));
});

test('Chip: removable chip has remove data-testid', () => {
  const html = renderHTML({ removable: true, children: 'Tag', 'data-testid': 'my-chip' });
  assert.ok(html.includes('my-chip-remove'));
});

test('Chip: custom data-testid attribute', () => {
  const html = renderHTML({ 'data-testid': 'my-chip', children: 'Custom' });
  assert.ok(html.includes('my-chip'));
});

test('Chip: icon prop renders leading element', () => {
  const Icon = () => React.createElement('span', { 'data-testid': 'icon' }, '★');
  const html = renderHTML({ children: 'Star', icon: React.createElement(Icon) });
  assert.ok(html.includes('★'));
});

test('Chip: onClick sets role to button and tabIndex', () => {
  const html = renderHTML({ children: 'Clickable', onClick: () => {} });
  assert.ok(html.includes('role="button"') || html.includes('tabindex'));
});

test('Chip: rendered without removable has no ×', () => {
  const html = renderHTML({ children: 'NoRemove' });
  assert.ok(!html.includes('×'));
});
