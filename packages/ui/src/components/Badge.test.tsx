import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT +
    '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { Badge } = require('./Badge');

describe('Badge', () => {
  // ── Basic rendering ──
  test('renders with numeric children', () => {
    const html = renderToStaticMarkup(React.createElement(Badge, { 'data-testid': 'b' }, '5'));
    assert.ok(html.includes('5'));
  });

  test('renders with text children', () => {
    const html = renderToStaticMarkup(React.createElement(Badge, { 'data-testid': 'b' }, 'New'));
    assert.ok(html.includes('New'));
  });

  test('renders dot when dot=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { dot: true, 'data-testid': 'b' }),
    );
    // Dot mode: no text content
    assert.ok(!html.includes('>0<'));
    assert.ok(!html.includes('>undefined<'));
    assert.ok(html.includes('data-testid="b"'));
  });

  test('does not render badge content when visible=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { visible: false, 'data-testid': 'b' }, '5'),
    );
    // visible=false causes the component to return null, so the wrapper span should NOT be in the HTML
    assert.ok(!html.includes('data-testid="b"'));
  });

  // ── Overflow ──
  test('clamps numeric children over overflowCount', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { overflowCount: 99, 'data-testid': 'b' }, '100'),
    );
    assert.ok(html.includes('99+'));
  });

  test('does not clamp numeric children within overflowCount', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { overflowCount: 99, 'data-testid': 'b' }, '42'),
    );
    assert.ok(html.includes('42'));
    assert.ok(!html.includes('+'));
  });

  test('uses default overflowCount of 99', () => {
    const html = renderToStaticMarkup(React.createElement(Badge, { 'data-testid': 'b' }, '150'));
    assert.ok(html.includes('99+'));
  });

  // ── Variants ──
  test('renders error variant by default', () => {
    const html = renderToStaticMarkup(React.createElement(Badge, { 'data-testid': 'b' }, '1'));
    assert.ok(html.includes('#ef4444'));
  });

  test('renders primary variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { variant: 'primary', 'data-testid': 'b' }, '1'),
    );
    assert.ok(html.includes('#3b82f6'));
  });

  test('renders success variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { variant: 'success', 'data-testid': 'b' }, '1'),
    );
    assert.ok(html.includes('#22c55e'));
  });

  test('renders warning variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { variant: 'warning', 'data-testid': 'b' }, '1'),
    );
    assert.ok(html.includes('#f59e0b'));
  });

  test('renders info variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { variant: 'info', 'data-testid': 'b' }, '1'),
    );
    assert.ok(html.includes('#06b6d4'));
  });

  test('renders purple variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { variant: 'purple', 'data-testid': 'b' }, '1'),
    );
    assert.ok(html.includes('#a855f7'));
  });

  // ── Sizes ──
  test('renders sm size with correct dimensions', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { size: 'sm', 'data-testid': 'b' }, '3'),
    );
    // sm: minWidth 16, height 16
    assert.ok(html.includes('min-width:16px'));
    assert.ok(html.includes('height:16px'));
  });

  test('renders md size (default)', () => {
    const html = renderToStaticMarkup(React.createElement(Badge, { 'data-testid': 'b' }, '3'));
    assert.ok(html.includes('min-width:20px'));
    assert.ok(html.includes('height:20px'));
  });

  test('renders lg size', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { size: 'lg', 'data-testid': 'b' }, '3'),
    );
    assert.ok(html.includes('min-width:24px'));
    assert.ok(html.includes('height:24px'));
  });

  // ── Standalone mode ──
  test('renders standalone without absolute positioning', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { standalone: true, 'data-testid': 'b' }, '3'),
    );
    assert.ok(!html.includes('position:absolute'));
    assert.ok(html.includes('3'));
  });

  test('non-standalone badge uses absolute positioning', () => {
    const html = renderToStaticMarkup(React.createElement(Badge, { 'data-testid': 'b' }, '3'));
    assert.ok(html.includes('position:absolute'));
  });

  // ── Placements ──
  test('renders top-right placement by default', () => {
    const html = renderToStaticMarkup(React.createElement(Badge, { 'data-testid': 'b' }, '3'));
    assert.ok(html.includes('translate(50%, -50%)'));
  });

  test('renders top-left placement', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { placement: 'top-left', 'data-testid': 'b' }, '3'),
    );
    assert.ok(html.includes('translate(-50%, -50%)'));
  });

  test('renders bottom-right placement', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { placement: 'bottom-right', 'data-testid': 'b' }, '3'),
    );
    assert.ok(html.includes('translate(50%, 50%)'));
  });

  test('renders bottom-left placement', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { placement: 'bottom-left', 'data-testid': 'b' }, '3'),
    );
    assert.ok(html.includes('translate(-50%, 50%)'));
  });

  // ── Offset ──
  test('applies offset to transform', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { offset: { x: 4, y: -2 }, 'data-testid': 'b' }, '3'),
    );
    assert.ok(html.includes('4px') && html.includes('-2px'));
  });

  // ── data-testid ──
  test('uses data-testid prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { 'data-testid': 'notification-badge' }, '3'),
    );
    assert.ok(html.includes('data-testid="notification-badge"'));
  });

  // ── className ──
  test('passes className to badge element', () => {
    const html = renderToStaticMarkup(
      React.createElement(Badge, { className: 'my-badge', 'data-testid': 'b' }, '3'),
    );
    assert.ok(html.includes('my-badge'));
  });
});
