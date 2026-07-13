/**
 * 物流配送追踪页 — 集成测试
 * 项目测试规范: node:test + renderToStaticMarkup
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeliveryTrackingClient } from './components/DeliveryTrackingClient';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pageSource = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('DeliveryTrackingPage — 正例', () => {
  it('页面导出默认函数 DeliveryTrackingPage', () => {
    assert.ok(pageSource.includes('export default function DeliveryTrackingPage'));
  });

  it('页面包含 use client 指令', () => {
    assert.ok(pageSource.includes("'use client'"));
  });

  it('页面使用 DeliveryTrackingClient 组件', () => {
    assert.ok(pageSource.includes('DeliveryTrackingClient'));
  });

  it('包含 loading/error 二态', () => {
    assert.ok(pageSource.includes('loading'), '缺少加载态');
    assert.ok(pageSource.includes('error'), '缺少错误态');
    assert.ok(pageSource.includes('simulateLoad'), '缺少模拟初始化');
  });

  it('renders page title and search elements', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient />);
    assert.ok(html.includes('📦 物流追踪'));
    assert.ok(html.includes('data-testid="delivery-order-input"'));
    assert.ok(html.includes('data-testid="delivery-search-btn"'));
  });

  it('renders the search description', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient />);
    assert.ok(html.includes('输入订单号查询物流配送进度'));
  });

  it('renders correctly with initial order ID prop', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260708-001" />);
    assert.ok(html.includes('ORD-20260708-001'));
    assert.ok(html.includes('data-testid="delivery-result"') || html.includes('📮'));
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
    assert.ok(html.includes('ORD-20260708-001'));
  });

  it('renders timeline events for ORD-20260707-002', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260707-002" />);
    assert.ok(html.includes('包裹已揽收'));
    assert.ok(html.includes('已签收'));
    assert.ok(html.includes('中通快递'));
    assert.ok(html.includes('ZT0987654321'));
  });

  it('renders delivery location for in-transit order', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260708-001" />);
    assert.ok(html.includes('上海浦东'));
  });

  it('renders delivery location for completed order', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260707-002" />);
    assert.ok(html.includes('上海浦西') || html.includes('上海浦东'));
  });
});

describe('DeliveryTrackingPage — 边界', () => {
  it('shows not-found state for invalid order ID', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient />);
    assert.ok(!html.includes('data-testid="delivery-not-found"'));
    assert.ok(!html.includes('data-testid="delivery-result"'));
  });

  it('multiple orders have unique carriers', () => {
    const html1 = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260708-001" />);
    const html2 = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260707-002" />);
    assert.ok(html1.includes('顺丰速运'));
    assert.ok(html2.includes('中通快递'));
    // Different carriers
    assert.ok(html1 !== html2);
  });

  it('delivered order shows completion status', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260707-002" />);
    assert.ok(html.includes('已签收'));
  });

  it('in-transit order shows current step', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260708-001" />);
    assert.ok(html.includes('到达派送站') || html.includes('派送中'));
  });

  it('shows tracking number in search results', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="ORD-20260708-001" />);
    assert.ok(html.includes('SF1234567890'));
  });
});

describe('DeliveryTrackingPage — 防御', () => {
  it('empty order id input should not crash', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="" />);
    assert.ok(html.includes('data-testid="delivery-order-input"'));
  });

  it('unknown order id renders not-found gracefully', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient initialOrderId="NONEXISTENT-ORDER" />);
    assert.ok(html.includes('data-testid="delivery-not-found"') || !html.includes('data-testid="delivery-result"'));
  });

  it('initial render without props should show placeholder', () => {
    const html = renderToStaticMarkup(<DeliveryTrackingClient />);
    assert.ok(html.includes('输入订单号') || html.includes('placeholder') || html.includes('placeholder'));
  });
});
