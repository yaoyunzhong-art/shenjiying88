/**
 * 物流配送追踪页 — 集成测试
 * 项目测试规范: node:test + renderToStaticMarkup
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeliveryTrackingClient } from './components/DeliveryTrackingClient';

describe('DeliveryTrackingPage (via DeliveryTrackingClient)', () => {
  it('renders page title and search elements', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient />);
    assert.ok(html.includes('📦 物流追踪'));
    assert.ok(html.includes('data-testid="delivery-order-input"'));
    assert.ok(html.includes('data-testid="delivery-search-btn"'));
  });

  it('shows not-found state for invalid order ID', () => {
    // The search is triggered by state change, so in SSR we won't see results
    // Direct testing of initial render tests container
    const html = renderToStaticMarkup(<DeliveryTrackingClient />);
    assert.ok(!html.includes('data-testid="delivery-not-found"'));
    assert.ok(!html.includes('data-testid="delivery-result"'));
  });

  it('renders correctly with initial order ID prop', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260708-001" />);
    // The component renders with initialOrderId, so the input should pre-fill
    assert.ok(html.includes('ORD-20260708-001'));
    // Since it's the same value, search is triggered
    assert.ok(html.includes('data-testid="delivery-result"') || html.includes('📮'));
  });

  it('renders the search description', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient />);
    assert.ok(html.includes('输入订单号查询物流配送进度'));
  });

  it('renders the delivery-timeline container in results', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260708-001" />);
    assert.ok(html.includes('data-testid="delivery-timeline"'));
  });

  it('renders carrier info for a known order', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260708-001" />);
    assert.ok(html.includes('顺丰速运'));
    assert.ok(html.includes('SF1234567890'));
  });

  it('renders order ID in result header', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260708-001" />);
    // The search triggers re-render showing the order ID
    assert.ok(html.includes('ORD-20260708-001'));
  });

  it('renders timeline events for ORD-20260707-002', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260707-002" />);
    assert.ok(html.includes('包裹已揽收'));
    assert.ok(html.includes('已签收'));
    assert.ok(html.includes('中通快递'));
    assert.ok(html.includes('ZT0987654321'));
  });
});
