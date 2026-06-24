import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ToastContainer, useToast } = require('./Toast');

describe('ToastContainer', () => {
  test('renders multiple toasts', () => {
    const toasts = [
      { id: '1', message: 'Toast 1', variant: 'success' as const, durationMs: 4000, createdAt: Date.now() },
      { id: '2', message: 'Toast 2', variant: 'error' as const, durationMs: 4000, createdAt: Date.now() },
    ];
    const html = renderToStaticMarkup(
      React.createElement(ToastContainer, { toasts, onDismiss: () => {} }),
    );
    assert.match(html, /Toast 1/);
    assert.match(html, /Toast 2/);
  });

  test('shows overflow message exceeding maxVisible', () => {
    const toasts = Array.from({ length: 8 }, (_, i) => ({
      id: `${i}`,
      message: `Toast ${i}`,
      variant: 'info' as const,
      durationMs: 4000,
      createdAt: Date.now(),
    }));
    const html = renderToStaticMarkup(
      React.createElement(ToastContainer, { toasts, onDismiss: () => {}, maxVisible: 5 }),
    );
    assert.match(html, /还有 3 条通知/);
    assert.doesNotMatch(html, /Toast 7/);
  });

  test('renders with custom position', () => {
    const toasts = [{ id: '1', message: 'T', variant: 'info' as const, durationMs: 4000, createdAt: Date.now() }];
    const html = renderToStaticMarkup(
      React.createElement(ToastContainer, { toasts, onDismiss: () => {}, position: 'bottom-left' }),
    );
    assert.match(html, /bottom:20px/);
    assert.match(html, /left:20px/);
  });

  test('renders success variant with correct colors', () => {
    const toasts = [{ id: '1', message: 'Done', variant: 'success' as const, durationMs: 4000, createdAt: Date.now() }];
    const html = renderToStaticMarkup(
      React.createElement(ToastContainer, { toasts, onDismiss: () => {} }),
    );
    assert.match(html, /rgba\(22, 101, 52/);
    assert.match(html, /#bbf7d0/);
  });

  test('renders error variant with correct colors', () => {
    const toasts = [{ id: '1', message: 'Fail', variant: 'error' as const, durationMs: 4000, createdAt: Date.now() }];
    const html = renderToStaticMarkup(
      React.createElement(ToastContainer, { toasts, onDismiss: () => {} }),
    );
    assert.match(html, /rgba\(127, 29, 29/);
    assert.match(html, /#fecaca/);
  });

  test('renders warning variant with correct colors', () => {
    const toasts = [{ id: '1', message: 'Warn', variant: 'warning' as const, durationMs: 4000, createdAt: Date.now() }];
    const html = renderToStaticMarkup(
      React.createElement(ToastContainer, { toasts, onDismiss: () => {} }),
    );
    assert.match(html, /rgba\(113, 63, 18/);
    assert.match(html, /#fde68a/);
  });

  test('renders info variant with correct colors', () => {
    const toasts = [{ id: '1', message: 'Info', variant: 'info' as const, durationMs: 4000, createdAt: Date.now() }];
    const html = renderToStaticMarkup(
      React.createElement(ToastContainer, { toasts, onDismiss: () => {} }),
    );
    assert.match(html, /rgba\(30, 64, 175/);
    assert.match(html, /#bfdbfe/);
  });

  test('has alert role on toast items', () => {
    const toasts = [{ id: '1', message: 'Alert me', variant: 'warning' as const, durationMs: 4000, createdAt: Date.now() }];
    const html = renderToStaticMarkup(
      React.createElement(ToastContainer, { toasts, onDismiss: () => {} }),
    );
    assert.match(html, /role="alert"/);
  });

  test('renders slide-in animation style', () => {
    const toasts = [{ id: '1', message: 'T', variant: 'info' as const, durationMs: 4000, createdAt: Date.now() }];
    const html = renderToStaticMarkup(
      React.createElement(ToastContainer, { toasts, onDismiss: () => {} }),
    );
    assert.match(html, /toast-slide-in/);
  });

  test('renders close button per toast', () => {
    const toasts = [{ id: '1', message: 'T', variant: 'info' as const, durationMs: 4000, createdAt: Date.now() }];
    const html = renderToStaticMarkup(
      React.createElement(ToastContainer, { toasts, onDismiss: () => {} }),
    );
    assert.match(html, /关闭通知/);
  });
});

describe('useToast Wrapper Smoke Test', () => {
  test('renders component with useToast hook without crash', () => {
    function Tester() {
      const { toasts, success, error, warning, info, dismiss } = useToast();
      return React.createElement('div', null,
        React.createElement(ToastContainer, { toasts, onDismiss: dismiss }),
        React.createElement('button', { onClick: () => success('OK') }, 'Success'),
        React.createElement('button', { onClick: () => error('Bad') }, 'Error'),
        React.createElement('button', { onClick: () => warning('Careful') }, 'Warning'),
        React.createElement('button', { onClick: () => info('Note') }, 'Info'),
      );
    }
    const html = renderToStaticMarkup(React.createElement(Tester));
    // Should render without errors
    assert.match(html, /Success/);
    assert.match(html, /Error/);
    assert.match(html, /Warning/);
    assert.match(html, /Info/);
  });
});
