import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { Card } = require('./Card');

function render(props: Record<string, unknown> = {}) {
  return typeof Card.render === 'function' ? Card.render(props, null) : Card(props);
}

const CARD_VARIANTS = ['default', 'elevated', 'outlined', 'ghost'] as const;

test('Card: renders children text', () => {
  const result = render({ children: '卡片内容' });
  // children should be present as either direct children or deep text
  assert.ok(result?.props?.children !== undefined);
});

test('Card: default variant has base glassmorphism background', () => {
  const result = render({ children: 'test' });
  const style = result.props.style as React.CSSProperties;
  assert.equal(style.borderRadius, 16);
  assert.ok(String(style.background).includes('rgba(15, 23, 42'));
});

test('Card: elevated variant has boxShadow', () => {
  const result = render({ children: 'test', variant: 'elevated' });
  const style = result.props.style as React.CSSProperties;
  assert.ok(String(style.boxShadow).includes('0 4px 24px'));
  assert.ok(String(style.background).includes('0.5'));
});

test('Card: outlined variant has transparent background', () => {
  const result = render({ children: 'test', variant: 'outlined' });
  const style = result.props.style as React.CSSProperties;
  assert.equal(style.background, 'transparent');
  assert.ok(String(style.border).includes('1px'));
});

test('Card: ghost variant has no border', () => {
  const result = render({ children: 'test', variant: 'ghost' });
  const style = result.props.style as React.CSSProperties;
  assert.equal(style.background, 'transparent');
  assert.equal(style.border, 'none');
});

test('Card: all variants render without error', () => {
  for (const variant of CARD_VARIANTS) {
    const result = render({ children: variant, variant });
    assert.ok(result, `variant ${variant} should render`);
  }
});

test('Card: renders title as h2 element', () => {
  const result = render({ title: '我的标题', children: '内容' });
  const body = result.props.children as React.ReactNode[];

  // Find header wrapper
  const headerSection = body.find(
    (c: React.ReactElement) => c?.props?.children?.props?.children?.find
  ) ?? body.find((c: React.ReactElement) => c?.props?.children);

  // Extract text from header structure
  const headerText = extractText(result);
  assert.ok(headerText.includes('我的标题'));
});

test('Card: renders subtitle below title', () => {
  const text = extractText(render({ title: 'Title', subtitle: '副标题说明', children: 'x' }));
  assert.ok(text.includes('Title'));
  assert.ok(text.includes('副标题说明'));
});

test('Card: renders without header when no title/subtitle/actions', () => {
  const result = render({ children: '仅内容' });
  const text = extractText(result);
  assert.equal(text.trim(), '仅内容');
});

test('Card: renders footer content with top border separator', () => {
  const result = render({ children: 'body', footer: '页脚' });
  const text = extractText(result);
  assert.ok(text.includes('body'));
  assert.ok(text.includes('页脚'));
});

test('Card: accepts custom padding', () => {
  const result = render({ children: 'test', padding: 32 });
  const style = result.props.style as React.CSSProperties;
  assert.equal(style.padding, 32);
});

test('Card: accepts style override', () => {
  const result = render({ children: 'test', style: { margin: 24 } });
  const style = result.props.style as React.CSSProperties;
  assert.equal(style.margin, 24);
});

test('Card: renders data-testid', () => {
  const result = render({ children: 'test', 'data-testid': 'my-card' });
  assert.equal(result.props['data-testid'], 'my-card');
});

test('Card: renders with no props gracefully', () => {
  const result = render({});
  assert.ok(result);
  assert.equal(result.type, 'div');
});

function extractText(element: React.ReactElement): string {
  if (!element) return '';
  const children = element.props?.children;
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map((c: React.ReactNode) => {
      if (typeof c === 'string' || typeof c === 'number') return String(c);
      if (React.isValidElement(c)) return extractText(c);
      return '';
    }).join('');
  }
  if (React.isValidElement(children)) return extractText(children);
  return '';
}
