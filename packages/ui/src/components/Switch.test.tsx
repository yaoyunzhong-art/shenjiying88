import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Switch } = require('./Switch');

describe('Switch', () => {
  // ── Rendering ──
  test('renders unchecked by default', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { 'data-testid': 'sw' }));
    assert.ok(html.includes('aria-checked="false"'));
  });

  test('renders checked when defaultChecked=true', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { defaultChecked: true, 'data-testid': 'sw' }));
    assert.ok(html.includes('aria-checked="true"'));
  });

  test('renders controlled checked state', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { checked: true, 'data-testid': 'sw' }));
    assert.ok(html.includes('aria-checked="true"'));
  });

  test('renders with role="switch"', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { 'data-testid': 'sw' }));
    assert.ok(html.includes('role="switch"'));
  });

  // ── Disabled ──
  test('renders disabled state', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { disabled: true, 'data-testid': 'sw' }));
    assert.ok(html.includes('aria-disabled="true"'));
    assert.ok(html.includes('tabindex="-1"'));
  });

  test('non-disabled switch is focusable', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { 'data-testid': 'sw' }));
    assert.ok(html.includes('tabindex="0"'));
  });

  // ── Labels ──
  test('renders label on the right by default', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { label: 'Wi-Fi', 'data-testid': 'sw' }));
    assert.ok(html.includes('Wi-Fi'));
    // label should be a <label> element
    assert.ok(html.includes('<label'));
  });

  test('renders label on the left when labelPosition=left', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { label: 'Wi-Fi', labelPosition: 'left' as const, 'data-testid': 'sw' }));
    assert.ok(html.includes('Wi-Fi'));
  });

  test('uses aria-label when provided without visible label', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { 'aria-label': 'Enable notifications', 'data-testid': 'sw' }));
    assert.ok(html.includes('aria-label="Enable notifications"'));
  });

  test('falls back aria-label to visible label text', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { label: 'Dark mode', 'data-testid': 'sw' }));
    assert.ok(html.includes('aria-label="Dark mode"'));
  });

  // ── Sizes ──
  test('renders sm size', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { size: 'sm', 'data-testid': 'sw' }));
    assert.ok(html.includes('width:34px'));
    assert.ok(html.includes('height:20px'));
  });

  test('renders md size (default)', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { 'data-testid': 'sw' }));
    assert.ok(html.includes('width:44px'));
    assert.ok(html.includes('height:24px'));
  });

  test('renders lg size', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { size: 'lg', 'data-testid': 'sw' }));
    assert.ok(html.includes('width:56px'));
    assert.ok(html.includes('height:30px'));
  });

  // ── Thumb position ──
  test('positions thumb at right offset when checked (md size)', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { checked: true, 'data-testid': 'sw' }));
    // md: width=44, thumb=18, gap=3 => left=44-18-3=23
    assert.ok(html.includes('left:23px'));
  });

  test('positions thumb at gap offset when unchecked (md size)', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { 'data-testid': 'sw' }));
    // md: gap=3
    assert.ok(html.includes('left:3px'));
  });

  // ── Custom colors ──
  test('applies custom checked color', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, {
      checked: true,
      checkedColor: '#10b981',
      'data-testid': 'sw',
    }));
    // React inline style renders hex as-is or rgb; check for the value
    assert.ok(html.includes('#10b981') || html.includes('10b981'));
  });

  test('applies custom unchecked color', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, {
      checked: false,
      uncheckedColor: '#f43f5e',
      'data-testid': 'sw',
    }));
    assert.ok(html.includes('#f43f5e') || html.includes('f43f5e'));
  });

  test('applies custom thumb color', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, {
      thumbColor: '#000000',
      'data-testid': 'sw',
    }));
    assert.ok(html.includes('#000000') || html.includes('000000'));
  });

  // ── Default checked (uncontrolled) ──
  test('defaultChecked=true renders checked markup', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { defaultChecked: true, 'data-testid': 'sw' }));
    assert.ok(html.includes('aria-checked="true"'));
  });

  // ── className / style passthrough ──
  test('passes className', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { className: 'my-switch', 'data-testid': 'sw' }));
    assert.ok(html.includes('my-switch'));
  });

  test('passes data-testid', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { 'data-testid': 'my-switch' }));
    assert.ok(html.includes('data-testid="my-switch"'));
  });

  test('passes style prop', () => {
    const html = renderToStaticMarkup(React.createElement(Switch, { style: { marginLeft: '8px' }, 'data-testid': 'sw' }));
    assert.ok(html.includes('margin-left:8px'));
  });
});
