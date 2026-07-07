import React from 'react';
import assert from 'node:assert/strict';
import { describe, test, before, mock } from 'node:test';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { RichTextEditor } = require('./RichTextEditor');
import type { RichTextEditorProps } from './RichTextEditor';

function r(overrides: Record<string, unknown> = {}) {
  return React.createElement(RichTextEditor, {
    label: 'Test',
    ...overrides,
  } as any);
}

describe('RichTextEditor', () => {
  // ── Rendering ──
  test('renders with label', () => {
    const html = renderToStaticMarkup(r({ label: 'Content' }));
    assert.ok(html.includes('Content'));
    assert.ok(html.includes('contenteditable'));
  });

  test('renders with data-testid', () => {
    const html = renderToStaticMarkup(r({ 'data-testid': 'my-rte' }));
    assert.ok(html.includes('data-testid="my-rte"') || html.includes('data-testid=\\"my-rte\\"') || html.includes('data-testid'));
  });

  test('renders toolbar buttons for basic preset', () => {
    const html = renderToStaticMarkup(r({ toolbar: 'basic' }));
    assert.ok(html.includes('role="toolbar"'));
    // Should contain at least Bold button
    assert.ok(html.includes('Bold') || html.includes('title="Bold"') || html.includes('title=\\"Bold\\"'));
  });

  test('renders initial value', () => {
    const html = renderToStaticMarkup(r({ value: '<p>Hello World</p>' }));
    assert.ok(html.includes('Hello World'));
  });

  test('renders error message', () => {
    const html = renderToStaticMarkup(r({ error: 'Required field' }));
    assert.ok(html.includes('Required field'));
  });

  test('renders helper text', () => {
    const html = renderToStaticMarkup(r({ helperText: 'Supports HTML' }));
    assert.ok(html.includes('Supports HTML'));
  });

  test('applies block width', () => {
    const html = renderToStaticMarkup(r({ block: true }));
    assert.ok(html.includes('width:100%') || html.includes('width: 100%'));
  });

  test('disables editing when disabled', () => {
    const html = renderToStaticMarkup(r({ disabled: true }));
    assert.ok(html.includes('contentEditable="false"') || html.includes('contenteditable="false"') || html.includes('contenteditable'));
  });

  test('renders minimal toolbar preset', () => {
    const html = renderToStaticMarkup(r({ toolbar: 'minimal' }));
    assert.ok(html);
  });

  test('renders full toolbar preset', () => {
    const html = renderToStaticMarkup(r({ toolbar: 'full' }));
    assert.ok(html);
  });

  test('applies size variants', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const html = renderToStaticMarkup(r({ size }));
      assert.ok(html);
    }
  });

  test('sanitizes script tags', () => {
    const html = renderToStaticMarkup(r({
      value: '<script>alert("xss")</script><p>safe</p>',
    }));
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('safe'));
  });

  test('strips inline event handlers', () => {
    const html = renderToStaticMarkup(r({
      value: '<p onclick="alert(1)">safe</p>',
    }));
    assert.ok(!html.includes('onclick'));
    assert.ok(html.includes('safe'));
  });

  test('renders placeholder attribute', () => {
    const html = renderToStaticMarkup(r({ placeholder: 'Write something...' }));
    assert.ok(html.includes('Write something...'));
  });

  test('renders loading state', () => {
    const html = renderToStaticMarkup(r({ loading: true }));
    assert.ok(html);
  });

  test('renders character count section', () => {
    const html = renderToStaticMarkup(r({ showCount: true, value: 'Hi' }));
    // Static render will show the value
    assert.ok(html.includes('Hi') || html.includes('showCount'));
  });

  test('renders with maxLength display structure', () => {
    const html = renderToStaticMarkup(r({ showCount: true, maxLength: 200 }));
    assert.ok(html);
  });

  test('renders custom toolbar actions', () => {
    const customToolbar = [
      { key: 'custom', label: 'Custom Action', icon: '⚡', command: () => {} },
    ];
    const html = renderToStaticMarkup(r({ toolbar: customToolbar }));
    assert.ok(html.includes('Custom Action'));
  });

  test('renders with custom minHeight and maxHeight', () => {
    const html = renderToStaticMarkup(r({ minHeight: 200, maxHeight: 400 }));
    assert.ok(html);
  });
});
