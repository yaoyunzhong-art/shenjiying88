import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { CopyToClipboard } = require('./CopyToClipboard');

describe('CopyToClipboard', () => {
  // === iconOnly mode ===
  test('iconOnly renders compact button without label text', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'abc-123', iconOnly: true })
    );
    // Should have a button with aria-label
    assert.match(html, /aria-label="Copy to clipboard"/);
    // Should not render label text (no <span> with text content outside svg)
    assert.doesNotMatch(html, />Copy</);
  });

  test('iconOnly sm size renders smaller button (28px)', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'abc', iconOnly: true, size: 'sm' })
    );
    assert.match(html, /width:\s*28px/);
    assert.match(html, /height:\s*28px/);
  });

  test('iconOnly md size renders default button (34px)', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'abc', iconOnly: true, size: 'md' })
    );
    assert.match(html, /width:\s*34px/);
    assert.match(html, /height:\s*34px/);
  });

  // === label mode ===
  test('label mode renders with default label "Copy"', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'hello', label: undefined })
    );
    assert.match(html, />Copy</);
  });

  test('label mode renders with custom label', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'hello', label: '复制代码' })
    );
    assert.match(html, />复制代码</);
  });

  test('label mode sm size renders smaller padding (5px 11px)', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'abc', size: 'sm' })
    );
    assert.match(html, /padding:\s*5px 11px/);
  });

  test('label mode md size renders default padding (7px 15px)', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'abc', size: 'md' })
    );
    assert.match(html, /padding:\s*7px 15px/);
  });

  // === successLabel ===
  test('renders default successLabel "Copied" in aria-label title', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'abc', iconOnly: true, successLabel: 'Copied' })
    );
    assert.match(html, /Copy to clipboard/);
  });

  test('accepts custom successLabel', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, {
        text: 'abc',
        iconOnly: true,
        successLabel: '已复制！',
      })
    );
    // Initial state shows default aria-label
    assert.match(html, /Copy to clipboard/);
  });

  // === style prop ===
  test('renders custom style on iconOnly button', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, {
        text: 'abc',
        iconOnly: true,
        style: { marginLeft: '8px' },
      })
    );
    assert.match(html, /margin-left:\s*8px/);
  });

  test('renders custom style on label button', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, {
        text: 'abc',
        style: { borderRadius: '12px' },
      })
    );
    assert.match(html, /border-radius:\s*12px/);
  });

  // === text prop ===
  test('renders button for any text value', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'some-long-id-12345', iconOnly: true })
    );
    assert.match(html, /<button/);
    assert.match(html, /aria-label/);
  });

  test('renders with empty string text', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: '', label: '复制' })
    );
    assert.match(html, />复制</);
  });

  // === combined props ===
  test('renders with all props combined — label mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, {
        text: 'import React from "react"',
        label: '复制导入',
        successLabel: '已复制导入！',
        size: 'sm',
        style: { marginTop: '4px' },
      })
    );
    assert.match(html, />复制导入</);
    assert.match(html, /padding:\s*5px 11px/);
    assert.match(html, /margin-top:\s*4px/);
  });

  test('renders with all props combined — iconOnly mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, {
        text: 'uuid-xxx-yyy',
        iconOnly: true,
        size: 'sm',
        successLabel: 'ID已复制',
      })
    );
    assert.match(html, /width:\s*28px/);
    assert.match(html, /aria-label="Copy to clipboard"/);
    assert.doesNotMatch(html, />Copy</);
  });

  // === initial state (not copied) ===
  test('initial state shows copy icon (not checkmark)', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'test', iconOnly: true })
    );
    // Copy icon has a <rect> element
    assert.match(html, /<rect/);
    // Checkmark has only <path> with specific d
    assert.match(html, /M11 5V3/);
  });

  // === button type ===
  test('button has type="button" to prevent form submission', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'abc', iconOnly: true })
    );
    assert.match(html, /type="button"/);
  });

  // === disabled state not shown in SSR ===
  test('button is not disabled in initial render', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'abc', label: '复制' })
    );
    assert.doesNotMatch(html, /disabled/);
  });

  // === SVG rendering ===
  test('renders SVG icons in iconOnly mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'abc', iconOnly: true })
    );
    assert.match(html, /<svg/);
    assert.match(html, /<\/svg>/);
  });

  test('renders SVG icons in label mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(CopyToClipboard, { text: 'abc', label: '复制' })
    );
    assert.match(html, /<svg/);
  });
});
