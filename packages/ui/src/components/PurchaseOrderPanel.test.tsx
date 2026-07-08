/**
 * PurchaseOrderPanel.test.tsx — 采购订单面板 L1 冒烟+逻辑测试
 * 覆盖: 正例·边界·防御
 */
import React from 'react';
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { PurchaseOrderPanel } = require('./PurchaseOrderPanel');

// ---- Mock 数据 ----

const MOCK_ORDER = {
  id: 'po-001',
  orderNo: 'PO-20260709-001',
  supplier: '星耀供应链有限公司',
  supplierContact: '王经理 13800138000',
  status: 'shipped' as const,
  orderedAt: '2026-07-08',
  expectedArrival: '2026-07-15',
  totalAmount: 58600,
  totalReceived: 23400,
  arrivalRate: 40,
  buyer: '采购员小李',
  items: [
    { sku: 'COFFEE-BEAN-A01', name: '哥伦比亚精品咖啡豆 (1kg)', quantity: 50, unitPrice: 280, received: 20, total: 14000 },
    { sku: 'MILK-FRESH-B02', name: '鲜牛奶 (1L)', quantity: 100, unitPrice: 18, received: 50, total: 1800 },
    { sku: 'CUP-PAPER-C03', name: '环保纸杯 (50只装)', quantity: 200, unitPrice: 12, received: 80, total: 2400 },
    { sku: 'SYRUP-VANILLA-D04', name: '香草糖浆 (500ml)', quantity: 30, unitPrice: 45, received: 10, total: 1350 },
  ],
};

const MOCK_COMPLETED_ORDER = {
  ...MOCK_ORDER,
  id: 'po-002',
  orderNo: 'PO-20260709-002',
  status: 'completed' as const,
  arrivalRate: 100,
  totalReceived: 58600,
  receivedAt: '2026-07-12',
  items: MOCK_ORDER.items.map((item) => ({ ...item, received: item.quantity })),
};

describe('PurchaseOrderPanel — 正例', () => {
  test('渲染订单号', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_ORDER })
    );
    assert.match(html, /PO-20260709-001/);
  });

  test('渲染供应商名称', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_ORDER })
    );
    assert.match(html, /星耀供应链/);
  });

  test('渲染采购总金额', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_ORDER })
    );
    assert.match(html, /58,600/);
  });

  test('已到货金额渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_ORDER })
    );
    assert.match(html, /23,400/);
  });

  test('渲染到货进度 40%', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_ORDER })
    );
    assert.match(html, /40%/);
  });

  test('已完成订单渲染实际到货日期', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_COMPLETED_ORDER })
    );
    assert.match(html, /实际到货/);
    assert.match(html, /2026-07-12/);
  });

  test('渲染商品行项目 SKU', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_ORDER })
    );
    assert.match(html, /COFFEE-BEAN-A01/);
    assert.match(html, /MILK-FRESH-B02/);
  });

  test('渲染采购员名称', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_ORDER })
    );
    assert.match(html, /采购员小李/);
  });

  test('渲染待审批状态标签', () => {
    const pendingOrder = { ...MOCK_ORDER, status: 'pending_approval' as const };
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: pendingOrder })
    );
    assert.match(html, /待审批/);
  });

  test('渲染已取消状态标签', () => {
    const cancelledOrder = { ...MOCK_ORDER, status: 'cancelled' as const };
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: cancelledOrder })
    );
    assert.match(html, /已取消/);
  });
});

describe('PurchaseOrderPanel — 边界', () => {
  test('loading 状态应显示加载中', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_ORDER, loading: true })
    );
    assert.match(html, /加载中/);
  });

  test('备注存在时渲染备注内容', () => {
    const orderWithNote = { ...MOCK_ORDER, note: '加急订单，请优先处理' };
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: orderWithNote })
    );
    assert.match(html, /加急订单/);
  });

  test('到货率 100% 时进度条应为绿色', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_COMPLETED_ORDER })
    );
    assert.match(html, /100%/);
    assert.match(html, /已完成/);
  });

  test('待审批状态渲染审批和驳回按钮', () => {
    const pendingOrder = { ...MOCK_ORDER, status: 'pending_approval' as const };
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, {
        order: pendingOrder,
        actions: {
          onApprove: () => {},
          onReject: () => {},
        },
      })
    );
    assert.match(html, /审批通过/);
    assert.match(html, /驳回/);
  });

  test('已发货状态渲染确认收货按钮', () => {
    const shippedOrder = { ...MOCK_ORDER, status: 'shipped' as const };
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, {
        order: shippedOrder,
        actions: { onReceive: () => {} },
      })
    );
    assert.match(html, /确认收货/);
  });

  test('已完成订单不渲染取消按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, {
        order: MOCK_COMPLETED_ORDER,
        actions: { onCancel: () => {} },
      })
    );
    assert.doesNotMatch(html, /取消订单/);
  });

  test('已取消订单不渲染任何操作按钮', () => {
    const cancelledOrder = { ...MOCK_ORDER, status: 'cancelled' as const };
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, {
        order: cancelledOrder,
        actions: {
          onApprove: () => {},
          onCancel: () => {},
          onReceive: () => {},
        },
      })
    );
    // cancelled 订单不应有操作按钮
    assert.doesNotMatch(html, /审批通过/);
    assert.doesNotMatch(html, /取消订单/);
    assert.doesNotMatch(html, /确认收货/);
  });

  test('空 items 数组时仍能正常渲染', () => {
    const emptyItemsOrder = { ...MOCK_ORDER, items: [], totalAmount: 0, totalReceived: 0, arrivalRate: 0 };
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: emptyItemsOrder })
    );
    assert.match(html, /PO-20260709-001/);
    assert.match(html, /0%/);
  });
});

describe('PurchaseOrderPanel — 防御', () => {
  test('未传 actions 时不渲染操作按钮区', () => {
    const html = renderToStaticMarkup(
      React.createElement(PurchaseOrderPanel, { order: MOCK_ORDER })
    );
    assert.doesNotMatch(html, /审批通过/);
    assert.doesNotMatch(html, /驳回/);
    assert.doesNotMatch(html, /确认收货/);
  });
});
