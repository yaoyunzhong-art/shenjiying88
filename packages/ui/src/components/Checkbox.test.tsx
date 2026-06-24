import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Checkbox } = require('./Checkbox');

describe('Checkbox', () => {
  // ── Rendering ──
  test('renders with role="checkbox"', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb' }));
    assert.ok(html.includes('role="checkbox"'));
  });

  test('renders unchecked by default', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb' }));
    assert.ok(html.includes('aria-checked="false"'));
  });

  test('renders with label (right by default)', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', label: '同意条款' }));
    assert.ok(html.includes('同意条款'));
  });

  test('renders label on left', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', label: '左标签', labelPosition: 'left' }));
    assert.ok(html.includes('左标签'));
  });

  test('renders required asterisk', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', label: '必选', required: true }));
    assert.ok(html.includes('*'));
  });

  test('renders error message', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', error: '必须勾选' }));
    assert.ok(html.includes('必须勾选'));
    assert.ok(html.includes('role="alert"'));
  });

  test('renders size=sm', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', size: 'sm' }));
    assert.ok(html.includes('role="checkbox"'));
  });

  test('renders size=lg', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', size: 'lg' }));
    assert.ok(html.includes('role="checkbox"'));
  });

  // ── Controlled ──
  test('aria-checked="true" when checked', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', checked: true }));
    assert.ok(html.includes('aria-checked="true"'));
  });

  test('aria-checked="false" when unchecked', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', checked: false }));
    assert.ok(html.includes('aria-checked="false"'));
  });

  test('defaultChecked=true renders checked', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', defaultChecked: true }));
    assert.ok(html.includes('aria-checked="true"'));
  });

  // ── Indeterminate ──
  test('aria-checked="mixed" when indeterminate', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', indeterminate: true }));
    assert.ok(html.includes('aria-checked="mixed"'));
  });

  test('indeterminate shows dash (not checkmark SVG)', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', indeterminate: true }));
    assert.ok(!html.includes('<svg'), 'indeterminate should not contain <svg');
    assert.ok(!html.includes('checkmark'), 'indeterminate should not contain checkmark');
  });

  test('checked shows checkmark SVG', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', checked: true }));
    assert.ok(html.includes('<svg'));
  });

  test('unchecked shows no checkmark', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', checked: false }));
    assert.ok(!html.includes('<svg'));
  });

  // ── Disabled ──
  test('aria-disabled=true when disabled', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', disabled: true }));
    assert.ok(html.includes('aria-disabled="true"'));
  });

  test('aria-disabled=false when enabled', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb' }));
    assert.ok(html.includes('aria-disabled="false"'));
  });

  test('disabled cursor is not-allowed', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', disabled: true }));
    assert.ok(html.includes('not-allowed'));
  });

  test('enabled cursor is pointer', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb' }));
    assert.ok(!html.includes('not-allowed'));
  });

  // ── Form participation ──
  test('hidden native checkbox input', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', name: 'agree', value: 'yes' }));
    assert.ok(html.includes('type="checkbox"'));
    assert.ok(html.includes('name="agree"'));
    assert.ok(html.includes('value="yes"'));
  });

  test('native checkbox is aria-hidden', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb' }));
    assert.ok(html.includes('aria-hidden="true"'));
  });

  // ── ARIA label ──
  test('uses explicit aria-label', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', 'aria-label': '同意用户协议' }));
    assert.ok(html.includes('aria-label="同意用户协议"'));
  });

  test('falls back to label as aria-label', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', label: '记住我' }));
    assert.ok(html.includes('aria-label="记住我"'));
  });

  test('falls back to "Checkbox" when nothing provided', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb' }));
    assert.ok(html.includes('aria-label="Checkbox"'));
  });

  // ── tabIndex ──
  test('tabIndex is -1 when disabled', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb', disabled: true }));
    assert.ok(html.includes('tabindex="-1"'));
  });

  test('tabIndex is 0 when enabled', () => {
    const html = renderToStaticMarkup(React.createElement(Checkbox, { 'data-testid': 'cb' }));
    assert.ok(html.includes('tabindex="0"'));
  });
});
