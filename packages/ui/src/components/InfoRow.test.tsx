import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { InfoRow, ConfirmDialog } = require('./InfoRow');

/* ─── InfoRow ─── */

describe('InfoRow', () => {
  test('renders label and value', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoRow, { label: 'Name', value: 'Tree' })
    );
    assert.match(html, /Name/);
    assert.match(html, /Tree/);
  });

  test('renders ReactNode value', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoRow, {
        label: 'Status',
        value: React.createElement('span', { 'data-testid': 'active' }, 'Active'),
      })
    );
    assert.match(html, /data-testid="active"/);
    assert.match(html, /Active/);
  });

  test('applies custom colors via style attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoRow, {
        label: 'Label',
        value: 'Value',
        labelColor: '#ff0000',
        valueColor: '#00ff00',
      })
    );
    assert.match(html, /color:#ff0000/);
    assert.match(html, /color:#00ff00/);
  });

  test('applies default dark palette', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoRow, { label: 'Label', value: 'Value' })
    );
    assert.match(html, /color:#94a3b8/);
    assert.match(html, /color:#f8fafc/);
  });

  test('applies custom font sizes', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoRow, {
        label: 'Label',
        value: 'Value',
        labelFontSize: 18,
        valueFontSize: 20,
      })
    );
    assert.match(html, /font-size:18px/);
    assert.match(html, /font-size:20px/);
  });

  test('applies default font sizes', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoRow, { label: 'Label', value: 'Value' })
    );
    assert.match(html, /font-size:13px/);
    assert.match(html, /font-size:14px/);
  });

  test('applies custom gap', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoRow, { label: 'Label', value: 'Value', gap: 12 })
    );
    assert.match(html, /margin-bottom:12px/);
  });

  test('renders numeric value as string', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoRow, { label: 'Count', value: 42 })
    );
    assert.match(html, /42/);
  });

  test('renders with empty value', () => {
    const html = renderToStaticMarkup(
      React.createElement(InfoRow, { label: 'Empty', value: '' })
    );
    assert.match(html, /Empty/);
  });
});

/* ─── ConfirmDialog ─── */

describe('ConfirmDialog', () => {
  test('renders nothing when open is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfirmDialog, {
        open: false,
        title: 'Test',
        message: 'msg',
        onConfirm: () => {},
        onCancel: () => {},
      })
    );
    // Should render empty
    assert.equal(html, '');
  });

  test('renders title and message when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfirmDialog, {
        open: true,
        title: 'Delete Item',
        message: 'Are you sure?',
        onConfirm: () => {},
        onCancel: () => {},
      })
    );
    assert.match(html, /Delete Item/);
    assert.match(html, /Are you sure\?/);
  });

  test('renders default button labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfirmDialog, {
        open: true,
        title: 'T',
        message: 'M',
        onConfirm: () => {},
        onCancel: () => {},
      })
    );
    assert.match(html, />Confirm</);
    assert.match(html, />Cancel</);
  });

  test('renders custom button labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfirmDialog, {
        open: true,
        title: 'T',
        message: 'M',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
        onConfirm: () => {},
        onCancel: () => {},
      })
    );
    assert.match(html, />Yes</);
    assert.match(html, />No</);
  });

  test('danger variant uses red background', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfirmDialog, {
        open: true,
        title: 'T',
        message: 'M',
        variant: 'danger',
        onConfirm: () => {},
        onCancel: () => {},
      })
    );
    assert.match(html, /background:#ef4444/);
  });

  test('default variant uses blue background', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfirmDialog, {
        open: true,
        title: 'T',
        message: 'M',
        variant: 'default',
        onConfirm: () => {},
        onCancel: () => {},
      })
    );
    assert.match(html, /background:#3b82f6/);
  });

  test('loading state shows Loading text', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfirmDialog, {
        open: true,
        title: 'T',
        message: 'M',
        loading: true,
        onConfirm: () => {},
        onCancel: () => {},
      })
    );
    assert.match(html, />Loading.../);
    assert.match(html, /opacity:0\.6/);
  });

  test('renders backdrop overlay with onClick handler', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfirmDialog, {
        open: true,
        title: 'T',
        message: 'M',
        onConfirm: () => {},
        onCancel: () => {},
      })
    );
    // Has fixed positioning backdrop
    assert.match(html, /position:fixed/);
    assert.match(html, /background:rgba\(0,0,0,0\.5\)/);
  });

  test('renders dialog content card', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfirmDialog, {
        open: true,
        title: 'T',
        message: 'M',
        onConfirm: () => {},
        onCancel: () => {},
      })
    );
    assert.match(html, /background:#1e293b/);
    assert.match(html, /border-radius:16px/);
  });

  test('has flexbox button layout', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfirmDialog, {
        open: true,
        title: 'T',
        message: 'M',
        onConfirm: () => {},
        onCancel: () => {},
      })
    );
    assert.match(html, /justify-content:flex-end/);
  });
});
