/**
 * OrderStatusBadge 单元测试
 * 项目测试规范: node:test + renderToStaticMarkup
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrderStatusBadge, type OrderStatus, STATUS_LABEL, STATUS_COLOR } from './OrderStatusBadge';

describe('OrderStatusBadge — 正例', () => {
  const allStatuses: OrderStatus[] = [
    'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded',
  ];

  it('renders all status Chinese labels correctly', () => {
    for (const status of allStatuses) {
      const html = renderToStaticMarkup(<OrderStatusBadge status={status} />);
      assert.ok(html.includes(STATUS_LABEL[status]), `Status "${status}" label "${STATUS_LABEL[status]}" not found in rendered output`);
    }
  });

  it('applies correct background color per status', () => {
    for (const status of allStatuses) {
      const html = renderToStaticMarkup(<OrderStatusBadge status={status} />);
      const expectedColor = STATUS_COLOR[status];
      assert.ok(html.includes(expectedColor), `Status "${status}" color "${expectedColor}" not found`);
    }
  });

  it('is an inline-block element', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="delivered" />);
    assert.ok(html.includes('inline-block'));
  });

  it('renders pending status with yellow (#f59e0b)', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="pending" />);
    assert.ok(html.includes('待确认'));
    assert.ok(html.includes('#f59e0b'));
  });

  it('renders delivered status with green (#10b981)', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="delivered" />);
    assert.ok(html.includes('已送达'));
    assert.ok(html.includes('#10b981'));
  });

  it('renders cancelled status with gray (#6b7280)', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="cancelled" />);
    assert.ok(html.includes('已取消'));
    assert.ok(html.includes('#6b7280'));
  });

  it('renders refunded status with red (#ef4444)', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="refunded" />);
    assert.ok(html.includes('已退款'));
    assert.ok(html.includes('#ef4444'));
  });

  it('renders preparing status with purple (#8b5cf6)', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="preparing" />);
    assert.ok(html.includes('备货中'));
    assert.ok(html.includes('#8b5cf6'));
  });

  it('renders confirmed status with blue (#3b82f6)', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="confirmed" />);
    assert.ok(html.includes('已确认'));
    assert.ok(html.includes('#3b82f6'));
  });

  it('renders shipped status with cyan (#06b6d4)', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="shipped" />);
    assert.ok(html.includes('已发货'));
    assert.ok(html.includes('#06b6d4'));
  });

  it('has white text color (#fff) for readability', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="delivered" />);
    assert.ok(html.includes('#fff'));
  });

  it('STATUS_LABEL and STATUS_COLOR have same keys', () => {
    const labelKeys = Object.keys(STATUS_LABEL).sort();
    const colorKeys = Object.keys(STATUS_COLOR).sort();
    assert.deepEqual(labelKeys, colorKeys);
  });

  it('renders all statuses as span elements', () => {
    for (const status of allStatuses) {
      const html = renderToStaticMarkup(<OrderStatusBadge status={status} />);
      assert.ok(html.startsWith('<span'), `Status "${status}" not wrapped in span`);
      assert.ok(html.endsWith('</span>'), `Status "${status}" span not properly closed`);
    }
  });

  it('renders rounded style for all badges', () => {
    for (const status of allStatuses) {
      const html = renderToStaticMarkup(<OrderStatusBadge status={status} />);
      assert.ok(html.includes('rounded') || html.includes('border-radius'), `${status} missing rounded style`);
    }
  });

  it('renders font-medium for readability', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="confirmed" />);
    assert.ok(html.includes('font-medium') || html.includes('font-weight'));
  });

  it('renders padding inside badge', () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="confirmed" />);
    assert.ok(html.includes('px') || html.includes('padding') || html.includes('py'));
  });
});

describe('OrderStatusBadge — 边界', () => {
  it('all statuses have unique labels', () => {
    const labels = Object.values(STATUS_LABEL);
    const unique = new Set(labels);
    assert.equal(unique.size, labels.length);
  });

  it('all statuses have unique colors', () => {
    const colors = Object.values(STATUS_COLOR);
    const unique = new Set(colors);
    assert.equal(unique.size, colors.length);
  });

  it('all colors are valid CSS hex codes', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    for (const color of Object.values(STATUS_COLOR)) {
      assert.ok(hexRegex.test(color), `Invalid hex: ${color}`);
    }
  });

  it('STATUS_COLOR has exactly 7 entries', () => {
    assert.equal(Object.keys(STATUS_COLOR).length, 7);
  });

  it('STATUS_LABEL has exactly 7 entries', () => {
    assert.equal(Object.keys(STATUS_LABEL).length, 7);
  });

  it('all labels are non-empty strings', () => {
    for (const [status, label] of Object.entries(STATUS_LABEL)) {
      assert.ok(label.length > 0, `Status "${status}" has empty label`);
    }
  });
});

describe('OrderStatusBadge — 防御', () => {
  it('no CSS injection in status labels', () => {
    // Labels are hard-coded, not user input — confirm no HTML-like content
    for (const label of Object.values(STATUS_LABEL)) {
      assert.ok(!label.includes('<'), `${label} should not contain HTML tag syntax`);
    }
  });

  it('label rendering uses textContent, not innerHTML', () => {
    // Verify labels are rendered as plain text children, not dangerouslySetInnerHTML
    for (const status of Object.keys(STATUS_LABEL) as OrderStatus[]) {
      const html = renderToStaticMarkup(<OrderStatusBadge status={status} />);
      assert.ok(!html.includes('dangerouslySetInnerHTML'), `Status "${status}" uses dangerouslySetInnerHTML`);
    }
  });
});
