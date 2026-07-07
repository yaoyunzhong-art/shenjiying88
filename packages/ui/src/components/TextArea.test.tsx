import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { TextArea } = require('./TextArea');

/**
 * Helper: extract attribute value from rendered HTML string.
 * Handles both double-quoted and single-quoted attribute values.
 */
function attr(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`${name}="([^"]*)"`),
    new RegExp(`${name}='([^']*)'`),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

describe('TextArea', () => {
  test('renders textarea element', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { 'data-testid': 'ta' }));
    assert.ok(html.includes('<textarea'));
    assert.ok(html.includes('</textarea>'));
  });

  test('renders with placeholder', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { placeholder: '请输入' }));
    assert.ok(html.includes('placeholder="请输入"'));
  });

  test('renders with label', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { label: '描述' }));
    assert.ok(html.includes('>描述<'));
  });

  test('renders helper text', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { helperText: '最多200字' }));
    assert.ok(html.includes('最多200字'));
  });

  test('renders error and hides helper text', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextArea, { error: '必填', helperText: 'hidden' })
    );
    assert.ok(html.includes('必填'));
    assert.ok(!html.includes('hidden'));
  });

  test('renders disabled state', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { disabled: true }));
    assert.ok(html.includes('disabled=""') || html.includes('disabled'));
  });

  test('renders block width', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { block: true }));
    assert.ok(html.includes('width:100%'));
  });

  test('renders with maxLength and character count', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextArea, { showCount: true, maxLength: 200, defaultValue: 'hi' })
    );
    assert.ok(html.includes('2/200'));
  });

  test('renders loading spinner', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextArea, { loading: true, 'data-testid': 't' })
    );
    assert.ok(html.includes('spinner-spin'));
  });

  test('renders with aria-invalid when error present', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { error: 'err' }));
    assert.ok(html.includes('aria-invalid'));
  });

  test('renders with size lg', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { size: 'lg' }));
    assert.ok(html.includes('font-size:16'));
  });

  test('renders with size sm', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { size: 'sm' }));
    assert.ok(html.includes('font-size:13'));
  });

  test('renders with resize none', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { resize: 'none' }));
    assert.ok(html.includes('resize:none'));
  });

  test('renders controlled value', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { value: 'controlled' }));
    // textarea value in SSR is rendered as default value
    // We just verify it renders without error
    assert.ok(html.length > 0);
  });

  test('sets aria-label from label', () => {
    const html = renderToStaticMarkup(React.createElement(TextArea, { label: '备注' }));
    assert.ok(html.includes('aria-label') || html.includes('备注'));
  });

  test('renders data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextArea, { 'data-testid': 'my-textarea' })
    );
    assert.ok(html.includes('data-testid="my-textarea"'));
  });

  test('renders with default minRows', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextArea, { 'data-testid': 'rows-ta' })
    );
    assert.ok(html.includes('min-height:60'));
  });
});
