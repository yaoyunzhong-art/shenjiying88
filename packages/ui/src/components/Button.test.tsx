import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { Button } = require('./Button');
import type { ButtonVariant, ButtonSize } from './Button';

function render(props: Record<string, unknown> = {}, ref?: React.Ref<HTMLButtonElement>) {
  return (Button as any).render(props, ref ?? null);
}

test('Button: renders children text', () => {
  const result = render({ children: '点击' });
  const props = result.props as Record<string, unknown>;
  const children = props.children as React.ReactNode[];
  // children[0] = false (loading expression), children[1] = '点击', children[2] = <style>
  const textChild = Array.isArray(children) ? children[1] : children;
  assert.equal(textChild, '点击');
});

test('Button: defaults to primary variant', () => {
  const result = render({ children: 'OK' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.background, '#1d4ed8');
});

test('Button: secondary variant has slate background', () => {
  const result = render({ children: 'OK', variant: 'secondary' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.ok(String(style.background).includes('71, 85, 105'));
});

test('Button: danger variant has red background', () => {
  const result = render({ children: 'OK', variant: 'danger' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.background, '#dc2626');
});

test('Button: ghost variant has transparent background', () => {
  const result = render({ children: 'OK', variant: 'ghost' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.background, 'transparent');
  assert.equal(style.color, '#94a3b8');
});

test('Button: outline variant has transparent bg and border', () => {
  const result = render({ children: 'OK', variant: 'outline' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.background, 'transparent');
  assert.ok(String(style.border).includes('solid'));
});

test('Button: defaults to type button', () => {
  const result = render({ children: 'OK' });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.type, 'button');
});

test('Button: accepts type submit', () => {
  const result = render({ children: 'OK', type: 'submit' });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.type, 'submit');
});

test('Button: accepts type reset', () => {
  const result = render({ children: 'OK', type: 'reset' });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.type, 'reset');
});

test('Button: disabled prop sets disabled attribute', () => {
  const result = render({ children: 'OK', disabled: true });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.disabled, true);
});

test('Button: loading implies disabled', () => {
  const result = render({ children: 'OK', loading: true, disabled: false });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.disabled, true);
});

test('Button: loading shows spinner element', () => {
  const result = render({ children: 'OK', loading: true });
  const props = result.props as Record<string, unknown>;
  const children = props.children as React.ReactNode[];
  // children[0] = spinner span, children[1] = 'OK', children[2] = <style>
  const spinner = children[0] as React.ReactElement;
  assert.equal(spinner.type, 'span');
  const spinnerStyle = spinner.props.style as React.CSSProperties;
  assert.ok(spinnerStyle.animation?.includes('m5-btn-spin'));
});

test('Button: disabled state changes cursor to not-allowed', () => {
  const result = render({ children: 'OK', disabled: true });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.cursor, 'not-allowed');
});

test('Button: sm size applies small padding/fontSize', () => {
  const result = render({ children: 'OK', size: 'sm' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.fontSize, 12);
  assert.equal(style.borderRadius, 8);
});

test('Button: md size applies medium padding', () => {
  const result = render({ children: 'OK', size: 'md' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.fontSize, 14);
  assert.equal(style.borderRadius, 10);
});

test('Button: lg size applies large padding', () => {
  const result = render({ children: 'OK', size: 'lg' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.fontSize, 16);
  assert.equal(style.borderRadius, 12);
});

test('Button: block mode sets width 100%', () => {
  const result = render({ children: 'OK', block: true });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.width, '100%');
});

test('Button: defaults to inline-flex', () => {
  const result = render({ children: 'OK' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.display, 'inline-flex');
});

test('Button: accepts custom style override', () => {
  const result = render({ children: 'OK', style: { margin: 10 } });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.margin, 10);
});

test('Button: accepts className prop', () => {
  const result = render({ children: 'OK', className: 'my-btn' });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.className, 'my-btn');
});

test('Button: renders data-testid', () => {
  const result = render({ children: 'OK', 'data-testid': 'btn-test' });
  const props = result.props as Record<string, unknown>;
  assert.equal(props['data-testid'], 'btn-test');
});

test('Button: all variants map to correct backgrounds', () => {
  const map: Array<{ variant: ButtonVariant; prefix?: string; literal?: string }> = [
    { variant: 'primary', literal: '#1d4ed8' },
    { variant: 'secondary', prefix: '71, 85, 105' },
    { variant: 'danger', literal: '#dc2626' },
    { variant: 'ghost', literal: 'transparent' },
    { variant: 'outline', literal: 'transparent' },
  ];
  for (const entry of map) {
    const result = render({ children: 'X', variant: entry.variant });
    const props = result.props as Record<string, unknown>;
    const style = props.style as React.CSSProperties;
    if (entry.literal !== undefined) {
      assert.equal(style.background, entry.literal, `variant ${entry.variant}`);
    }
    if (entry.prefix !== undefined) {
      assert.ok(
        String(style.background).includes(entry.prefix),
        `variant ${entry.variant} bg should contain ${entry.prefix}`
      );
    }
  }
});

test('Button: loading state does not call onClick', () => {
  const result = render({ children: 'OK', loading: true });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.onClick, undefined);
});

test('Button: normal state passes onClick', () => {
  const fn = () => {};
  const result = render({ children: 'OK', onClick: fn });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.onClick, fn);
});

test('Button: disabled state reduces opacity to 0.6', () => {
  const result = render({ children: 'OK', disabled: true });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.opacity, 0.6);
});

test('Button: loading state also reduces opacity to 0.6', () => {
  const result = render({ children: 'OK', loading: true });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.opacity, 0.6);
});
