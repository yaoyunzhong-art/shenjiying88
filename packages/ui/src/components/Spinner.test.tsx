import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';

// Minimal SSR-like render for functional components
function renderToString(el: any): string {
  if (typeof el === 'string' || typeof el === 'number') return String(el);
  if (el == null) return '';
  if (Array.isArray(el)) return el.map(renderToString).join('');
  if (typeof el === 'object' && el.$$typeof) {
    const { type, props } = el;
    if (typeof type === 'function') return renderToString(type(props));
    const children = props.children;
    const out = Array.isArray(children) ? children.map(renderToString).join('') : renderToString(children);
    return out;
  }
  return '';
}

let Spinner: any;
const h = React.createElement;

describe('Spinner @m5/ui', async () => {
  const mod = await import('./Spinner');
  Spinner = mod.Spinner;

  it('renders with default props - contains keyframe style', () => {
    const el = h(Spinner);
    const html = renderToString(el);
    assert.ok(html.includes('spinner-rotate'), 'should include rotation keyframes');
  });

  it('renders all sizes', () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      const el = h(Spinner, { size });
      assert.ok(renderToString(el), `size=${size} renders`);
    }
  });

  it('renders label text when provided', () => {
    const el = h(Spinner, { label: '数据加载中...' });
    const html = renderToString(el);
    assert.ok(html.includes('数据加载中...'), 'should include label text');
  });

  it('renders all variants', () => {
    for (const variant of ['default', 'primary', 'inverted'] as const) {
      const el = h(Spinner, { variant });
      assert.ok(renderToString(el), `variant=${variant} renders`);
    }
  });

  it('renders empty label without crash', () => {
    const el = h(Spinner, { label: '' });
    assert.ok(renderToString(el), 'empty label renders');
  });

  it('renders without label', () => {
    const el = h(Spinner);
    assert.ok(renderToString(el), 'no-label renders');
  });
});
