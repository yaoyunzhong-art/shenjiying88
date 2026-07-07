/**
 * DeliveryStatusBadge 单元测试
 * 项目测试规范: node:test + renderToStaticMarkup
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
});
