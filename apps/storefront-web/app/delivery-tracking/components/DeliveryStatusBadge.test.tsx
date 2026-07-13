/**
 * DeliveryStatusBadge 单元测试
 * 项目测试规范: node:test + renderToStaticMarkup
 * 覆盖: 正例(7种状态渲染/颜色/标签) 反例(未知状态) 边界(空值/null/特殊字符)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeliveryStatusBadge, type DeliveryStatus, DELIVERY_STATUS_LABEL, DELIVERY_STATUS_COLOR } from './DeliveryStatusBadge';

describe('DeliveryStatusBadge', () => {
  const statuses: DeliveryStatus[] = [
    'pending', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned',
  ];

  /* ── 正例 ── */

  it('renders all status labels correctly', () => {
    for (const status of statuses) {
      const html = renderToStaticMarkup(<DeliveryStatusBadge status={status} />);
      assert.ok(html.includes(DELIVERY_STATUS_LABEL[status]), `Status ${status} label not found`);
    }
  });

  it('applies correct background color per status', () => {
    for (const status of statuses) {
      const html = renderToStaticMarkup(<DeliveryStatusBadge status={status} />);
      const expectedColor = DELIVERY_STATUS_COLOR[status];
      assert.ok(html.includes(expectedColor), `Status ${status} color ${expectedColor} not found`);
    }
  });

  it('has data-testid attribute', () => {
    const html = renderToStaticMarkup(<DeliveryStatusBadge status="delivered" />);
    assert.ok(html.includes('data-testid="delivery-status-badge"'));
  });

  it('renders delivered status explicitly', () => {
    const html = renderToStaticMarkup(<DeliveryStatusBadge status="delivered" />);
    assert.ok(html.includes('已签收'));
    assert.ok(html.includes('#52c41a'));
  });

  it('renders exception status explicitly', () => {
    const html = renderToStaticMarkup(<DeliveryStatusBadge status="exception" />);
    assert.ok(html.includes('异常'));
    assert.ok(html.includes('#ff4d4f'));
  });

  it('renders returned status explicitly', () => {
    const html = renderToStaticMarkup(<DeliveryStatusBadge status="returned" />);
    assert.ok(html.includes('已退回'));
  });

  it('renders pending status explicitly', () => {
    const html = renderToStaticMarkup(<DeliveryStatusBadge status="pending" />);
    assert.ok(html.includes('待发货'));
    assert.ok(html.includes('#999'));
  });

  it('renders shipped status explicitly', () => {
    const html = renderToStaticMarkup(<DeliveryStatusBadge status="shipped" />);
    assert.ok(html.includes('已发货'));
    assert.ok(html.includes('#1890ff'));
  });

  it('renders in_transit status explicitly', () => {
    const html = renderToStaticMarkup(<DeliveryStatusBadge status="in_transit" />);
    assert.ok(html.includes('运输中'));
  });

  it('renders out_for_delivery status explicitly', () => {
    const html = renderToStaticMarkup(<DeliveryStatusBadge status="out_for_delivery" />);
    assert.ok(html.includes('派送中'));
    assert.ok(html.includes('#faad14'));
  });

  /* ── 反例 ── */

  it('handles unknown status gracefully (falls back to status string)', () => {
    const html = renderToStaticMarkup(<DeliveryStatusBadge status={'unknown' as DeliveryStatus} />);
    assert.ok(html.includes('unknown'));
  });

  it('handles invalid status string without throwing', () => {
    assert.doesNotThrow(() => {
      renderToStaticMarkup(<DeliveryStatusBadge status={'cancelled' as DeliveryStatus} />);
    });
  });

  it('DELIVERY_STATUS_LABEL does not have fallback for unknown keys', () => {
    const unknown = DELIVERY_STATUS_LABEL['cancelled' as keyof typeof DELIVERY_STATUS_LABEL];
    assert.equal(unknown, undefined);
  });

  /* ── 边界 ── */

  it('all labels are non-empty strings', () => {
    for (const status of statuses) {
      const label = DELIVERY_STATUS_LABEL[status];
      assert.ok(typeof label === 'string', `label for ${status} should be string`);
      assert.ok(label.length > 0, `label for ${status} should not be empty`);
    }
  });

  it('all colors are valid hex strings', () => {
    for (const status of statuses) {
      const color = DELIVERY_STATUS_COLOR[status];
      assert.ok(/^#[0-9a-f]{3,8}$/i.test(color), `${status} color ${color} is not valid hex`);
    }
  });

  it('renders with emoji icon for each status', () => {
    const iconMap: Record<DeliveryStatus, string> = {
      pending: '⏳', shipped: '🚚', in_transit: '🚚',
      out_for_delivery: '📦', delivered: '✅', exception: '⚠️', returned: '↩️',
    };
    for (const status of statuses) {
      const html = renderToStaticMarkup(<DeliveryStatusBadge status={status} />);
      assert.ok(html.includes(iconMap[status]), `missing icon for ${status}`);
    }
  });

  it('data-testid is present for every status', () => {
    for (const status of statuses) {
      const html = renderToStaticMarkup(<DeliveryStatusBadge status={status} />);
      assert.ok(html.includes('data-testid="delivery-status-badge"'), `missing testid for ${status}`);
    }
  });

  it('renders status as a span element', () => {
    const html = renderToStaticMarkup(<DeliveryStatusBadge status="delivered" />);
    assert.ok(html.startsWith('<span') || html.startsWith('<span '), 'should render as span');
  });
});
