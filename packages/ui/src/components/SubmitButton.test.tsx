import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { SubmitButton } = require('./SubmitButton');
import type { SubmitButtonVariant } from './SubmitButton';

// ForwardRef components need .render() for plain function-style testing
function render(props: Record<string, unknown>, ref?: React.Ref<HTMLButtonElement>) {
  return (SubmitButton as any).render(props, ref ?? null);
}

test('SubmitButton: renders default label "提交"', () => {
  const result = render({});
  const props = result.props as Record<string, unknown>;
  const children = props.children as React.ReactNode[];
  assert.ok(Array.isArray(children));
  // children[0] is "提交" (label text), children[1] is <style>
  assert.equal(children[0], '提交');
});

test('SubmitButton: renders custom label', () => {
  const result = render({ label: '保存' });
  const props = result.props as Record<string, unknown>;
  const children = props.children as React.ReactNode[];
  assert.equal(children[0], '保存');
});

test('SubmitButton: renders loading state with spinner and loadingLabel', () => {
  const result = render({ loading: true, label: '保存' });
  const props = result.props as Record<string, unknown>;
  const children = props.children as React.ReactNode[];

  // children[0] is React.Fragment wrapping [spinner-span, loadingLabel]
  assert.ok(Array.isArray(children));
  const fragment = children[0] as React.ReactElement;
  const fc = fragment.props.children as React.ReactNode[];
  assert.ok(Array.isArray(fc));
  assert.equal(fc.length, 2);
  // first is spinner span
  const spinner = fc[0] as React.ReactElement;
  assert.equal(spinner.type, 'span');
  // second is loading label text
  assert.equal(fc[1], '提交中...');
});

test('SubmitButton: renders custom loadingLabel', () => {
  const result = render({ loading: true, loadingLabel: '保存中...', label: '保存' });
  const props = result.props as Record<string, unknown>;
  const children = props.children as React.ReactNode[];
  const fragment = children[0] as React.ReactElement;
  const fc = fragment.props.children as React.ReactNode[];
  assert.equal(fc[1], '保存中...');
});

test('SubmitButton: disabled prop sets disabled attribute to true', () => {
  const result = render({ disabled: true });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.disabled, true);
});

test('SubmitButton: loading implies disabled regardless of disabled prop', () => {
  const result = render({ loading: true, disabled: false });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.disabled, true);
});

test('SubmitButton: renders children when provided (overrides label)', () => {
  const child = React.createElement('span', { key: 'custom' }, '自定义内容');
  const result = render({ children: child });
  const props = result.props as Record<string, unknown>;
  const children = props.children as React.ReactNode[];
  // children[0] should be the custom child element (not string '提交')
  const firstChild = children[0] as React.ReactElement;
  assert.ok(React.isValidElement(firstChild) || (firstChild as any)?.$$typeof);
  assert.equal(firstChild.type, 'span');
});

test('SubmitButton: children take precedence over loading label', () => {
  const child = React.createElement('span', { key: 'custom' }, '处理中请稍候');
  const result = render({ children: child, loading: true });
  const props = result.props as Record<string, unknown>;
  const children = props.children as React.ReactNode[];
  assert.equal(children[0], child);
  assert.notEqual(children[0], '提交中...');
});

test('SubmitButton: primary variant has blue background', () => {
  const result = render({});
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.background, '#1d4ed8');
});

test('SubmitButton: secondary variant has slate background', () => {
  const result = render({ variant: 'secondary' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.ok(String(style.background).includes('71, 85, 105'));
});

test('SubmitButton: danger variant has red background', () => {
  const result = render({ variant: 'danger' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.background, '#dc2626');
});

test('SubmitButton: brand variant has purple background', () => {
  const result = render({ variant: 'brand' });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.background, '#7c3aed');
});

test('SubmitButton: type defaults to submit', () => {
  const result = render({});
  const props = result.props as Record<string, unknown>;
  assert.equal(props.type, 'submit');
});

test('SubmitButton: accepts custom type button', () => {
  const result = render({ type: 'button' });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.type, 'button');
});

test('SubmitButton: accepts type reset', () => {
  const result = render({ type: 'reset' });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.type, 'reset');
});

test('SubmitButton: disabled state reduces opacity and shows wait cursor', () => {
  const result = render({ disabled: true });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.opacity, 0.7);
  assert.equal(style.cursor, 'wait');
});

test('SubmitButton: loading state also reduces opacity', () => {
  const result = render({ loading: true });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.opacity, 0.7);
});

test('SubmitButton: loading state renders spinner span element', () => {
  const result = render({ loading: true });
  const props = result.props as Record<string, unknown>;
  const children = props.children as React.ReactNode[];
  // children[0] is React.Fragment wrapping [spinner-span, loadingLabel]
  const fragment = children[0] as React.ReactElement;
  const fc = fragment.props.children as React.ReactNode[];
  const spinner = fc[0] as React.ReactElement;
  assert.equal(spinner.type, 'span');
  // Verify spinner has rotating animation style
  const spinnerStyle = spinner.props.style as React.CSSProperties;
  assert.ok(spinnerStyle.border?.toString().includes('solid'));
});

test('SubmitButton: accepts custom style overrides while keeping variant background', () => {
  const result = render({ style: { marginTop: 20, fontSize: 18 } });
  const props = result.props as Record<string, unknown>;
  const style = props.style as React.CSSProperties;
  assert.equal(style.marginTop, 20);
  assert.equal(style.fontSize, 18);
  assert.equal(style.background, '#1d4ed8');
});

test('SubmitButton: accepts className prop', () => {
  const result = render({ className: 'my-custom-btn' });
  const props = result.props as Record<string, unknown>;
  assert.equal(props.className, 'my-custom-btn');
});

test('SubmitButton: all variants assign correct style background', () => {
  const variants: Array<{ variant: SubmitButtonVariant; expected: string }> = [
    { variant: 'primary', expected: '#1d4ed8' },
    { variant: 'brand', expected: '#7c3aed' },
    { variant: 'danger', expected: '#dc2626' },
  ];
  for (const { variant, expected } of variants) {
    const result = render({ variant });
    const props = result.props as Record<string, unknown>;
    const style = props.style as React.CSSProperties;
    assert.equal(style.background, expected, `variant ${variant}`);
  }
});

test('SubmitButton: non-loading non-children renders label as direct string child', () => {
  const result = render({ label: '删除' });
  const props = result.props as Record<string, unknown>;
  const children = props.children as React.ReactNode[];
  assert.equal(typeof children[0], 'string');
  assert.equal(children[0], '删除');
});
